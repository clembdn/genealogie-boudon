import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FormulaireUnion } from '@/components/admin/FormulaireUnion'
import { modifierUnion } from '../actions'

export default async function ModifierUnion({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [union, personnes] = await Promise.all([
    prisma.union.findUnique({ where: { id } }),
    prisma.person.findMany({ orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] }),
  ])

  if (!union) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Modifier une union
      </h1>
      <FormulaireUnion action={modifierUnion} union={union} personnes={personnes} />
    </div>
  )
}
