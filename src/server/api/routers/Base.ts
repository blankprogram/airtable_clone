import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const baseRouter = createTRPCRouter({
  getBasesForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
  
    const bases = await ctx.db.base.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        name: true,
        theme: true,
        updatedAt: true,
        tables: {
          select: {
            id: true,
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  
    return bases.map((base) => ({
      ...base,
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
        name: "Default Table",
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
      value: "",
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
      select: { name: true },
    });

    if (!base) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Base not found" });
    }

    return base;
  }),

});
