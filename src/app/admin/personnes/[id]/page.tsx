import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/db'
import { FormulairePersonne } from '@/components/admin/FormulairePersonne'
import { SectionMedias } from '@/components/admin/SectionMedias'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { supprimerPersonneAction } from '../actions'
import { nomComplet, slugPersonne } from '@/lib/personne/format'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PageEditionPersonne({ params }: Props) {
  const { id } = await params

  const [personne, unions, personnes] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: { medias: { orderBy: { ordre: 'asc' } } },
    }),
    prisma.union.findMany(),
    prisma.person.findMany({
      select: { id: true, nom: true, prenoms: true },
      orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
    }),
  ])

  if (!personne) notFound()

  const supprimer = supprimerPersonneAction.bind(null, id)

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/personnes"
        className="inline-flex items-center gap-2 self-start text-sm text-brume hover:text-encre"
      >
        <ArrowLeft size={14} aria-hidden /> Retour à la liste
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-encre">
            {nomComplet(personne)}
          </h1>
          <p className="mt-1 text-sm text-brume">
            Modification de la fiche.
          </p>
        </div>
        <Link
          href={`/personne/${slugPersonne(personne)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brume hover:text-encre"
        >
          Voir la fiche publique <ExternalLink size={12} aria-hidden />
        </Link>
      </header>

      <FormulairePersonne
        personne={personne}
        unions={unions}
        personnes={personnes}
        medias={personne.medias}
      />

      <SectionMedias
        personneId={personne.id}
        medias={personne.medias}
        photoPrincipaleId={personne.photoPrincipaleId}
      />

      <section className="mt-4 border-t border-bordure pt-6">
        <h2 className="font-serif text-sm uppercase tracking-[0.16em] text-brume">
          Zone dangereuse
        </h2>
        <p className="mt-2 text-sm text-brume">
          La suppression efface la personne et tous ses médias. Les unions où
          elle figurait conservent les autres partenaires, et les enfants
          gardent leur autre parent.
        </p>
        <div className="mt-4">
          <BoutonSupprimer
            action={supprimer}
            confirmation={`Supprimer ${nomComplet(personne)} ?`}
          />
        </div>
      </section>
    </div>
  )
}
