import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VueArbre } from '@/components/arbre/VueArbre'
import { classesBouton } from '@/components/ui/classes-bouton'

export const dynamic = 'force-dynamic'

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

  const [personnes, unions, racine] = await Promise.all([
    prisma.person.findMany({
      include: { photoPrincipale: { select: { url: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.union.findMany(),
    prisma.person.findFirst({
      where: { racineParDefaut: true },
      select: { id: true },
    }),
  ])

  // Priorité : ?focus= dans l'URL > racine définie côté admin > première personne.
  const idInitial = focus ?? racine?.id ?? null

  if (personnes.length === 0) {
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
    />
  )
}
