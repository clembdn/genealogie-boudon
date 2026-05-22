import Link from 'next/link'
import { prisma } from '@/lib/db'
import { libelleUnion } from '@/lib/libelles'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { supprimerUnion } from './actions'

export default async function ListeUnions() {
  const [unions, personnes] = await Promise.all([
    prisma.union.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.person.findMany(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Unions ({unions.length})
        </h1>
        <Link
          href="/admin/unions/nouvelle"
          className="rounded-lg bg-sauge px-4 py-2 text-sm font-medium text-craie"
        >
          Nouvelle union
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-bordure rounded-2xl border border-bordure bg-craie">
        {unions.map((u) => (
          <li key={u.id} className="flex items-center justify-between px-4 py-3">
            <Link
              href={`/admin/unions/${u.id}`}
              className="font-medium text-encre hover:text-sauge"
            >
              {libelleUnion(u, personnes)}
              <span className="ml-2 text-sm text-brume">{u.nature}</span>
            </Link>
            <BoutonSupprimer
              id={u.id}
              action={supprimerUnion}
              libelle={libelleUnion(u, personnes)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
