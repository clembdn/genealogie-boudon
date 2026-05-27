import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Users } from 'lucide-react'
import { chargerFamilleParSlug } from '@/lib/famille/charger'
import { GalerieFamille } from '@/components/famille/GalerieFamille'
import { Carte } from '@/components/ui/Carte'
import { classesBouton } from '@/components/ui/classes-bouton'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const famille = await chargerFamilleParSlug(slug)
  if (!famille) return { title: 'Famille introuvable' }
  return {
    title: famille.nom,
    description: famille.description ?? `Page de la famille ${famille.nom}.`,
  }
}

export default async function PageFamille({ params }: Props) {
  const { slug } = await params
  const famille = await chargerFamilleParSlug(slug)
  if (!famille) notFound()

  const photos = famille.medias.filter((m) => m.type === 'photo')
  const documents = famille.medias.filter((m) => m.type === 'document')
  const premierePersonne = famille.personnes[0]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <Link
          href="/familles"
          className="text-sm text-brume hover:text-encre"
        >
          ← Toutes les familles
        </Link>
        <h1 className="font-serif text-4xl text-encre">{famille.nom}</h1>
        <p className="text-sm text-brume">
          {famille.personnes.length} personnes · {photos.length} photos · {documents.length} documents
        </p>
      </header>

      {famille.description && (
        <section className="max-w-none">
          {famille.description.split('\n').map((ligne, i) => (
            <p key={i} className="text-base text-encre">
              {ligne}
            </p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-encre">Photos</h2>
        <GalerieFamille photos={photos} />
      </section>

      {documents.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-encre">Documents</h2>
          <ul className="flex flex-col gap-2">
            {documents.map((m) => (
              <li key={m.id}>
                <Carte className="flex items-center gap-3 px-4 py-3">
                  <FileText size={18} aria-hidden className="text-brume shrink-0" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium text-encre hover:text-sauge"
                    >
                      {m.titre}
                    </a>
                    {m.description && (
                      <p className="truncate text-xs text-brume">{m.description}</p>
                    )}
                  </div>
                </Carte>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-encre">
          Personnes ({famille.personnes.length})
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {famille.personnes.map((p) => (
            <li key={p.id}>
              <Link
                href={`/?focus=${p.id}`}
                className="block rounded-[var(--radius-douce)] px-3 py-2 hover:bg-bordure/60"
              >
                <p className="font-medium text-encre">
                  {p.nom} {p.prenoms}
                </p>
                <p className="text-xs text-brume">
                  {p.naissanceDate ?? '?'} – {p.decesDate ?? '?'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {premierePersonne && (
        <div>
          <Link
            href={`/?focus=${premierePersonne.id}`}
            className={classesBouton('secondaire', 'moyen')}
          >
            <Users size={16} aria-hidden /> Voir dans l&apos;arbre
          </Link>
        </div>
      )}
    </div>
  )
}
