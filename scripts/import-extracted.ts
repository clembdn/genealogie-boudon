import { readFileSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { transformPerson, type SourcePerson } from '../src/lib/import/transform-person'
import { fusionnerPourMiseAJour } from '../src/lib/import/merge-personne'
import { nomFamilleDepuisSlug } from '../src/lib/famille/nom'
import { extraireDescriptionInitiale } from '../src/lib/famille/description-source'
import { construireUnions, type RelationSource } from '../src/lib/import/construire-unions'
import { uploaderImage, cleBlobPourImage } from '../src/lib/import/upload-image'

const RACINE = 'data/extracted'

interface SummaryEntry {
  name: string
  slug: string
  drawing: string
  persons: number
  unions: number
}

interface FeuilleData {
  sheet: string
  sheetSlug: string
  persons: SourcePerson[]
  pointers: Array<{ text: string; row?: number | null; col?: number | null }>
  relations: Array<{ type: string; fromId: string; toId: string }>
  images: Array<{ shapeName: string; embed: string; file: string }>
}

interface Options {
  dryRun: boolean
  slugs: string[] | null
}

function lireOptions(argv: string[]): Options {
  const dryRun = argv.includes('--dry-run')
  const familles = argv.find((a) => a.startsWith('--familles='))
  const slugs = familles ? familles.slice('--familles='.length).split(',') : null
  return { dryRun, slugs }
}

function chargerSummary(): SummaryEntry[] {
  const path = join(RACINE, '_summary.json')
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as { sheets: SummaryEntry[] }
  return raw.sheets
}

function chargerFeuille(slug: string): FeuilleData {
  const path = join(RACINE, `${slug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8')) as FeuilleData
}

const prisma = new PrismaClient()

async function main() {
  const options = lireOptions(process.argv.slice(2))
  console.log(`Import extracted — dryRun=${options.dryRun}`)

  const sheets = chargerSummary()
  const sheetsAImporter = options.slugs
    ? sheets.filter((s) => options.slugs!.includes(s.slug))
    : sheets

  const arbreJson = chargerFeuille('arbre')
  const pointersArbre = arbreJson.pointers

  for (const sheet of sheetsAImporter) {
    console.log(`\n=== ${sheet.name} (${sheet.slug}) ===`)
    const feuille = chargerFeuille(sheet.slug)

    const famille = await upsertFamille(
      sheet.slug,
      pointersArbre,
      sheetsAImporter.indexOf(sheet),
      options.dryRun,
    )

    await importerPersonnes(famille.id, famille.nom, feuille.persons, options.dryRun)
    await importerUnions(sheet.slug, feuille.relations as RelationSource[], options.dryRun)
    await importerMedias(famille.id, sheet.slug, feuille.images, options.dryRun)
  }

  console.log('\nImport terminé.')
}

async function upsertFamille(
  slug: string,
  pointers: Array<{ text: string }>,
  ordre: number,
  dryRun: boolean,
) {
  const existante = await prisma.famille.findUnique({ where: { slug } })
  if (existante) {
    console.log(`Famille ${slug} existante (id=${existante.id})`)
    return existante
  }
  const nom = nomFamilleDepuisSlug(slug)
  const description = extraireDescriptionInitiale(slug, pointers)
  if (dryRun) {
    console.log(`[dry-run] créerait famille ${slug} (nom=${nom})`)
    return {
      id: `dry-${slug}`,
      slug,
      nom,
      description,
      ordre,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
  return prisma.famille.create({
    data: { slug, nom, description, ordre },
  })
}

async function importerPersonnes(
  familleId: string,
  familleNom: string,
  sources: SourcePerson[],
  dryRun: boolean,
) {
  let crees = 0
  let majs = 0
  let inchangees = 0

  for (const src of sources) {
    const data = transformPerson(src, { familleId, familleNom })
    const existante = await prisma.person.findUnique({ where: { id: src.id } })

    if (!existante) {
      if (dryRun) {
        console.log(`[dry-run] créerait ${src.id} (${src.nom} ${src.prenoms ?? ''})`)
      } else {
        await prisma.person.create({ data })
      }
      crees++
      continue
    }

    const fusion = fusionnerPourMiseAJour(existante, data)
    if (Object.keys(fusion).length === 0) {
      inchangees++
      continue
    }
    if (dryRun) {
      console.log(`[dry-run] màj ${src.id} : ${Object.keys(fusion).join(', ')}`)
    } else {
      await prisma.person.update({ where: { id: src.id }, data: fusion })
    }
    majs++
  }

  console.log(
    `Personnes — créées : ${crees}, mises à jour : ${majs}, inchangées : ${inchangees}`,
  )
}

async function importerUnions(
  slug: string,
  relations: RelationSource[],
  dryRun: boolean,
) {
  const { unions, rattachements, orphelins } = construireUnions(relations)
  if (unions.length === 0) {
    console.log(`Unions — aucune à reconstruire pour ${slug}`)
    return
  }

  const cleVersUnionId = new Map<string, string>()
  let crees = 0
  let existantes = 0

  for (const u of unions) {
    const [a, b] = u.partenaires
    const existante = await prisma.union.findFirst({
      where: {
        OR: [
          { partenaire1Id: a, partenaire2Id: b },
          { partenaire1Id: b, partenaire2Id: a },
        ],
      },
    })
    if (existante) {
      cleVersUnionId.set(u.cle, existante.id)
      existantes++
      continue
    }
    if (dryRun) {
      console.log(`[dry-run] créerait union ${a} × ${b}`)
      cleVersUnionId.set(u.cle, `dry-${u.cle}`)
      crees++
      continue
    }
    const creee = await prisma.union.create({
      data: { partenaire1Id: a, partenaire2Id: b, nature: 'inconnue' },
    })
    cleVersUnionId.set(u.cle, creee.id)
    crees++
  }

  let rattaches = 0
  for (const r of rattachements) {
    const unionId = cleVersUnionId.get(r.unionCle)
    if (!unionId) continue
    if (dryRun) continue
    const enfant = await prisma.person.findUnique({
      where: { id: r.enfantId },
      select: { unionParentaleId: true },
    })
    if (!enfant) continue
    if (enfant.unionParentaleId === unionId) continue
    if (enfant.unionParentaleId && enfant.unionParentaleId !== unionId) continue
    await prisma.person.update({
      where: { id: r.enfantId },
      data: { unionParentaleId: unionId },
    })
    rattaches++
  }

  console.log(
    `Unions — créées : ${crees}, existantes : ${existantes}, enfants rattachés : ${rattaches}, orphelins (1 parent) : ${orphelins.length}`,
  )
}

async function importerMedias(
  familleId: string,
  slug: string,
  images: Array<{ shapeName: string; file: string }>,
  dryRun: boolean,
) {
  if (images.length === 0) {
    console.log(`Médias — aucune image pour ${slug}`)
    return
  }

  const fichiersUniques = [...new Set(images.map((i) => i.file))]

  let uploaded = 0
  let skipped = 0

  for (let i = 0; i < fichiersUniques.length; i++) {
    const fichier = fichiersUniques[i]
    if (!existsSync(fichier)) {
      console.warn(`  Fichier introuvable, ignoré : ${fichier}`)
      continue
    }
    const titre = basename(fichier, extname(fichier))
    const existant = await prisma.media.findFirst({
      where: { familleId, titre },
    })
    if (existant) {
      skipped++
      continue
    }

    const cleBlob = cleBlobPourImage(slug, fichier)
    if (dryRun) {
      console.log(`[dry-run] uploaderait ${fichier} → ${cleBlob}`)
      uploaded++
      continue
    }

    const resultat = await uploaderImage(fichier, cleBlob)
    await prisma.media.create({
      data: {
        familleId,
        personId: null,
        type: resultat.type,
        url: resultat.url,
        titre,
        description: null,
        ordre: i,
      },
    })
    uploaded++
  }

  console.log(`Médias — uploadés : ${uploaded}, déjà en base : ${skipped}`)
}

main()
  .catch((err) => {
    console.error("Echec de l'import :", err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
