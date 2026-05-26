import { NextResponse, type NextRequest } from 'next/server'
import { verifierJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const jeton = request.cookies.get(NOM_COOKIE_SESSION)?.value
  if (await verifierJetonSession(jeton)) {
    return NextResponse.next()
  }
  const cible = new URL('/connexion', request.url)
  cible.searchParams.set('retour', request.nextUrl.pathname)
  return NextResponse.redirect(cible)
}

export const config = {
  matcher: ['/admin/:path*'],
}
