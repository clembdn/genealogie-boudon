import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

const UnionInput = z.object({
  partner1Id: z.string(),
  partner2Id: z.string(),
  type: z.enum(['MARRIAGE', 'CIVIL_UNION', 'PARTNERSHIP', 'UNKNOWN']).optional(),
  startDate: z.string().optional(),
  startPlace: z.string().optional(),
  endDate: z.string().optional(),
  endPlace: z.string().optional(),
  endReason: z.enum(['DIVORCE', 'DEATH', 'SEPARATION', 'ANNULMENT']).optional(),
  notes: z.string().optional(),
});

export const unionRouter = router({
  list: protectedProcedure.query(() =>
    prisma.union.findMany({
      include: { partner1: true, partner2: true, box: true },
      orderBy: { startDate: 'asc' },
    })
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) =>
      prisma.union.findUnique({
        where: { id: input.id },
        include: { partner1: true, partner2: true, box: true },
      })
    ),

  create: adminProcedure.input(UnionInput).mutation(({ input }) =>
    prisma.union.create({ data: input })
  ),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: UnionInput.partial() }))
    .mutation(({ input }) =>
      prisma.union.update({ where: { id: input.id }, data: input.data })
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) =>
      prisma.union.delete({ where: { id: input.id } })
    ),
});
