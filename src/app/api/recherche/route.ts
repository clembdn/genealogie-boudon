import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { slugPersonne } from '@/lib/personne/format'

export const dynamic = 'force-dynamic'

export async function GET() {
  const personnes = await prisma.person.findMany({
    select: {
      id: true,
      nom: true,
      prenoms: true,
      surnom: true,
      naissanceDate: true,
      decesDate: true,
      vivant: true,
      branche: true,
    },
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  const resultats = personnes.map((p) => ({
    ...p,
    slug: slugPersonne(p),
  }))

  return NextResponse.json({ personnes: resultats })
}
