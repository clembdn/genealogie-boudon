'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma, UnionNature, UnionCauseFin } from '@prisma/client'
import { prisma } from '@/lib/db'

function lireChamps(formData: FormData): Prisma.UnionUncheckedCreateInput {
  const texte = (cle: string): string | null => {
    const valeur = String(formData.get(cle) ?? '').trim()
    return valeur.length > 0 ? valeur : null
  }
  const causeFin = texte('causeFin')
  return {
    partenaire1Id: texte('partenaire1Id'),
    partenaire2Id: texte('partenaire2Id'),
    nature: (String(formData.get('nature') ?? 'inconnue') as UnionNature),
    dateDebut: texte('dateDebut'),
    lieuDebut: texte('lieuDebut'),
    dateFin: texte('dateFin'),
    causeFin: causeFin ? (causeFin as UnionCauseFin) : null,
    notes: texte('notes'),
  }
}

export async function creerUnion(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const champs = lireChamps(formData)
  if (!champs.partenaire1Id && !champs.partenaire2Id) {
    return 'Renseignez au moins un partenaire.'
  }
  try {
    await prisma.union.create({ data: champs })
  } catch {
    return 'Enregistrement impossible : un partenaire selectionne est introuvable.'
  }
  revalidatePath('/admin/unions')
  redirect('/admin/unions')
}

export async function modifierUnion(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const id = String(formData.get('id') ?? '')
  if (!id) return 'Identifiant manquant.'
  const champs = lireChamps(formData)
  if (!champs.partenaire1Id && !champs.partenaire2Id) {
    return 'Renseignez au moins un partenaire.'
  }
  try {
    await prisma.union.update({ where: { id }, data: champs })
  } catch {
    return 'Modification impossible : l union ou un partenaire est introuvable.'
  }
  revalidatePath('/admin/unions')
  redirect('/admin/unions')
}

export async function supprimerUnion(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (id) {
    await prisma.union.delete({ where: { id } })
    revalidatePath('/admin/unions')
  }
}
