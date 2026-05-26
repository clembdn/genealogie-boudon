import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { FormulaireUnion } from '@/components/admin/FormulaireUnion'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { supprimerUnionAction } from '../actions'
import { libelleUnion } from '@/lib/libelles'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PageEditionUnion({ params }: Props) {
  const { id } = await params

  const [union, personnes] = await Promise.all([
    prisma.union.findUnique({
      where: { id },
      include: { enfants: { select: { id: true, nom: true, prenoms: true } } },
    }),
    prisma.person.findMany({
      select: { id: true, nom: true, prenoms: true },
      orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
    }),
  ])

  if (!union) notFound()

  const supprimer = supprimerUnionAction.bind(null, id)
  const titre = libelleUnion(union, personnes)
  const nbEnfants = union.enfants.length

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/unions"
        className="inline-flex items-center gap-2 self-start text-sm text-brume hover:text-encre"
      >
        <ArrowLeft size={14} aria-hidden /> Retour à la liste
      </Link>

      <header>
        <h1 className="font-serif text-3xl text-encre">{titre}</h1>
        <p className="mt-1 text-sm text-brume">
          Modification de l&apos;union. {nbEnfants > 0 && (
            <span>
              {nbEnfants} enfant{nbEnfants > 1 ? 's' : ''} rattaché
              {nbEnfants > 1 ? 's' : ''} à cette union.
            </span>
          )}
        </p>
      </header>

      <FormulaireUnion union={union} personnes={personnes} />

      <section className="mt-4 border-t border-bordure pt-6">
        <h2 className="font-serif text-sm uppercase tracking-[0.16em] text-brume">
          Zone dangereuse
        </h2>
        <p className="mt-2 text-sm text-brume">
          Supprimer l&apos;union ne supprime pas les partenaires.
          {nbEnfants > 0 && (
            <>
              {' '}
              <strong className="text-encre">
                Les {nbEnfants} enfant{nbEnfants > 1 ? 's' : ''} perdront leur
                rattachement à cette union
              </strong>{' '}
              et apparaîtront orphelins jusqu&apos;à ré-affectation.
            </>
          )}
        </p>
        <div className="mt-4">
          <BoutonSupprimer
            action={supprimer}
            confirmation={`Supprimer ${titre} ?`}
          />
        </div>
      </section>
    </div>
  )
}
