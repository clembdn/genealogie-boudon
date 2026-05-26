import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { FormulaireUnion } from '@/components/admin/FormulaireUnion'

export const dynamic = 'force-dynamic'

export default async function PageNouvelleUnion() {
  const personnes = await prisma.person.findMany({
    select: { id: true, nom: true, prenoms: true },
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/unions"
        className="inline-flex items-center gap-2 self-start text-sm text-brume hover:text-encre"
      >
        <ArrowLeft size={14} aria-hidden /> Retour à la liste
      </Link>

      <header>
        <h1 className="font-serif text-3xl text-encre">Nouvelle union</h1>
        <p className="mt-1 text-sm text-brume">
          Lie deux personnes existantes. Au moins un des deux partenaires doit
          être renseigné.
        </p>
      </header>

      <FormulaireUnion personnes={personnes} />
    </div>
  )
}
