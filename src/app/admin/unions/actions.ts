'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { UnionNature, UnionCauseFin } from '@prisma/client'
import { prisma } from '@/lib/db'

export type EtatFormulaireUnion = { erreur?: string } | null

const NATURES: readonly UnionNature[] = ['inconnue', 'mariage', 'union_libre']
const CAUSES: readonly UnionCauseFin[] = ['divorce', 'deces', 'separation']

function lireString(v: FormDataEntryValue | null): string {
  return v?.toString().trim() ?? ''
}

function lireStringOpt(v: FormDataEntryValue | null): string | null {
  const s = lireString(v)
  return s.length > 0 ? s : null
}

function lireNature(v: FormDataEntryValue | null): UnionNature {
  const s = lireString(v) as UnionNature
  return NATURES.includes(s) ? s : 'inconnue'
}

function lireCauseFin(v: FormDataEntryValue | null): UnionCauseFin | null {
  const s = lireString(v) as UnionCauseFin
  return CAUSES.includes(s) ? s : null
}

function donneesUnion(formData: FormData) {
  const partenaire1Id = lireStringOpt(formData.get('partenaire1Id'))
  const partenaire2Id = lireStringOpt(formData.get('partenaire2Id'))
  if (!partenaire1Id && !partenaire2Id) {
    throw new Error('Au moins un partenaire est requis.')
  }
  if (partenaire1Id && partenaire1Id === partenaire2Id) {
    throw new Error('Les deux partenaires doivent être différents.')
  }
  return {
    partenaire1Id,
    partenaire2Id,
    nature: lireNature(formData.get('nature')),
    dateDebut: lireStringOpt(formData.get('dateDebut')),
    lieuDebut: lireStringOpt(formData.get('lieuDebut')),
    dateFin: lireStringOpt(formData.get('dateFin')),
    causeFin: lireCauseFin(formData.get('causeFin')),
    notes: lireStringOpt(formData.get('notes')),
  }
}

export async function creerUnionAction(
  _prev: EtatFormulaireUnion,
  formData: FormData,
): Promise<EtatFormulaireUnion> {
  let data
  try {
    data = donneesUnion(formData)
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Données invalides.' }
  }
  const cree = await prisma.union.create({ data })
  revalidatePath('/admin/unions')
  revalidatePath('/')
  redirect(`/admin/unions/${cree.id}`)
}

export async function mettreAJourUnionAction(
  id: string,
  _prev: EtatFormulaireUnion,
  formData: FormData,
): Promise<EtatFormulaireUnion> {
  let data
  try {
    data = donneesUnion(formData)
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Données invalides.' }
  }
  await prisma.union.update({ where: { id }, data })
  revalidatePath('/admin/unions')
  revalidatePath(`/admin/unions/${id}`)
  revalidatePath('/')
  return null
}

export async function supprimerUnionAction(id: string): Promise<void> {
  await prisma.union.delete({ where: { id } })
  revalidatePath('/admin/unions')
  revalidatePath('/')
  redirect('/admin/unions')
}
