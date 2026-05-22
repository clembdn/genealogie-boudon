import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FormulairePersonne } from '@/components/admin/FormulairePersonne'
import { modifierPersonne } from '../actions'

export default async function ModifierPersonne({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [personne, unions, personnes] = await Promise.all([
    prisma.person.findUnique({ where: { id } }),
    prisma.union.findMany(),
    prisma.person.findMany({ orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] }),
  ])

  if (!personne) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Modifier une personne
      </h1>
      <FormulairePersonne
        action={modifierPersonne}
        personne={personne}
        unions={unions}
        personnes={personnes}
      />
    </div>
  )
}
