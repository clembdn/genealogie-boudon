import { prisma } from '@/lib/db'
import { FormulairePersonne } from '@/components/admin/FormulairePersonne'
import { creerPersonne } from '../actions'

export default async function NouvellePersonne() {
  const [unions, personnes] = await Promise.all([
    prisma.union.findMany(),
    prisma.person.findMany({ orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Nouvelle personne
      </h1>
      <FormulairePersonne
        action={creerPersonne}
        unions={unions}
        personnes={personnes}
      />
    </div>
  )
}
