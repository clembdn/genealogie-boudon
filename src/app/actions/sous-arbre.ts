'use server'

import { prisma } from '@/lib/db'
import { categoriserDepuisDeCujus } from '@/lib/genealogy/categorisation'
import type { CategorieParente } from '@/lib/genealogy/categories'
import type { Person, Union } from '@prisma/client'

export type PersonneSousArbre = Person & {
  photoPrincipale?: { url: string } | null
}

export type DonneesSousArbre = {
  famille: {
    id: string
    slug: string
    nom: string
    description: string | null
    nbPersonnes: number
    nbPhotos: number
  }
  personnes: PersonneSousArbre[]
  unions: Union[]
  categorieParPersonneId: Record<string, CategorieParente>
}

/**
 * Charge personnes + unions d'une famille pour la modale "sous-arbre".
 * Inclut aussi les conjoints des personnes de la famille même s'ils sont
 * rattachés à une autre branche (sinon les couples seraient amputés).
 */
export async function chargerSousArbreFamille(
  slug: string,
): Promise<DonneesSousArbre | null> {
  const famille = await prisma.famille.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nom: true,
      description: true,
      _count: { select: { personnes: true, medias: true } },
    },
  })
  if (!famille) return null

  const [personnesFamille, toutesUnions, racine, toutesPersonnes, nbPhotos] =
    await Promise.all([
      prisma.person.findMany({
        where: { familleId: famille.id },
        include: { photoPrincipale: { select: { url: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.union.findMany(),
      prisma.person.findFirst({
        where: { racineParDefaut: true },
        select: { id: true },
      }),
      // Pour la catégorisation, on doit raisonner sur l'ensemble du graphe.
      prisma.person.findMany({
        select: {
          id: true,
          unionParentaleId: true,
        },
      }),
      prisma.media.count({
        where: { familleId: famille.id, type: 'photo' },
      }),
    ])

  const idsFamille = new Set(personnesFamille.map((p) => p.id))

  // Unions impliquant au moins une personne de la famille (pour garder les
  // conjoints externes et les filiations sortantes/entrantes).
  const unions = toutesUnions.filter(
    (u) =>
      (u.partenaire1Id && idsFamille.has(u.partenaire1Id)) ||
      (u.partenaire2Id && idsFamille.has(u.partenaire2Id)),
  )

  // Conjoints externes (autre partenaire d'une union où la personne de la
  // famille est l'un des deux) — chargés en complément pour dessiner les
  // unions en entier.
  const idsConjointsExternes = new Set<string>()
  for (const u of unions) {
    if (u.partenaire1Id && !idsFamille.has(u.partenaire1Id)) {
      idsConjointsExternes.add(u.partenaire1Id)
    }
    if (u.partenaire2Id && !idsFamille.has(u.partenaire2Id)) {
      idsConjointsExternes.add(u.partenaire2Id)
    }
  }

  const conjointsExternes =
    idsConjointsExternes.size === 0
      ? []
      : await prisma.person.findMany({
          where: { id: { in: [...idsConjointsExternes] } },
          include: { photoPrincipale: { select: { url: true } } },
        })

  const personnes = [...personnesFamille, ...conjointsExternes]

  // Catégorisation : recalculée à partir de l'ensemble du graphe pour rester
  // cohérente avec l'arbre principal.
  const personnesPourCategorisation = toutesPersonnes as Person[]
  const mapCategorie = categoriserDepuisDeCujus(
    racine?.id ?? null,
    personnesPourCategorisation,
    toutesUnions,
  )
  const categorieParPersonneId: Record<string, CategorieParente> = {}
  for (const p of personnes) {
    const cat = mapCategorie.get(p.id)
    if (cat) categorieParPersonneId[p.id] = cat
  }

  return {
    famille: {
      id: famille.id,
      slug: famille.slug,
      nom: famille.nom,
      description: famille.description,
      nbPersonnes: famille._count.personnes,
      nbPhotos,
    },
    personnes,
    unions,
    categorieParPersonneId,
  }
}
