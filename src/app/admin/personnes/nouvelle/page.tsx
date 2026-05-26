import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { FormulairePersonne } from '@/components/admin/FormulairePersonne'

export const dynamic = 'force-dynamic'

export default async function PageNouvellePersonne() {
  const [unions, personnes] = await Promise.all([
    prisma.union.findMany(),
    prisma.person.findMany({
      select: { id: true, nom: true, prenoms: true },
      orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
    }),
  ])

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/personnes"
        className="inline-flex items-center gap-2 self-start text-sm text-brume hover:text-encre"
      >
        <ArrowLeft size={14} aria-hidden /> Retour à la liste
      </Link>

      <header>
        <h1 className="font-serif text-3xl text-encre">Nouvelle personne</h1>
        <p className="mt-1 text-sm text-brume">
          Renseigne au minimum un nom. Les autres champs sont facultatifs et
          peuvent être complétés plus tard.
        </p>
      </header>

      <FormulairePersonne unions={unions} personnes={personnes} />
    </div>
  )
}
