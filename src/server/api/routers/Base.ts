import { z } from "zod";
import { faker } from '@faker-js/faker';
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type ColumnFiltersState, type SortingState, type UpdateData } from "~/app/_components/tableTypes";
import { type JsonValue } from "@prisma/client/runtime/library";


function transformView(view: {
  id: number;
  name: string;
  sorting: JsonValue;
  filters: JsonValue;
  columnVisibility: JsonValue;
}) {
  function parseJson<T>(value: JsonValue, defaultValue: T): T {
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  return {
    id: view.id,
    name: view.name,
    sorting: parseJson<SortingState>(view.sorting, []),
    filters: parseJson<ColumnFiltersState>(view.filters, []),
    columnVisibility: parseJson<Record<string, boolean>>(view.columnVisibility, {}),
  };
}


export const baseRouter = createTRPCRouter({
  getBasesForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const bases = await ctx.db.base.findMany({
      where: { createdById: userId },
      include: {
        tables: {
          select: { id: true },
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

      await ctx.db.view.create({
        data: {
          name: "View 1",
          tableId: newTable.id,
          sorting: JSON.stringify([]),
          filters: JSON.stringify([]),
          columnVisibility: JSON.stringify({ [nameColumn.id]: true }),
        },
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
      const { baseId, name } = input;

      const newTable = await ctx.db.$transaction(async (prisma) => {
        const tableCount = await prisma.table.count({
          where: { baseId },
        });

        const table = await prisma.table.create({
          data: {
            name: name ?? `Table ${tableCount + 1}`,
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


        await prisma.view.create({
          data: {
            name: "View 1",
            tableId: table.id,
            sorting: JSON.stringify([]),
            filters: JSON.stringify([]),
            columnVisibility: JSON.stringify({ [column.id]: true }),
          },
        });

        return table;
      });

      return newTable;
    }),

    getTableData: protectedProcedure
  .input(
    z.object({
      tableId: z.number(),
      limit: z.number(),
      cursor: z.number().nullish(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { tableId, limit, cursor } = input;

    const table = await ctx.db.table.findUnique({
      where: { id: tableId },
      include: {
        columns: {
          select: { id: true, name: true, type: true },
        },
        views: {
          orderBy: {createdAt: 'asc'},
          select: {
            id: true,
            name: true,
            sorting: true,
            filters: true,
            columnVisibility: true,
          },
        },
      },
    });

    if (!table) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
    }

    const rows = await ctx.db.row.findMany({
      where: { tableId },
      take: limit + 1,
      skip: cursor ? 1 : 0,
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
    });

    let nextCursor: number | undefined = undefined;
    if (rows.length > limit) {
      const nextItem = rows.pop();
      nextCursor = nextItem?.id;
    }

    return {
      columns: new Map(
        table.columns.map((column) => [
          column.id,
          { name: column.name, type: column.type as "TEXT" | "NUMBER" },
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
      views: table.views.map(transformView),
      nextCursor,
    };
  }),


  addRow: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { tableId } = input;

      const columns = await ctx.db.column.findMany({
        where: { tableId },
        select: { id: true },
      });

      const result = await ctx.db.$transaction(async (prisma) => {
        const newRow = await prisma.row.create({
          data: { tableId },
        });

        const cellsData = columns.map((column) => ({
          value: "",
          columnId: column.id,
          rowId: newRow.id,
        }));

        await prisma.cell.createMany({ data: cellsData });

        const createdCells = await prisma.cell.findMany({
          where: { rowId: newRow.id },
          select: { id: true, columnId: true, value: true },
        });

        const cellsMap = new Map(
          createdCells.map((cell) => [
            cell.columnId,
            { cellId: cell.id },
          ])
        );

        return { id: newRow.id, cells: cellsMap };
      });

      return result;
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

      const cellsData = rows.map((row) => ({
        value: "",
        columnId: newColumn.id,
        rowId: row.id,
      }));

      await ctx.db.cell.createMany({ data: cellsData });

      const createdCells = await ctx.db.cell.findMany({
        where: { columnId: newColumn.id },
        select: { id: true, rowId: true },
      });

      const updatedRows = new Map(
        createdCells.map((cell) => [
          cell.rowId,
          {
            cells: new Map([[newColumn.id, { cellId: cell.id }]]),
          },
        ])
      );

      const columnMap = new Map([[newColumn.id, { name, type }]]);

      return {
        columns: columnMap,
        rows: updatedRows,
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

  addBulkRows: protectedProcedure
    .input(
      z.object({
        tableId: z.number(),
        rowCount: z.number().default(15000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tableId, rowCount } = input;

      const columns = await ctx.db.column.findMany({
        where: { tableId },
        select: { id: true },
      });


      const rowsData = Array.from({ length: rowCount }, () => ({ tableId }));
      const createdRows = await ctx.db.$transaction(async (prisma) => {
        await prisma.row.createMany({ data: rowsData });

        return prisma.row.findMany({
          where: { tableId },
          select: { id: true },
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

      await ctx.db.cell.createMany({ data: cells, skipDuplicates: true });

      const createdCells = await ctx.db.cell.findMany({
        where: {
          rowId: { in: createdRows.map((row) => row.id) },
        },
        select: { id: true, value: true, rowId: true, columnId: true },
      });

      const rowsMap = new Map(
        createdRows.map((row) => [
          row.id,
          {
            cells: new Map(
              createdCells
                .filter((cell) => cell.rowId === row.id)
                .map((cell) => [
                  cell.columnId,
                  { cellId: cell.id, value: cell.value },
                ])
            ),
          },
        ])
      );

      return {
        rows: rowsMap,
      };
    }),

    updateView: protectedProcedure
    .input(
      z.object({
        viewId: z.number(),
        sorting: z.array(
          z.object({
            id: z.string(),
            desc: z.boolean(),
          })
        ).optional(),
        filters: z.array(
          z.object({
            id: z.string(),
            value: z.object({
              operator: z.string(),
              value: z.union([z.string(), z.number()]).optional(),
            }),
          })
        ).optional(),
        columnVisibility: z.record(z.string(), z.boolean()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { viewId, sorting, filters, columnVisibility } = input;
  
      const updateData: UpdateData = {};
      if (sorting) updateData.sorting = JSON.stringify(sorting);
      if (filters) updateData.filters = JSON.stringify(filters);
      if (columnVisibility) updateData.columnVisibility = JSON.stringify(columnVisibility);
  
      const updatedView = await ctx.db.view.update({
        where: { id: viewId },
        data: updateData,
      });
  
      return transformView(updatedView);
    }),
  
  
    createViewForTable: protectedProcedure
  .input(
    z.object({
      tableId: z.number(),
      name: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { tableId, name } = input;

    const columns = await ctx.db.column.findMany({
      where: { tableId },
      select: { id: true },
    });

    const defaultVisibility = columns.reduce<Record<string, boolean>>(
      (acc, column) => {
        acc[column.id.toString()] = true;
        return acc;
      },
      {}
    );

    const newView = await ctx.db.view.create({
      data: {
        name: name ?? `New View`,
        tableId,
        sorting: JSON.stringify([]),
        filters: JSON.stringify([]),
        columnVisibility: JSON.stringify(defaultVisibility),
      },
    });

    return transformView(newView);
  }),




});
