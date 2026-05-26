'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Sexe } from '@prisma/client'
import { prisma } from '@/lib/db'

export type EtatFormulairePersonne = { erreur?: string } | null

const SEXES: readonly Sexe[] = ['inconnu', 'homme', 'femme']

function lireSexe(v: FormDataEntryValue | null): Sexe {
  const s = (v?.toString() ?? '').trim() as Sexe
  return SEXES.includes(s) ? s : 'inconnu'
}

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

function lireBool(v: FormDataEntryValue | null): boolean {
  return v !== null && v !== ''
}

function donneesPersonne(formData: FormData) {
  const nom = lireString(formData.get('nom'))
  if (nom.length === 0) {
    throw new Error('Le nom est obligatoire.')
  }
  return {
    nom,
    prenoms: lireString(formData.get('prenoms')),
    surnom: lireStringOpt(formData.get('surnom')),
    sexe: lireSexe(formData.get('sexe')),
    naissanceDate: lireStringOpt(formData.get('naissanceDate')),
    naissanceLieu: lireStringOpt(formData.get('naissanceLieu')),
    decesDate: lireStringOpt(formData.get('decesDate')),
    decesLieu: lireStringOpt(formData.get('decesLieu')),
    parrain: lireStringOpt(formData.get('parrain')),
    marraine: lireStringOpt(formData.get('marraine')),
    profession: lireStringOpt(formData.get('profession')),
    branche: lireStringOpt(formData.get('branche')),
    recit: lireStringOpt(formData.get('recit')),
    vivant: lireBool(formData.get('vivant')),
    ordreFratrie: lireInt(formData.get('ordreFratrie')),
    racineParDefaut: lireBool(formData.get('racineParDefaut')),
    unionParentaleId: lireStringOpt(formData.get('unionParentaleId')),
  }
}

/**
 * Assure qu'au plus une personne porte le drapeau « racine par défaut » :
 * si on l'active sur `id`, on le retire des autres.
 */
async function appliquerExclusiviteRacine(
  estRacine: boolean,
  idActuel: string | null,
) {
  if (!estRacine) return
  await prisma.person.updateMany({
    where: idActuel
      ? { racineParDefaut: true, id: { not: idActuel } }
      : { racineParDefaut: true },
    data: { racineParDefaut: false },
  })
}

export async function creerPersonneAction(
  _prev: EtatFormulairePersonne,
  formData: FormData,
): Promise<EtatFormulairePersonne> {
  let data
  try {
    data = donneesPersonne(formData)
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Données invalides.' }
  }

  const cree = await prisma.person.create({ data })
  await appliquerExclusiviteRacine(data.racineParDefaut, cree.id)
  revalidatePath('/admin/personnes')
  revalidatePath('/')
  redirect(`/admin/personnes/${cree.id}`)
}

export async function mettreAJourPersonneAction(
  id: string,
  _prev: EtatFormulairePersonne,
  formData: FormData,
): Promise<EtatFormulairePersonne> {
  let data
  try {
    data = donneesPersonne(formData)
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Données invalides.' }
  }

  const photoPrincipaleId = lireStringOpt(formData.get('photoPrincipaleId'))

  await prisma.person.update({
    where: { id },
    data: { ...data, photoPrincipaleId },
  })
  await appliquerExclusiviteRacine(data.racineParDefaut, id)
  revalidatePath('/admin/personnes')
  revalidatePath(`/admin/personnes/${id}`)
  revalidatePath('/')
  return null
}

export async function supprimerPersonneAction(id: string): Promise<void> {
  await prisma.person.delete({ where: { id } })
  revalidatePath('/admin/personnes')
  revalidatePath('/')
  redirect('/admin/personnes')
}
