import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const adminRouter = router({
  listUsers: adminProcedure.query(() =>
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  ),

  inviteUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      await auth.api.signUpEmail({ body: input });
      return { success: true };
    }),

  setUserRole: adminProcedure
    .input(z.object({ id: z.string(), role: z.enum(['ADMIN', 'VIEWER']) }))
    .mutation(({ input }) =>
      prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
      })
    ),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      if (input.id === ctx.session.user.id) {
        throw new Error('Impossible de supprimer votre propre compte.');
      }
      return prisma.user.delete({ where: { id: input.id } });
    }),
});
