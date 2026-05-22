'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma, Sexe } from '@prisma/client'
import { prisma } from '@/lib/db'

/** Lit les champs d'une personne depuis le formulaire. */
function lireChamps(formData: FormData): Prisma.PersonUncheckedCreateInput {
  const texte = (cle: string): string | null => {
    const valeur = String(formData.get(cle) ?? '').trim()
    return valeur.length > 0 ? valeur : null
  }
  return {
    nom: String(formData.get('nom') ?? '').trim(),
    prenoms: String(formData.get('prenoms') ?? '').trim(),
    surnom: texte('surnom'),
    sexe: (String(formData.get('sexe') ?? 'inconnu') as Sexe),
    naissanceDate: texte('naissanceDate'),
    naissanceLieu: texte('naissanceLieu'),
    decesDate: texte('decesDate'),
    decesLieu: texte('decesLieu'),
    parrain: texte('parrain'),
    marraine: texte('marraine'),
    profession: texte('profession'),
    recit: texte('recit'),
    branche: texte('branche'),
    vivant: formData.get('vivant') === 'on',
    ordreFratrie: Number(formData.get('ordreFratrie') ?? 0) || 0,
    notesImport: texte('notesImport'),
    unionParentaleId: texte('unionParentaleId'),
  }
}

export async function creerPersonne(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const champs = lireChamps(formData)
  if (!champs.nom) return 'Le nom est obligatoire.'
  await prisma.person.create({ data: champs })
  revalidatePath('/admin/personnes')
  redirect('/admin/personnes')
}

export async function modifierPersonne(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const id = String(formData.get('id') ?? '')
  if (!id) return 'Identifiant manquant.'
  const champs = lireChamps(formData)
  if (!champs.nom) return 'Le nom est obligatoire.'
  await prisma.person.update({ where: { id }, data: champs })
  revalidatePath('/admin/personnes')
  redirect('/admin/personnes')
}

export async function supprimerPersonne(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (id) {
    await prisma.person.delete({ where: { id } })
    revalidatePath('/admin/personnes')
  }
}
