import type { Person, Union } from '@prisma/client'

/** L'union dont la personne est issue (celle de ses parents), ou null. */
export function trouverUnionParentale(
  person: Pick<Person, 'unionParentaleId'>,
  unions: Union[],
): Union | null {
  if (!person.unionParentaleId) return null
  return unions.find((u) => u.id === person.unionParentaleId) ?? null
}

/** Les parents de la personne (0, 1 ou 2). */
export function getParents(
  person: Pick<Person, 'unionParentaleId'>,
  unions: Union[],
  persons: Person[],
): Person[] {
  const union = trouverUnionParentale(person, unions)
  if (!union) return []
  return [union.partenaire1Id, union.partenaire2Id]
    .filter((id): id is string => id !== null)
    .map((id) => persons.find((p) => p.id === id))
    .filter((p): p is Person => p !== undefined)
}

/** La fratrie : memes parents, triee par ordreFratrie, sans la personne elle-meme. */
export function getFratrie(
  person: Pick<Person, 'id' | 'unionParentaleId'>,
  persons: Person[],
): Person[] {
  if (!person.unionParentaleId) return []
  return persons
    .filter(
      (p) =>
        p.unionParentaleId === person.unionParentaleId && p.id !== person.id,
    )
    .sort((a, b) => a.ordreFratrie - b.ordreFratrie)
}

/** Les enfants issus d'une union, tries par ordreFratrie. */
export function getEnfants(
  union: Pick<Union, 'id'>,
  persons: Person[],
): Person[] {
  return persons
    .filter((p) => p.unionParentaleId === union.id)
    .sort((a, b) => a.ordreFratrie - b.ordreFratrie)
}

/** Toutes les unions auxquelles la personne a participe. */
export function getUnionsDe(
  person: Pick<Person, 'id'>,
  unions: Union[],
): Union[] {
  return unions.filter(
    (u) => u.partenaire1Id === person.id || u.partenaire2Id === person.id,
  )
}

/** Les conjoints de la personne : l'autre partenaire de chacune de ses unions. */
export function getConjoints(
  person: Pick<Person, 'id'>,
  unions: Union[],
  persons: Person[],
): Person[] {
  return getUnionsDe(person, unions)
    .map((u) => (u.partenaire1Id === person.id ? u.partenaire2Id : u.partenaire1Id))
    .filter((id): id is string => id !== null)
    .map((id) => persons.find((p) => p.id === id))
    .filter((p): p is Person => p !== undefined)
}
