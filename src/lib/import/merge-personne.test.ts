import { describe, it, expect } from 'vitest'
import type { Person } from '@prisma/client'
import { fusionnerPourMiseAJour } from './merge-personne'

function personne(over: Partial<Person> = {}): Person {
  return {
    id: 'arbre-1',
    nom: 'BOUDON',
    prenoms: 'Jean',
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
    branche: 'Boudon',
    vivant: false,
    ordreFratrie: 0,
    racineParDefaut: false,
    notesImport: 'Texte initial',
    unionParentaleId: null,
    photoPrincipaleId: null,
    familleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

describe('fusionnerPourMiseAJour', () => {
  it('preserve les champs non vides en base', () => {
    const existante = personne({
      surnom: 'Edité par admin',
      profession: 'Tailleur',
    })
    const calculee = {
      surnom: null,
      profession: null,
      naissanceLieu: 'Rimeizenc',
    }
    const fusion = fusionnerPourMiseAJour(existante, calculee)
    expect(fusion.surnom).toBeUndefined()
    expect(fusion.profession).toBeUndefined()
    expect(fusion.naissanceLieu).toBe('Rimeizenc')
  })

  it('regenere notesImport systematiquement', () => {
    const existante = personne({ notesImport: 'Ancien' })
    const calculee = { notesImport: 'Nouveau texte regenere' }
    const fusion = fusionnerPourMiseAJour(existante, calculee)
    expect(fusion.notesImport).toBe('Nouveau texte regenere')
  })

  it('ne touche pas aux flags admin (racineParDefaut, vivant, sexe)', () => {
    const existante = personne({
      racineParDefaut: true,
      vivant: true,
      sexe: 'homme',
    })
    const calculee = {
      sexe: 'inconnu' as const,
    }
    const fusion = fusionnerPourMiseAJour(existante, calculee)
    expect(fusion.racineParDefaut).toBeUndefined()
    expect(fusion.vivant).toBeUndefined()
    expect(fusion.sexe).toBeUndefined()
  })

  it('remplit familleId si null en base', () => {
    const existante = personne({ familleId: null })
    const fusion = fusionnerPourMiseAJour(existante, { familleId: 'fam-1' })
    expect(fusion.familleId).toBe('fam-1')
  })

  it('ne remplit pas familleId si deja rempli en base', () => {
    const existante = personne({ familleId: 'fam-deja' })
    const fusion = fusionnerPourMiseAJour(existante, { familleId: 'fam-1' })
    expect(fusion.familleId).toBeUndefined()
  })
})
