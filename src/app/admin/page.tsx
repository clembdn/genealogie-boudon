import Link from 'next/link'
import { prisma } from '@/lib/db'

export default async function TableauDeBord() {
  const [nbPersonnes, nbUnions] = await Promise.all([
    prisma.person.count(),
    prisma.union.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-encre">
        Tableau de bord
      </h1>
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/personnes"
          className="rounded-2xl border border-bordure bg-craie p-6"
        >
          <div className="font-serif text-3xl text-sauge">{nbPersonnes}</div>
          <div className="text-sm text-brume">personnes</div>
        </Link>
        <Link
          href="/admin/unions"
          className="rounded-2xl border border-bordure bg-craie p-6"
        >
          <div className="font-serif text-3xl text-sauge">{nbUnions}</div>
          <div className="text-sm text-brume">unions</div>
        </Link>
      </div>
    </div>
  )
}
