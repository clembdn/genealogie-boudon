import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { classesBouton } from '@/components/ui/classes-bouton'
import { ListePersonnesAvecFiltres } from '@/components/admin/ListePersonnesAvecFiltres'

export const dynamic = 'force-dynamic'

export default async function PageListePersonnes() {
  const personnes = await prisma.person.findMany({
    include: { photoPrincipale: { select: { url: true } } },
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-encre">Personnes</h1>
          <p className="mt-1 text-sm text-brume">
            {personnes.length} personne{personnes.length > 1 ? 's' : ''}{' '}
            enregistrée{personnes.length > 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          href="/admin/personnes/nouvelle"
          className={classesBouton('primaire', 'moyen')}
        >
          <Plus size={16} aria-hidden /> Nouvelle personne
        </Link>
      </header>

      <ListePersonnesAvecFiltres personnes={personnes} />
    </div>
  )
}
