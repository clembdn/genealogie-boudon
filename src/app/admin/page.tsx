import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { classesBouton } from '@/components/ui/classes-bouton'
import { Carte } from '@/components/ui/Carte'

export const dynamic = 'force-dynamic'

export default async function TableauDeBord() {
  const [nbPersonnes, nbUnions, nbMedias, nbFamilles] = await Promise.all([
    prisma.person.count(),
    prisma.union.count(),
    prisma.media.count(),
    prisma.famille.count(),
  ])

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-serif text-3xl text-encre">Tableau de bord</h1>
        <p className="mt-2 text-sm text-brume">
          Vue d&apos;ensemble du contenu de l&apos;arbre généalogique.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CarteStat label="Personnes" valeur={nbPersonnes} href="/admin/personnes" />
        <CarteStat label="Unions" valeur={nbUnions} href="/admin/unions" />
        <CarteStat label="Familles" valeur={nbFamilles} href="/admin/familles" />
        <CarteStat label="Médias" valeur={nbMedias} href="/admin/personnes" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-sm uppercase tracking-[0.16em] text-brume">
          Raccourcis
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/personnes/nouvelle"
            className={classesBouton('primaire', 'moyen')}
          >
            <Plus size={16} aria-hidden /> Nouvelle personne
          </Link>
          <Link
            href="/admin/unions/nouvelle"
            className={classesBouton('secondaire', 'moyen')}
          >
            <Plus size={16} aria-hidden /> Nouvelle union
          </Link>
        </div>
      </section>
    </div>
  )
}

function CarteStat({
  label,
  valeur,
  href,
}: {
  label: string
  valeur: number
  href: string
}) {
  return (
    <Link href={href}>
      <Carte interactive className="p-5">
        <p className="text-sm text-brume">{label}</p>
        <p className="mt-1 font-serif text-3xl text-encre">{valeur}</p>
      </Carte>
    </Link>
  )
}
