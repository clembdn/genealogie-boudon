import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const treeRouter = router({
  getAll: protectedProcedure.query(async () => {
    const [persons, unions, parentChildLinks] = await Promise.all([
      prisma.person.findMany({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.union.findMany({ include: { box: true } }),
      prisma.parentChild.findMany(),
    ]);
    return { persons, unions, parentChildLinks };
  }),
});
