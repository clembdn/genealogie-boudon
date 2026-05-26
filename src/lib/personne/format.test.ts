import { describe, it, expect } from 'vitest'
import {
  extraireAnnee,
  formatDates,
  nomComplet,
  slugPersonne,
} from './format'

describe('extraireAnnee', () => {
  it('extrait une année seule', () => {
    expect(extraireAnnee('1600')).toBe(1600)
  })
  it('extrait une année dans une date complète', () => {
    expect(extraireAnnee('01 juin 1695')).toBe(1695)
  })
  it('gère le préfixe "vers"', () => {
    expect(extraireAnnee('vers 1820')).toBe(1820)
  })
  it('extrait l\'année dans une chaîne bruitée', () => {
    expect(extraireAnnee('Beauregard cne F.P. Testament 1702 ?')).toBe(1702)
  })
  it('renvoie null si aucune année plausible', () => {
    expect(extraireAnnee('Rimeizenc')).toBeNull()
    expect(extraireAnnee('')).toBeNull()
    expect(extraireAnnee(null)).toBeNull()
    expect(extraireAnnee(undefined)).toBeNull()
  })
  it('refuse les nombres hors plage temporelle', () => {
    expect(extraireAnnee('en 42')).toBeNull()
    expect(extraireAnnee('année 9999')).toBeNull()
  })
  it('prend la première année si plusieurs', () => {
    expect(extraireAnnee('né 1820 décédé 1898')).toBe(1820)
  })
})

describe('formatDates', () => {
  it('formate une vie complète', () => {
    expect(
      formatDates({
        naissanceDate: '1600',
        decesDate: '01 juin 1695',
        vivant: false,
      }),
    ).toBe('1600 – 1695')
  })
  it('formate une personne vivante avec naissance connue', () => {
    expect(
      formatDates({
        naissanceDate: '1952',
        decesDate: null,
        vivant: true,
      }),
    ).toBe('1952 –')
  })
  it('formate naissance connue, décédé sans date', () => {
    expect(
      formatDates({
        naissanceDate: '1600',
        decesDate: null,
        vivant: false,
      }),
    ).toBe('1600 – ?')
  })
  it('formate décès seul connu', () => {
    expect(
      formatDates({
        naissanceDate: null,
        decesDate: '1695',
        vivant: false,
      }),
    ).toBe('– 1695')
  })
  it('renvoie chaîne vide si rien d\'interprétable', () => {
    expect(
      formatDates({
        naissanceDate: 'Rimeizenc',
        decesDate: null,
        vivant: false,
      }),
    ).toBe('')
  })
})

describe('nomComplet', () => {
  it('joint prénoms et nom', () => {
    expect(nomComplet({ nom: 'BOUDON', prenoms: 'Marguerite' })).toBe(
      'Marguerite BOUDON',
    )
  })
  it('gère un nom seul', () => {
    expect(nomComplet({ nom: 'BOUDON', prenoms: '' })).toBe('BOUDON')
  })
  it('fallback si tout vide', () => {
    expect(nomComplet({ nom: '', prenoms: '' })).toBe('Personne sans nom')
  })
})

describe('slugPersonne', () => {
  it('génère un slug standard', () => {
    expect(
      slugPersonne({
        id: 'abc123',
        nom: 'BOUDON',
        prenoms: 'Marguerite',
        naissanceDate: '1600',
      }),
    ).toBe('marguerite-boudon-1600')
  })
  it('gère les accents', () => {
    expect(
      slugPersonne({
        id: 'abc123',
        nom: 'GAÉTAN',
        prenoms: 'Léa',
        naissanceDate: '1820',
      }),
    ).toBe('lea-gaetan-1820')
  })
  it('omet la date si non extractible', () => {
    expect(
      slugPersonne({
        id: 'abc123',
        nom: 'BOUDON',
        prenoms: 'Augustin',
        naissanceDate: 'Beauregard',
      }),
    ).toBe('augustin-boudon')
  })
  it('fallback sur id si rien d\'utilisable', () => {
    expect(
      slugPersonne({
        id: 'abc123def',
        nom: '',
        prenoms: '',
        naissanceDate: null,
      }),
    ).toBe('personne-abc123')
  })
})
