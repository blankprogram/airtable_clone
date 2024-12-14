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
          tableCount: 1,
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { tableId } = input;

      const table = await ctx.db.table.findUnique({
        where: { id: tableId },
        include: {
          columns: {
            select: {
              id: true,
              name: true,
              type: true,
            },
            orderBy: { createdAt: "asc" },
          },
          rows: {
            select: {
              id: true,
              cells: {
                select: {
                  value: true,
                  columnId: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!table) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
      }

      const rows = table.rows.map((row) => {
        const rowData = {
          id: row.id,
          ...Object.fromEntries(row.cells.map((cell) => [cell.columnId, cell.value])),
        };
        return rowData;
      });

      return {
        columns: table.columns.map((column) => ({
          id: column.id,
          name: column.name,
          type: column.type,
          accessorKey: String(column.id),
        })),
        rows,
        meta: {
          name: table.name,
          rowCount: rows.length,
        },
      };
    }),
    addRow: protectedProcedure
  .input(z.object({ tableId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const { tableId } = input;

    const newRow = await ctx.db.row.create({
      data: { tableId },
    });

    const columns = await ctx.db.column.findMany({
      where: { tableId },
      select: { id: true },
    });

    const cells = columns.map((column) => ({
      value: "",
      columnId: column.id,
      rowId: newRow.id,
    }));

    await ctx.db.cell.createMany({
      data: cells,
    });

    return {
      id: newRow.id,
      cells: cells.map((cell) => ({ columnId: cell.columnId, value: cell.value })),
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

    const newColumn = await ctx.db.column.create({
      data: { tableId, name, type },
    });

    const rows = await ctx.db.row.findMany({
      where: { tableId },
      select: { id: true },
    });

    const cells = rows.map((row) => ({
      value: "",
      columnId: newColumn.id,
      rowId: row.id,
    }));

    await ctx.db.cell.createMany({
      data: cells,
    });

    return {
      id: newColumn.id,
      name,
      type,
      accessorKey: String(newColumn.id),
      rows: cells.map((cell) => ({ rowId: cell.rowId, value: cell.value })),
    };
  }),


  
  editCell: protectedProcedure
  .input(
    z.object({
      rowId: z.number(),
      columnId: z.number(),
      value: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { rowId, columnId, value } = input;

    const cell = await ctx.db.cell.findUnique({
      where: {
        rowId_columnId: {
          rowId,
          columnId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!cell) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cell not found",
      });
    }


    await ctx.db.cell.update({
      where: {
        rowId_columnId: {
          rowId,
          columnId,
        },
      },
      data: {
        value,
      },
    });

    return {
      success: true,
      message: "Cell updated successfully",
    };
  }),

  addBulkRows: protectedProcedure
  .input(
    z.object({
      tableId: z.number(),
      rowCount: z.number().default(15000), // Default to 15,000 rows
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { tableId, rowCount } = input;

    // Fetch all columns for the table
    const columns = await ctx.db.column.findMany({
      where: { tableId },
      select: { id: true },
    });

    if (columns.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No columns found for the table.",
      });
    }
    const rows = Array.from({ length: rowCount }, () => ({ tableId }));

    const createdRows = await ctx.db.$transaction(async (prisma) => {
      const newRows = await prisma.row.createMany({
        data: rows,
        skipDuplicates: true,
      });

      return prisma.row.findMany({
        where: { tableId },
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: rowCount,
      });
    });

    const cells = createdRows.flatMap((row) =>
      columns.map((column) => ({
        value: "",
        columnId: column.id,
        rowId: row.id,
      }))
    );

    await ctx.db.cell.createMany({
      data: cells,
      skipDuplicates: true,
    });

    const responseRows = createdRows.map((row) => ({
      id: row.id,
      cells: cells
        .filter((cell) => cell.rowId === row.id)
        .map((cell) => ({ columnId: cell.columnId, value: cell.value })),
    }));

    return {
      rows: responseRows,
      success: true,
      message: `${rowCount} rows and their corresponding cells added successfully.`,
    };
  }),


    
    

});
