/**
 * Représentation minimale d'une famille pour l'overlay et les liaisons.
 */
export type FamilleCartouche = {
  id: string
  slug: string
  nom: string
  nbPersonnes: number
}

/**
 * Représente le lien entre l'arbre principal et une famille externe via une
 * union. La card famille sera positionnée côté conjoint externe sur le canevas.
 */
export type LiaisonFamille = {
  famille: FamilleCartouche
  /** L'id de l'union qui relie les deux familles. */
  unionId: string
  /** L'id de la personne côté « arbre » (famille principale). */
  personneArbreId: string
  /** L'id du conjoint externe (membre de l'autre famille). */
  personneExterneId: string
}

/**
 * Palette de couleurs attribuées aux familles par index.
 * Tons doux cohérents avec le thème papier / sauge.
 */
export const COULEURS_FAMILLE: readonly string[] = [
  '#5B8C7A', // vert sauge foncé
  '#8B6B4A', // ambre chaud
  '#7A6B8E', // mauve doux
  '#6B8FA3', // bleu ardoise
  '#A67B5B', // terre sienne
  '#7B9E87', // vert mousse
  '#9B7A6B', // rose terreux
  '#6B8B7A', // turquoise sourd
  '#8E7B6B', // taupe
]

export function couleurFamille(index: number): string {
  return COULEURS_FAMILLE[index % COULEURS_FAMILLE.length]
}
