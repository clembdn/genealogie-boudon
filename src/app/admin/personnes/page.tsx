import Link from 'next/link'
import { prisma } from '@/lib/db'
import { libellePersonne } from '@/lib/libelles'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { supprimerPersonne } from './actions'

export default async function ListePersonnes() {
  const personnes = await prisma.person.findMany({
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Personnes ({personnes.length})
        </h1>
        <Link
          href="/admin/personnes/nouvelle"
          className="rounded-lg bg-sauge px-4 py-2 text-sm font-medium text-craie"
        >
          Nouvelle personne
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-bordure rounded-2xl border border-bordure bg-craie">
        {personnes.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <Link
              href={`/admin/personnes/${p.id}`}
              className="font-medium text-encre hover:text-sauge"
            >
              {libellePersonne(p)}
              <span className="ml-2 text-sm text-brume">
                {p.naissanceDate ?? ''}
                {p.decesDate ? ` – ${p.decesDate}` : ''}
              </span>
            </Link>
            <BoutonSupprimer
              id={p.id}
              action={supprimerPersonne}
              libelle={libellePersonne(p)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
