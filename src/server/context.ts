import { auth } from '@/lib/auth';

export async function createContext(opts: { req: Request }) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
