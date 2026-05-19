import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const boxRouter = router({
  // Upsert : crée ou met à jour la Box d'une Union.
  // Sert à la fois pour persister la position et l'état déplié/replié.
  upsert: adminProcedure
    .input(
      z.object({
        unionId: z.string(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
        collapsed: z.boolean().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { unionId, ...data } = input;
      return prisma.box.upsert({
        where: { unionId },
        create: { unionId, ...data },
        update: data,
      });
    }),

  toggleCollapsed: adminProcedure
    .input(z.object({ unionId: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.box.findUnique({
        where: { unionId: input.unionId },
      });
      if (!existing) {
        return prisma.box.create({
          data: { unionId: input.unionId, collapsed: true },
        });
      }
      return prisma.box.update({
        where: { unionId: input.unionId },
        data: { collapsed: !existing.collapsed },
      });
    }),
});
