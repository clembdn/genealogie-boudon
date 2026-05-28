import { describe, it, expect } from 'vitest'
import type { Person, Union } from '@prisma/client'
import { categoriserDepuisDeCujus } from './categorisation'

function personne(id: string, unionParentaleId: string | null = null): Person {
  return {
    id,
    nom: id,
    prenoms: '',
    surnom: null,
    sexe: 'inconnu',
    naissanceDate: null,
    naissanceLieu: null,
    decesDate: null,
    decesLieu: null,
    parrain: null,
    marraine: null,
    profession: null,
    recit: null,
    branche: null,
    vivant: false,
    ordreFratrie: 0,
    racineParDefaut: false,
    notesImport: null,
    unionParentaleId,
    familleId: null,
    photoPrincipaleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Person
}

function union(id: string, p1: string | null, p2: string | null): Union {
  return {
    id,
    partenaire1Id: p1,
    partenaire2Id: p2,
    nature: 'inconnue',
    dateDebut: null,
    lieuDebut: null,
    dateFin: null,
    causeFin: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Union
}

describe('categoriserDepuisDeCujus — ligne directe', () => {
  it('classe le De cujus, ses ancêtres et ses descendants en LIGNE_DIRECTE', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('mere'),
      personne('moi', 'u-parents'),
      personne('conj'),
      personne('fils', 'u-moi'),
      personne('conjFils'),
      personne('petitFils', 'u-fils'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-moi', 'moi', 'conj'),
      union('u-fils', 'fils', 'conjFils'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('moi')).toBe('LIGNE_DIRECTE')
    expect(res.get('pere')).toBe('LIGNE_DIRECTE')
    expect(res.get('mere')).toBe('LIGNE_DIRECTE')
    expect(res.get('gpA')).toBe('LIGNE_DIRECTE')
    expect(res.get('gpB')).toBe('LIGNE_DIRECTE')
    expect(res.get('fils')).toBe('LIGNE_DIRECTE')
    expect(res.get('petitFils')).toBe('LIGNE_DIRECTE')
  })
})

describe('categoriserDepuisDeCujus — contact ligne', () => {
  it('classe le conjoint du De cujus et la belle-fille en CONTACT_LIGNE', () => {
    const personnes: Person[] = [
      personne('moi'),
      personne('conj'),
      personne('fils', 'u-moi'),
      personne('belleFille'),
    ]
    const unions: Union[] = [
      union('u-moi', 'moi', 'conj'),
      union('u-fils', 'fils', 'belleFille'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('conj')).toBe('CONTACT_LIGNE')
    expect(res.get('belleFille')).toBe('CONTACT_LIGNE')
  })
})

describe('categoriserDepuisDeCujus — cousin germain', () => {
  it('classe l enfant de l oncle (partage les 2 GP) en COUSIN_GERMAIN', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('tante'),
      personne('moi', 'u-parents'),
      personne('cousin', 'u-oncle'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-oncle', 'oncle', 'tante'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('cousin')).toBe('COUSIN_GERMAIN')
  })
})

describe('categoriserDepuisDeCujus — cousin demi-germain', () => {
  it('classe l enfant d un demi-frère du père (1 seul GP partagé) en COUSIN_DEMI_GERMAIN', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('gpC'),
      personne('pere', 'u-gpAB'),
      personne('demiOncle', 'u-gpAC'),
      personne('mere'),
      personne('autre'),
      personne('moi', 'u-parents'),
      personne('demiCousin', 'u-demiOncle'),
    ]
    const unions: Union[] = [
      union('u-gpAB', 'gpA', 'gpB'),
      union('u-gpAC', 'gpA', 'gpC'),
      union('u-parents', 'pere', 'mere'),
      union('u-demiOncle', 'demiOncle', 'autre'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('demiCousin')).toBe('COUSIN_DEMI_GERMAIN')
  })
})

describe('categoriserDepuisDeCujus — cousin issu de germain', () => {
  it('classe une personne partageant un arrière-grand-parent en COUSIN_ISSU_DE_GERMAIN', () => {
    const personnes: Person[] = [
      personne('agpA'),
      personne('agpB'),
      personne('gpPere', 'u-agp'),
      personne('gpOncle', 'u-agp'),
      personne('x'),
      personne('y'),
      personne('pere', 'u-gpPere'),
      personne('cousinPere', 'u-gpOncle'),
      personne('mere'),
      personne('z'),
      personne('moi', 'u-parents'),
      personne('issu', 'u-cousinPere'),
    ]
    const unions: Union[] = [
      union('u-agp', 'agpA', 'agpB'),
      union('u-gpPere', 'gpPere', 'x'),
      union('u-gpOncle', 'gpOncle', 'y'),
      union('u-parents', 'pere', 'mere'),
      union('u-cousinPere', 'cousinPere', 'z'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('issu')).toBe('COUSIN_ISSU_DE_GERMAIN')
  })
})

describe('categoriserDepuisDeCujus — petit-cousin / arrière-petit-cousin', () => {
  it('classe l enfant et le petit-enfant d un cousin germain', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('tante'),
      personne('moi', 'u-parents'),
      personne('cousin', 'u-oncle'),
      personne('cousinConj'),
      personne('petitCousin', 'u-cousin'),
      personne('petitCousinConj'),
      personne('arrierePetitCousin', 'u-petitCousin'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-oncle', 'oncle', 'tante'),
      union('u-cousin', 'cousin', 'cousinConj'),
      union('u-petitCousin', 'petitCousin', 'petitCousinConj'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('petitCousin')).toBe('PETIT_COUSIN')
    expect(res.get('arrierePetitCousin')).toBe('ARRIERE_PETIT_COUSIN')
  })
})

describe('categoriserDepuisDeCujus — conjoint de cousin', () => {
  it('classe le conjoint d un cousin germain en NEUTRE (pas CONTACT_LIGNE)', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('tante'),
      personne('moi', 'u-parents'),
      personne('cousin', 'u-oncle'),
      personne('cousinConj'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-oncle', 'oncle', 'tante'),
      union('u-cousin', 'cousin', 'cousinConj'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('cousinConj')).toBe('NEUTRE')
  })
})

describe('categoriserDepuisDeCujus — De cujus absent', () => {
  it('retourne une map vide quand deCujusId est null', () => {
    const personnes: Person[] = [personne('a'), personne('b')]
    const res = categoriserDepuisDeCujus(null, personnes, [])
    expect(res.size).toBe(0)
  })

  it('retourne une map vide quand le De cujus n existe pas dans personnes', () => {
    const personnes: Person[] = [personne('a')]
    const res = categoriserDepuisDeCujus('inconnu', personnes, [])
    expect(res.size).toBe(0)
  })
})

describe('categoriserDepuisDeCujus — robustesse', () => {
  it('termine sans boucle infinie si la filiation forme un cycle', () => {
    const personnes: Person[] = [
      personne('a', 'u-ab'),
      personne('b', 'u-ba'),
    ]
    const unions: Union[] = [
      union('u-ab', 'b', null),
      union('u-ba', 'a', null),
    ]
    expect(() => categoriserDepuisDeCujus('a', personnes, unions)).not.toThrow()
  })
})

describe('categoriserDepuisDeCujus — hors taxonomie', () => {
  it('classe un oncle (frère du père) en NEUTRE', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('moi', 'u-parents'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('oncle')).toBe('NEUTRE')
  })
})
