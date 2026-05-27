import { describe, it, expect } from 'vitest'
import {
  transformPerson,
  construireNotesImport,
  type SourcePerson,
} from './transform-person'

function source(over: Partial<SourcePerson> = {}): SourcePerson {
  return {
    id: 'arbre-49',
    shapeName: 'Rectangle 274',
    multiPerson: false,
    raw: 'BOUDON Marguerite | ° 1600 | + 01 juin 1695 / Rimeizenc',
    nom: 'BOUDON',
    prenoms: 'Marguerite',
    surnom: null,
    naissance: { date: '1600', lieu: null },
    deces: { date: '01 juin 1695', lieu: 'Rimeizenc' },
    parrain: null,
    marraine: null,
    notes: null,
    ...over,
  }
}

describe('transformPerson', () => {
  it('mappe les champs principaux', () => {
    const p = transformPerson(source())
    expect(p.id).toBe('arbre-49')
    expect(p.nom).toBe('BOUDON')
    expect(p.prenoms).toBe('Marguerite')
    expect(p.naissanceDate).toBe('1600')
    expect(p.decesDate).toBe('01 juin 1695')
    expect(p.decesLieu).toBe('Rimeizenc')
  })

  it('applique les valeurs par defaut', () => {
    const p = transformPerson(source())
    expect(p.sexe).toBe('inconnu')
    expect(p.branche).toBe('Boudon')
    expect(p.vivant).toBe(false)
    expect(p.ordreFratrie).toBe(0)
    expect(p.profession).toBeNull()
    expect(p.recit).toBeNull()
  })

  it('gere un deces absent', () => {
    const p = transformPerson(source({ deces: null }))
    expect(p.decesDate).toBeNull()
    expect(p.decesLieu).toBeNull()
  })

  it('gere des prenoms manquants', () => {
    const p = transformPerson(source({ prenoms: null }))
    expect(p.prenoms).toBe('')
  })

  it("place le texte Excel d'origine dans notesImport", () => {
    const p = transformPerson(source())
    expect(p.notesImport).toContain('BOUDON Marguerite')
  })

  it("ajoute la note d'origine dans notesImport quand elle existe", () => {
    const p = transformPerson(source({ notes: 'x BRUNET Philippe · 3 enfants' }))
    expect(p.notesImport).toContain('x BRUNET Philippe')
  })

  it('signale un rectangle partage pour une personne multiPerson', () => {
    const p = transformPerson(
      source({ multiPerson: true, shapeName: 'Rectangle 274_4' }),
    )
    expect(p.notesImport).toContain('Rectangle 274_4')
  })

  it('rattache la personne à la famille fournie', () => {
    const p = transformPerson(source(), {
      familleId: 'fam-hurgon',
      familleNom: 'Boudon-Hurgon',
    })
    expect(p.familleId).toBe('fam-hurgon')
    expect(p.branche).toBe('Boudon-Hurgon')
  })

  it('utilise les valeurs par defaut si pas de famille fournie', () => {
    const p = transformPerson(source())
    expect(p.familleId).toBeNull()
    expect(p.branche).toBe('Boudon')
  })
})

describe('construireNotesImport', () => {
  it("n'ajoute pas de ligne de regroupement hors multiPerson", () => {
    expect(construireNotesImport(source())).not.toContain('Rectangle partag')
  })
})
