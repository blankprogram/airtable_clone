import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const baseRouter = createTRPCRouter({
  // Get all bases for the current user
  getBasesForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const bases = await ctx.db.base.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        name: true,
        theme: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return bases;
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

      return newBase;
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
});
