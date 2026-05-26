import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { classesBouton } from '@/components/ui/classes-bouton'
import { ListeUnionsAvecFiltres } from '@/components/admin/ListeUnionsAvecFiltres'

export const dynamic = 'force-dynamic'

export default async function PageListeUnions() {
  const [unions, personnes] = await Promise.all([
    prisma.union.findMany({ orderBy: { dateDebut: 'asc' } }),
    prisma.person.findMany({
      select: { id: true, nom: true, prenoms: true },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-encre">Unions</h1>
          <p className="mt-1 text-sm text-brume">
            {unions.length} union{unions.length > 1 ? 's' : ''} enregistrée
            {unions.length > 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          href="/admin/unions/nouvelle"
          className={classesBouton('primaire', 'moyen')}
        >
          <Plus size={16} aria-hidden /> Nouvelle union
        </Link>
      </header>

      <ListeUnionsAvecFiltres unions={unions} personnes={personnes} />
    </div>
  )
}
