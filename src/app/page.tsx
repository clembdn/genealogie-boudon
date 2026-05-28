import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VueArbre } from '@/components/arbre/VueArbre'
import { classesBouton } from '@/components/ui/classes-bouton'
import { categoriserDepuisDeCujus } from '@/lib/genealogy/categorisation'
import type { CategorieParente } from '@/lib/genealogy/categories'

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

  // Cartouches pour les autres familles (ordre conservé, arbre exclu).
  const autresFamilles = famillesAvecCount
    .filter((f) => f.slug !== SLUG_ARBRE_PRINCIPAL)
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
      autresFamilles={autresFamilles}
    />
  )
}
