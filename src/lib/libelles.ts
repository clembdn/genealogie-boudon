import type { Person, Union } from '@prisma/client'

/** « NOM Prénoms » d'une personne (sans espace superflu). */
export function libellePersonne(
  personne: Pick<Person, 'nom' | 'prenoms'>,
): string {
  return `${personne.nom} ${personne.prenoms}`.trim()
}

/** « NOM Prénoms & NOM Prénoms » d'une union, partenaires inconnus compris. */
export function libelleUnion(
  union: Pick<Union, 'partenaire1Id' | 'partenaire2Id'>,
  personnes: Person[],
): string {
  const nom = (id: string | null) => {
    if (!id) return '?'
    const p = personnes.find((x) => x.id === id)
    return p ? libellePersonne(p) : '?'
  }
  return `${nom(union.partenaire1Id)} & ${nom(union.partenaire2Id)}`
}
