import { readFileSync } from 'node:fs'
import { PrismaClient, type Prisma } from '@prisma/client'
import {
  transformPerson,
  type SourcePerson,
} from '../src/lib/import/transform-person'

const prisma = new PrismaClient()

interface SourceFile {
  persons: SourcePerson[]
}

async function main() {
  const contenu = readFileSync('data/arbre-persons.json', 'utf-8')
  const data = JSON.parse(contenu) as SourceFile

  // Seules les personnes sont importées. Le fichier source contient aussi des
  // tableaux `unions` et `branchPointers` : ils sont volontairement ignorés —
  // les liens de parenté sont recréés à la main via l'admin (conception §8).
  console.log(`${data.persons.length} personnes lues dans le fichier source.`)

  const rows: Prisma.PersonCreateManyInput[] = data.persons.map(transformPerson)
  const resultat = await prisma.person.createMany({
    data: rows,
    skipDuplicates: true,
  })

  const total = await prisma.person.count()
  console.log(`Import terminé : ${resultat.count} personnes insérées.`)
  console.log(`Total en base : ${total} personnes.`)

  const exemple = await prisma.person.findUnique({ where: { id: 'arbre-49' } })
  console.log(
    `Exemple — arbre-49 : ${exemple?.nom} ${exemple?.prenoms} ` +
      `(notesImport ${exemple?.notesImport ? 'présent' : 'absent'})`,
  )
}

main()
  .catch((erreur) => {
    console.error("Echec de l'import :", erreur)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
