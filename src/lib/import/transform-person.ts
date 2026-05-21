import type { Prisma } from '@prisma/client'

/** Forme d'une personne dans `data/arbre-persons.json` (champs utilises). */
export interface SourcePerson {
  id: string
  shapeName: string
  multiPerson: boolean
  raw: string
  nom: string
  prenoms: string | null
  surnom: string | null
  naissance: { date: string | null; lieu: string | null } | null
  deces: { date: string | null; lieu: string | null } | null
  parrain: string | null
  marraine: string | null
  notes: string | null
}

/**
 * Assemble le champ `notesImport` : texte Excel d'origine, note eventuelle,
 * et signalement des personnes regroupees dans une meme forme.
 */
export function construireNotesImport(src: SourcePerson): string {
  const lignes: string[] = ['Import Excel — feuille « Arbre »']
  lignes.push(`Texte d'origine : ${src.raw}`)
  if (src.notes) {
    lignes.push(`Note d'origine : ${src.notes}`)
  }
  if (src.multiPerson) {
    lignes.push(
      `Rectangle partagé (${src.shapeName}) : cette personne était ` +
        `regroupée avec d'autres dans le fichier d'origine — ` +
        `vérifier les liens de parenté.`,
    )
  }
  return lignes.join('\n')
}

/** Convertit une personne du fichier source en enregistrement pret pour la base. */
export function transformPerson(src: SourcePerson): Prisma.PersonCreateManyInput {
  return {
    id: src.id,
    nom: src.nom,
    prenoms: src.prenoms ?? '',
    surnom: src.surnom ?? null,
    sexe: 'inconnu',
    naissanceDate: src.naissance?.date ?? null,
    naissanceLieu: src.naissance?.lieu ?? null,
    decesDate: src.deces?.date ?? null,
    decesLieu: src.deces?.lieu ?? null,
    parrain: src.parrain ?? null,
    marraine: src.marraine ?? null,
    profession: null,
    recit: null,
    branche: 'Boudon',
    vivant: false,
    ordreFratrie: 0,
    notesImport: construireNotesImport(src),
  }
}
