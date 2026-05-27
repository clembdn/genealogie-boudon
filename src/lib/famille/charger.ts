import { cache } from 'react'
import { prisma } from '@/lib/db'

export const chargerFamilles = cache(async () => {
  return prisma.famille.findMany({
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: {
      _count: {
        select: { personnes: true, medias: true },
      },
      medias: {
        where: { type: 'photo' },
        orderBy: { ordre: 'asc' },
        take: 1,
        select: { url: true, titre: true },
      },
    },
  })
})

export async function chargerFamilleParSlug(slug: string) {
  return prisma.famille.findUnique({
    where: { slug },
    include: {
      personnes: {
        orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
        select: {
          id: true,
          nom: true,
          prenoms: true,
          surnom: true,
          naissanceDate: true,
          decesDate: true,
          photoPrincipale: { select: { url: true } },
        },
      },
      medias: {
        orderBy: { ordre: 'asc' },
      },
    },
  })
}

export type FamilleListe = Awaited<ReturnType<typeof chargerFamilles>>[number]
export type FamilleDetail = NonNullable<Awaited<ReturnType<typeof chargerFamilleParSlug>>>
