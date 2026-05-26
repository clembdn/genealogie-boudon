import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ContenuDetailPersonne } from '@/components/personne/ContenuDetailPersonne'
import { chargerDetailPersonne, resoudreSlug } from '@/lib/personne/charger'
import { formatDates, nomComplet } from '@/lib/personne/format'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const id = await resoudreSlug(slug)
  if (!id) return { title: 'Personne introuvable' }

  const data = await chargerDetailPersonne(id)
  if (!data) return { title: 'Personne introuvable' }

  const titre = nomComplet(data.personne)
  const dates = formatDates(data.personne)
  const description = [
    data.personne.recit?.slice(0, 160),
    dates ? `(${dates})` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const photo = data.personne.photoPrincipale?.url
  return {
    title: titre,
    description: description || `Fiche généalogique de ${titre}`,
    openGraph: {
      title: titre,
      description,
      images: photo ? [{ url: photo }] : undefined,
    },
  }
}

export default async function PagePersonne({ params }: Props) {
  const { slug } = await params
  const id = await resoudreSlug(slug)
  if (!id) notFound()

  const data = await chargerDetailPersonne(id)
  if (!data) notFound()

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <nav className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-brume hover:text-encre"
        >
          <ArrowLeft size={14} aria-hidden />
          Retour à l&apos;arbre
        </Link>
      </nav>

      <ContenuDetailPersonne
        personne={data.personne}
        relations={data.relations}
        medias={data.medias}
      />
    </article>
  )
}
