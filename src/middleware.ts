import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protège tout sauf : routes API, sign-in, internes Next.js, fichiers statiques.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)'],
};
