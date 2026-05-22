import { prisma } from '@/lib/db'
import { FormulaireUnion } from '@/components/admin/FormulaireUnion'
import { creerUnion } from '../actions'

export default async function NouvelleUnion() {
  const personnes = await prisma.person.findMany({
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Nouvelle union
      </h1>
      <FormulaireUnion action={creerUnion} personnes={personnes} />
    </div>
  )
}
