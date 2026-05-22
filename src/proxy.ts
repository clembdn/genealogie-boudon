import { NextResponse, type NextRequest } from 'next/server'
import { verifierJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const jeton = request.cookies.get(NOM_COOKIE_SESSION)?.value
  if (await verifierJetonSession(jeton)) {
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*'],
}
