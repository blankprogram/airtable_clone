import { z } from "zod";
import { faker } from '@faker-js/faker';
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const baseRouter = createTRPCRouter({
  getBasesForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const bases = await ctx.db.base.findMany({
      where: { createdById: userId },
      include: {
        tables: {
          select: { id: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return bases.map((base) => ({
      id: base.id,
      name: base.name,
      theme: base.theme,
      updatedAt: base.updatedAt,
      firstTableId: base.tables[0]?.id ?? null,
    }));
  }),



  createBaseForUser: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        theme: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const newBase = await ctx.db.base.create({
        data: {
          name: input.name,
          theme: input.theme,
          createdById: userId,
        },
      });

      const newTable = await ctx.db.table.create({
        data: {
          name: `Table 1`,
          baseId: newBase.id,
        },
      });

      const nameColumn = await ctx.db.column.create({
        data: {
          name: "Name",
          type: "TEXT",
          tableId: newTable.id,
        },
      });

      const rows = Array.from({ length: 4 }, () => ({ tableId: newTable.id }));
      await ctx.db.row.createMany({
        data: rows,
      });

      const createdRows = await ctx.db.row.findMany({
        where: { tableId: newTable.id },
        select: { id: true },
      });

      const cells = createdRows.map((row) => ({
        value: faker.person.firstName(),
        columnId: nameColumn.id,
        rowId: row.id,
      }));
      await ctx.db.cell.createMany({
        data: cells,
      });

      return {
        ...newBase,
        firstTableId: newTable.id,
      };
    }),

  deleteBase: protectedProcedure
    .input(
      z.object({
        baseId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const base = await ctx.db.base.findUnique({
        where: { id: input.baseId },
        select: { createdById: true },
      });

      if (!base) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (base.createdById !== userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
        });
      }

      await ctx.db.base.delete({
        where: { id: input.baseId },
      });

      return { success: true, message: "Base deleted successfully" };
    }),

  getBaseById: protectedProcedure
    .input(z.object({ baseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.base.findUnique({
        where: { id: input.baseId },
        select: {
          name: true,
          theme: true,
          tables: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base not found" });
      }

      return base;
    }),

  updateBase: protectedProcedure
    .input(
      z.object({
        baseId: z.number(),
        name: z.string().optional(),
        theme: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { baseId, name, theme } = input;

      const updatedBase = await ctx.db.base.update({
        where: { id: baseId },
        data: { name, theme },
      });

      return updatedBase;
    }),

  createTableForBase: protectedProcedure
    .input(
      z.object({
        baseId: z.number(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { baseId } = input;

      const newTable = await ctx.db.$transaction(async (prisma) => {
        const base = await prisma.base.update({
          where: { id: baseId },
          data: { tableCount: { increment: 1 } },
          select: { tableCount: true },
        });

        const table = await prisma.table.create({
          data: {
            name: `Table ${base.tableCount}`,
            baseId: baseId,
          },
        });

        const column = await prisma.column.create({
          data: {
            name: "Name",
            type: "TEXT",
            tableId: table.id,
          },
        });



        const rows = Array.from({ length: 4 }, () => ({ tableId: table.id }));
        await prisma.row.createMany({ data: rows });

        const createdRows = await prisma.row.findMany({
          where: { tableId: table.id },
          select: { id: true },
        });

        const cells = createdRows.map((row) => ({
          value: faker.person.firstName(),
          columnId: column.id,
          rowId: row.id,
        }));

        await prisma.cell.createMany({ data: cells });

        return table;
      });

      return newTable;
    }),
    getTableData: protectedProcedure
    .input(
        z.object({
            tableId: z.number(),
            limit: z.number().min(1).max(100).default(50), // Number of rows per page
            cursor: z.number().nullish(), // Cursor for pagination
        })
    )
    .query(async ({ ctx, input }) => {
        const { tableId, limit, cursor } = input;

        // Fetch the table structure (columns)
        const table = await ctx.db.table.findUnique({
            where: { id: tableId },
            include: {
                columns: {
                    select: { id: true, name: true, type: true },
                },
            },
        });

        if (!table) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
        }

        // Fetch rows with cursor-based pagination
        const rows = await ctx.db.row.findMany({
            where: { tableId },
            take: limit + 1, // Fetch one extra row to determine if there’s more data
            skip: cursor ? 1 : 0, // Skip the current cursor if present
            cursor: cursor ? { id: cursor } : undefined,
            include: {
                cells: {
                    select: {
                        id: true,
                        value: true,
                        columnId: true,
                    },
                },
            },
            orderBy: { id: 'asc' }, // Ensure a consistent order
        });


        let nextCursor: number | undefined = undefined;
        if (rows.length > limit) {
            const nextItem = rows.pop(); // Remove the extra item from results
            nextCursor = nextItem?.id; // Set next cursor to the last item's ID
        }

        return {
            columns: new Map(
                table.columns.map((column) => [
                    column.id,
                    { name: column.name, type: column.type as 'TEXT' | 'NUMBER' },
                ])
            ),
            rows: new Map(
                rows.map((row) => [
                    row.id,
                    {
                        cells: new Map(
                            row.cells.map((cell) => [
                                cell.columnId,
                                { cellId: cell.id, value: cell.value },
                            ])
                        ),
                    },
                ])
            ),
            nextCursor
        };
    }),




  

    addRow: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .mutation(async ({ ctx, input }) => {
        const { tableId } = input;

        // Create the row and fetch columns simultaneously
        const [newRow, columns] = await Promise.all([
            ctx.db.row.create({ data: { tableId } }),
            ctx.db.column.findMany({
                where: { tableId },
                select: { id: true },
            }),
        ]);

        // Prepare cells for the new row
        const cells = columns.map((column) => ({
            value: "",
            columnId: column.id,
            rowId: newRow.id,
        }));

        // Batch create cells
        await ctx.db.cell.createMany({ data: cells });

        // Fetch created cells with their IDs
        const createdCells = await ctx.db.cell.findMany({
            where: { rowId: newRow.id },
            select: { id: true, value: true, columnId: true },
        });

        // Map cells to columnId
        const cellsMap = new Map(
            createdCells.map((cell) => [
                cell.columnId,
                { cellId: cell.id, value: cell.value },
            ])
        );

        return {
            id: newRow.id,
            cells: cellsMap, // Map of columnId to CellData
        };
    }),









    addColumn: protectedProcedure
    .input(
        z.object({
            tableId: z.number(),
            name: z.string(),
            type: z.enum(["TEXT", "NUMBER"]).default("TEXT"),
        })
    )
    .mutation(async ({ ctx, input }) => {
        const { tableId, name, type } = input;

        // Create the column and fetch rows simultaneously
        const [newColumn, rows] = await Promise.all([
            ctx.db.column.create({
                data: { tableId, name, type },
            }),
            ctx.db.row.findMany({
                where: { tableId },
                select: { id: true },
            }),
        ]);

        // Prepare cells for the new column
        const cells = rows.map((row) => ({
            value: "",
            columnId: newColumn.id,
            rowId: row.id,
        }));

        // Batch create cells
        await ctx.db.cell.createMany({ data: cells });

        // Fetch created cells with their IDs
        const createdCells = await ctx.db.cell.findMany({
            where: { columnId: newColumn.id },
            select: { id: true, value: true, rowId: true },
        });

        // Map cells to rowId
        const rowsMap = new Map(
            createdCells.map((cell) => [
                cell.rowId,
                { cellId: cell.id, value: cell.value },
            ])
        );

        return {
            id: newColumn.id,
            rows: rowsMap, // Map of rowId to CellData for the new column
        };
    }),







    editCell: protectedProcedure
    .input(
        z.object({
            cellId: z.number(),
            value: z.string(),
        })
    )
    .mutation(async ({ ctx, input }) => {
        const { cellId, value } = input;

        await ctx.db.cell.update({
            where: { id: cellId },
            data: { value },
        });

        return cellId;

    }),


});
