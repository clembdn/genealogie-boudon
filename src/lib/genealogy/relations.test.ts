import { describe, it, expect } from 'vitest'
import type { Person, Union } from '@prisma/client'
import {
  getParents,
  getFratrie,
  getEnfants,
  getUnionsDe,
  getConjoints,
} from './relations'

function person(over: Partial<Person> & Pick<Person, 'id'>): Person {
  return {
    nom: 'BOUDON',
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
    notesImport: null,
    unionParentaleId: null,
    photoPrincipaleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

function union(over: Partial<Union> & Pick<Union, 'id'>): Union {
  return {
    partenaire1Id: null,
    partenaire2Id: null,
    nature: 'inconnue',
    dateDebut: null,
    lieuDebut: null,
    dateFin: null,
    causeFin: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

// Jeu d'essai : Pierre et Marie, maries (union U1), parents d'Augustin et Louis.
const pierre = person({ id: 'pierre' })
const marie = person({ id: 'marie' })
const u1 = union({ id: 'U1', partenaire1Id: 'pierre', partenaire2Id: 'marie' })
const augustin = person({ id: 'augustin', unionParentaleId: 'U1', ordreFratrie: 1 })
const louis = person({ id: 'louis', unionParentaleId: 'U1', ordreFratrie: 0 })

const persons = [pierre, marie, augustin, louis]
const unions = [u1]

describe('getParents', () => {
  it("renvoie les deux parents d'un enfant", () => {
    expect(getParents(augustin, unions, persons).map((p) => p.id)).toEqual([
      'pierre',
      'marie',
    ])
  })

  it('renvoie un tableau vide quand la filiation est inconnue', () => {
    expect(getParents(pierre, unions, persons)).toEqual([])
  })
})

describe('getFratrie', () => {
  it('renvoie les freres et soeurs tries par ordreFratrie, sans la personne', () => {
    expect(getFratrie(augustin, persons).map((p) => p.id)).toEqual(['louis'])
  })

  it('renvoie un tableau vide sans filiation', () => {
    expect(getFratrie(pierre, persons)).toEqual([])
  })
})

describe('getEnfants', () => {
  it("renvoie les enfants d'une union tries par ordreFratrie", () => {
    expect(getEnfants(u1, persons).map((p) => p.id)).toEqual([
      'louis',
      'augustin',
    ])
  })
})

describe('getUnionsDe', () => {
  it('renvoie les unions auxquelles une personne a participe', () => {
    expect(getUnionsDe(pierre, unions).map((u) => u.id)).toEqual(['U1'])
  })
})

describe('getConjoints', () => {
  it("renvoie l'autre partenaire de chaque union", () => {
    expect(getConjoints(pierre, unions, persons).map((p) => p.id)).toEqual([
      'marie',
    ])
  })
})
