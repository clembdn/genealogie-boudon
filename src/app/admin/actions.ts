'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NOM_COOKIE_SESSION } from '@/lib/session'

export async function deconnexion(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(NOM_COOKIE_SESSION)
  redirect('/login')
}
