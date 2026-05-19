import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

const ParentChildInput = z.object({
  parentId: z.string(),
  childId: z.string(),
  type: z.enum(['BIOLOGICAL', 'ADOPTIVE', 'STEP', 'LEGAL', 'UNKNOWN']).optional(),
  notes: z.string().optional(),
});

export const parentChildRouter = router({
  list: protectedProcedure.query(() =>
    prisma.parentChild.findMany({
      include: { parent: true, child: true },
      orderBy: { createdAt: 'desc' },
    })
  ),

  create: adminProcedure.input(ParentChildInput).mutation(({ input }) =>
    prisma.parentChild.create({ data: input })
  ),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) =>
      prisma.parentChild.delete({ where: { id: input.id } })
    ),
});
