'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export type EtatFormulaireFamille = { erreur?: string; succes?: boolean } | null

function lireString(v: FormDataEntryValue | null): string {
  return v?.toString().trim() ?? ''
}

function lireStringOpt(v: FormDataEntryValue | null): string | null {
  const s = lireString(v)
  return s.length > 0 ? s : null
}

function lireInt(v: FormDataEntryValue | null, defaut = 0): number {
  const n = parseInt(v?.toString() ?? '', 10)
  return Number.isFinite(n) ? n : defaut
}

export async function mettreAJourFamilleAction(
  id: string,
  _prev: EtatFormulaireFamille,
  formData: FormData,
): Promise<EtatFormulaireFamille> {
  const nom = lireString(formData.get('nom'))
  if (nom.length === 0) {
    return { erreur: 'Le nom est obligatoire.' }
  }
  const description = lireStringOpt(formData.get('description'))
  const ordre = lireInt(formData.get('ordre'))

  await prisma.famille.update({
    where: { id },
    data: { nom, description, ordre },
  })

  revalidatePath('/admin/familles')
  revalidatePath(`/admin/familles/${id}`)
  revalidatePath('/familles')

  const famille = await prisma.famille.findUnique({
    where: { id },
    select: { slug: true },
  })
  if (famille) revalidatePath(`/familles/${famille.slug}`)

  return { succes: true }
}
