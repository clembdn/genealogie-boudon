import type { Metadata } from 'next'
import { CarteFamille } from '@/components/famille/CarteFamille'
import { chargerFamilles } from '@/lib/famille/charger'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Familles',
  description:
    "Les neuf branches de la famille Boudon. Hurgon, Veylet, Prunière, Trocellier, Malafosse, Maurin, Gotty, Doulcier et l'arbre principal.",
}

export default async function PageFamilles() {
  const familles = await chargerFamilles()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="font-sans text-sm uppercase tracking-[0.18em] text-brume">
          Branches
        </p>
        <h1 className="mt-3 font-serif text-3xl text-encre sm:text-4xl">
          Les neuf branches de la famille Boudon
        </h1>
        <p className="mt-4 text-base text-brume">
          Chaque famille regroupe ses personnes, ses photos et ses documents
          collectifs. Cliquez pour explorer.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {familles.map((f) => (
          <li key={f.id}>
            <CarteFamille
              slug={f.slug}
              nom={f.nom}
              description={f.description}
              nbPersonnes={f._count.personnes}
              nbMedias={f._count.medias}
              vignetteUrl={f.medias[0]?.url ?? null}
              vignetteTitre={f.medias[0]?.titre ?? null}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
