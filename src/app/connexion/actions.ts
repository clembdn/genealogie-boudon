'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { creerJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'
import { verifierMotDePasse } from '@/lib/mot-de-passe'

const DUREE_30_JOURS_SEC = 60 * 60 * 24 * 30

export async function connexionAction(
  _prev: { erreur?: string } | null,
  formData: FormData,
): Promise<{ erreur?: string } | null> {
  const motDePasse = (formData.get('motDePasse')?.toString() ?? '').trim()
  const retour = formData.get('retour')?.toString() ?? '/admin'

  if (!motDePasse) {
    return { erreur: 'Saisis un mot de passe.' }
  }
  if (!(await verifierMotDePasse(motDePasse))) {
    return { erreur: 'Mot de passe incorrect.' }
  }

  const jeton = await creerJetonSession()
  const cookieStore = await cookies()
  cookieStore.set(NOM_COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DUREE_30_JOURS_SEC,
  })

  redirect(retour.startsWith('/admin') ? retour : '/admin')
}

export async function deconnexionAction() {
  const cookieStore = await cookies()
  cookieStore.delete(NOM_COOKIE_SESSION)
  redirect('/')
}
