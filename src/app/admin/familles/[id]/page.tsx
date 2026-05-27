import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FormulaireFamille } from '@/components/admin/FormulaireFamille'
import { SectionMedias } from '@/components/admin/SectionMedias'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PageAdminFamille({ params }: Props) {
  const { id } = await params
  const famille = await prisma.famille.findUnique({
    where: { id },
    include: { medias: { orderBy: { ordre: 'asc' } } },
  })
  if (!famille) notFound()

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl text-encre">{famille.nom}</h1>
        <p className="mt-1 text-sm text-brume">Édition de la famille</p>
      </header>

      <FormulaireFamille famille={famille} />

      <SectionMedias
        cible={{ type: 'famille', id: famille.id }}
        medias={famille.medias}
      />
    </div>
  )
}
