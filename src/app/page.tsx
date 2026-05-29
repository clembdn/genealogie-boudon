import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VueArbre } from '@/components/arbre/VueArbre'
import { classesBouton } from '@/components/ui/classes-bouton'
import { categoriserDepuisDeCujus } from '@/lib/genealogy/categorisation'
import type { CategorieParente } from '@/lib/genealogy/categories'
import type { LiaisonFamille } from '@/lib/arbre/liaisons'
import { couleurFamille } from '@/lib/arbre/liaisons'

export const dynamic = 'force-dynamic'

const SLUG_ARBRE_PRINCIPAL = 'arbre'

export const metadata: Metadata = {
  title: 'Accueil',
  description:
    "Vue interactive de l'arbre généalogique de la famille Boudon. Naviguez librement entre générations, ouvrez chaque fiche pour découvrir récits, photos et documents.",
}

type Props = {
  searchParams: Promise<{ focus?: string }>
}

export default async function PageArbre({ searchParams }: Props) {
  const { focus } = await searchParams

  const [toutesPersonnes, toutesUnions, racine, famillesAvecCount] =
    await Promise.all([
      prisma.person.findMany({
        include: { photoPrincipale: { select: { url: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.union.findMany(),
      prisma.person.findFirst({
        where: { racineParDefaut: true },
        select: { id: true },
      }),
      prisma.famille.findMany({
        orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
        select: {
          id: true,
          slug: true,
          nom: true,
          _count: { select: { personnes: true } },
        },
      }),
    ])

  // Catégorisation sur l'ensemble du graphe (cohérent quel que soit le sous-arbre affiché).
  const mapCategorie = categoriserDepuisDeCujus(
    racine?.id ?? null,
    toutesPersonnes,
    toutesUnions,
  )
  const categorieParPersonneId: Record<string, CategorieParente> = {}
  for (const [id, cat] of mapCategorie) categorieParPersonneId[id] = cat

  // Arbre principal = personnes rattachées à la famille « arbre ».
  // Fallback si la famille n'existe pas (DB pas encore importée) : on retombe sur toutes les personnes.
  const familleArbre = famillesAvecCount.find(
    (f) => f.slug === SLUG_ARBRE_PRINCIPAL,
  )
  const personnes = familleArbre
    ? toutesPersonnes.filter((p) => p.familleId === familleArbre.id)
    : toutesPersonnes

  // Unions à dessiner : celles dont au moins un partenaire est affiché.
  const idsAffichees = new Set(personnes.map((p) => p.id))
  const unions = familleArbre
    ? toutesUnions.filter(
        (u) =>
          (u.partenaire1Id && idsAffichees.has(u.partenaire1Id)) ||
          (u.partenaire2Id && idsAffichees.has(u.partenaire2Id)),
      )
    : toutesUnions

  // ── Liaisons famille ↔ arbre ──────────────────────────────────────────
  // Pour chaque famille « autre », trouver l'union qui la relie à l'arbre
  // principal : un partenaire dans « arbre », l'autre dans la famille cible.
  const personneParId = new Map(toutesPersonnes.map((p) => [p.id, p]))
  const familleParId = new Map(famillesAvecCount.map((f) => [f.id, f]))

  const liaisonsFamilles: (LiaisonFamille & { couleur: string })[] = []
  const famillesAvecLiaison = new Set<string>() // slugs des familles liées

  // Index des familles « autres » (hors arbre principal), ordonnées.
  const autresFamillesOrdonnees = famillesAvecCount.filter(
    (f) => f.slug !== SLUG_ARBRE_PRINCIPAL,
  )

  for (const u of unions) {
    if (!u.partenaire1Id || !u.partenaire2Id) continue

    const p1 = personneParId.get(u.partenaire1Id)
    const p2 = personneParId.get(u.partenaire2Id)
    if (!p1 || !p2) continue

    // Identifier lequel est côté « arbre » et lequel est externe.
    const p1EstArbre = p1.familleId === familleArbre?.id
    const p2EstArbre = p2.familleId === familleArbre?.id

    // On cherche une union « mixte » : un partenaire arbre + un externe.
    if (p1EstArbre === p2EstArbre) continue

    const personneArbre = p1EstArbre ? p1 : p2
    const personneExterne = p1EstArbre ? p2 : p1

    if (!personneExterne.familleId) continue
    const familleExterne = familleParId.get(personneExterne.familleId)
    if (!familleExterne || familleExterne.slug === SLUG_ARBRE_PRINCIPAL) continue

    // Éviter les doublons (une seule liaison par famille).
    if (famillesAvecLiaison.has(familleExterne.slug)) continue
    famillesAvecLiaison.add(familleExterne.slug)

    const indexFamille = autresFamillesOrdonnees.findIndex(
      (f) => f.slug === familleExterne.slug,
    )

    liaisonsFamilles.push({
      famille: {
        id: familleExterne.id,
        slug: familleExterne.slug,
        nom: familleExterne.nom,
        nbPersonnes: familleExterne._count.personnes,
      },
      unionId: u.id,
      personneArbreId: personneArbre.id,
      personneExterneId: personneExterne.id,
      couleur: couleurFamille(indexFamille >= 0 ? indexFamille : 0),
    })
  }

  // Cartouches pour les familles sans liaison (fallback overlay).
  const autresFamillesSansLiaison = autresFamillesOrdonnees
    .filter((f) => !famillesAvecLiaison.has(f.slug))
    .map((f) => ({
      id: f.id,
      slug: f.slug,
      nom: f.nom,
      nbPersonnes: f._count.personnes,
    }))

  // Priorité : ?focus= dans l'URL > racine définie côté admin > première personne.
  const idInitial = focus ?? racine?.id ?? null

  if (toutesPersonnes.length === 0) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
        <p className="font-sans text-sm uppercase tracking-[0.18em] text-brume">
          Arbre vide
        </p>
        <h1 className="mt-4 font-serif text-3xl text-encre sm:text-4xl">
          Aucune personne enregistrée pour l&apos;instant
        </h1>
        <p className="mt-3 max-w-sm text-base text-brume">
          La première fiche n&apos;a pas encore été ajoutée. Reviens un peu plus
          tard, ou contacte un administrateur.
        </p>
        <Link
          href="/connexion"
          className={`mt-8 ${classesBouton('secondaire', 'moyen')}`}
        >
          Espace administrateur
        </Link>
      </section>
    )
  }

  return (
    <VueArbre
      personnes={personnes}
      unions={unions}
      idInitial={idInitial}
      categorieParPersonneId={categorieParPersonneId}
      autresFamilles={autresFamillesSansLiaison.length > 0 ? autresFamillesSansLiaison : undefined}
      liaisonsFamilles={liaisonsFamilles}
    />
  )
}
