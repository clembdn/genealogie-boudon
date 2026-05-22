'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifierMotDePasse } from '@/lib/mot-de-passe'
import { creerJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'

export async function connexion(
  _etatPrecedent: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const motDePasse = String(formData.get('motDePasse') ?? '')
  if (!(await verifierMotDePasse(motDePasse))) {
    return 'Mot de passe incorrect.'
  }
  const jeton = await creerJetonSession()
  const cookieStore = await cookies()
  cookieStore.set(NOM_COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/admin')
}
