import { cache } from 'react'
import { prisma } from '@/lib/db'
import { slugPersonne } from './format'
import { getRelationsPersonne } from '@/lib/genealogy/relations'

/**
 * Charge l'index minimal des personnes pour résoudre slug → id.
 * Caché au niveau requête (React.cache) : appels multiples = un seul aller-retour.
 */
export const chargerIndexPersonnes = cache(async () => {
  return prisma.person.findMany({
    select: {
      id: true,
      nom: true,
      prenoms: true,
      naissanceDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
})

/**
 * Résout un slug en id. En cas de collision, retourne le premier créé
 * (déterministe). Retourne null si aucune correspondance.
 */
export async function resoudreSlug(slug: string): Promise<string | null> {
  const index = await chargerIndexPersonnes()
  const match = index.find((p) => slugPersonne(p) === slug)
  return match?.id ?? null
}

/**
 * Charge toutes les unions et personnes (caché par requête) pour calculer
 * les relations sans relancer la requête à chaque page.
 */
export const chargerArbreComplet = cache(async () => {
  const [personnes, unions] = await Promise.all([
    prisma.person.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.union.findMany(),
  ])
  return { personnes, unions }
})

/**
 * Charge tout ce qu'il faut pour afficher la fiche détaillée d'une personne :
 * la personne complète (photo + médias), ses relations, et toutes les autres
 * personnes/unions nécessaires aux relations.
 */
export async function chargerDetailPersonne(id: string) {
  const [personne, arbre] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: {
        photoPrincipale: { select: { url: true } },
        medias: { orderBy: { ordre: 'asc' } },
      },
    }),
    chargerArbreComplet(),
  ])
  if (!personne) return null

  const relations = getRelationsPersonne(personne, arbre.unions, arbre.personnes)
  return { personne, relations, medias: personne.medias }
}
