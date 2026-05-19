import { router } from '../trpc';
import { personRouter } from './person';
import { unionRouter } from './union';
import { parentChildRouter } from './parentChild';
import { adminRouter } from './admin';
import { treeRouter } from './tree';
import { boxRouter } from './box';

export const appRouter = router({
  person: personRouter,
  union: unionRouter,
  parentChild: parentChildRouter,
  admin: adminRouter,
  tree: treeRouter,
  box: boxRouter,
});

export type AppRouter = typeof appRouter;
