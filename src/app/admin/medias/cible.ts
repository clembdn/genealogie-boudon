export type Cible =
  | { type: 'personne'; id: string }
  | { type: 'famille'; id: string }

export function validerCible(cible: Cible): void {
  const type = (cible as { type: string }).type
  if (type !== 'personne' && type !== 'famille') {
    throw new Error(`Type de cible inconnu : ${type}`)
  }
  if (!cible.id || cible.id.length === 0) {
    throw new Error('Cible sans identifiant.')
  }
}
