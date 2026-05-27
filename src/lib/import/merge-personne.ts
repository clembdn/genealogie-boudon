import type { Person, Prisma } from '@prisma/client'

const CHAMPS_TEXTE_PRESERVES = [
  'prenoms',
  'surnom',
  'naissanceDate',
  'naissanceLieu',
  'decesDate',
  'decesLieu',
  'parrain',
  'marraine',
  'profession',
  'recit',
  'branche',
] as const

type ChampPreserveValue = string | null | undefined

function estVide(v: ChampPreserveValue): boolean {
  return v === null || v === undefined || v === ''
}

export function fusionnerPourMiseAJour(
  existante: Person,
  calculee: Partial<Prisma.PersonUncheckedUpdateInput>,
): Prisma.PersonUncheckedUpdateInput {
  const sortie: Record<string, unknown> = {}

  for (const champ of CHAMPS_TEXTE_PRESERVES) {
    const valeurExistante = existante[champ] as ChampPreserveValue
    const valeurCalculee = calculee[champ] as ChampPreserveValue
    if (estVide(valeurExistante) && !estVide(valeurCalculee)) {
      sortie[champ] = valeurCalculee
    }
  }

  if (calculee.notesImport !== undefined) {
    sortie.notesImport = calculee.notesImport
  }

  if (existante.familleId === null && typeof calculee.familleId === 'string') {
    sortie.familleId = calculee.familleId
  }

  return sortie
}
