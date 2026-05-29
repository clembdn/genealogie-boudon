import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const [familles, personnes, unions] = await Promise.all([
    prisma.famille.findMany({ include: { personnes: true } }),
    prisma.person.findMany(),
    prisma.union.findMany(),
  ])

  console.log(`Nombre de familles : ${familles.length}`)
  for (const f of familles) {
    console.log(`- Famille "${f.nom}" (slug: ${f.slug}) : ${f.personnes.length} personnes`)
  }

  const personneParId = new Map(personnes.map(p => [p.id, p]))
  const familleParId = new Map(familles.map(f => [f.id, f]))

  console.log('\nUnions entre familles différentes dans la base de données :')
  let crossCount = 0
  for (const u of unions) {
    if (!u.partenaire1Id || !u.partenaire2Id) continue
    const p1 = personneParId.get(u.partenaire1Id)
    const p2 = personneParId.get(u.partenaire2Id)
    if (!p1 || !p2) continue

    if (p1.familleId !== p2.familleId) {
      crossCount++
      const f1 = p1.familleId ? familleParId.get(p1.familleId)?.nom : 'Sans famille'
      const f2 = p2.familleId ? familleParId.get(p2.familleId)?.nom : 'Sans famille'
      console.log(`Union ${u.id} entre ${p1.prenoms} ${p1.nom} (${f1}) et ${p2.prenoms} ${p2.nom} (${f2})`)
    }
  }
  console.log(`Total unions inter-familles : ${crossCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
