import { describe, it, expect } from 'vitest'
import { nomFamilleDepuisSlug } from './nom'

describe('nomFamilleDepuisSlug', () => {
  it('renomme arbre en Arbre principal', () => {
    expect(nomFamilleDepuisSlug('arbre')).toBe('Arbre principal')
  })

  it('formate boudon-hurgon en Boudon-Hurgon', () => {
    expect(nomFamilleDepuisSlug('boudon-hurgon')).toBe('Boudon-Hurgon')
  })

  it('formate boudon-pruniere en Boudon-Prunière', () => {
    expect(nomFamilleDepuisSlug('boudon-pruniere')).toBe('Boudon-Prunière')
  })

  it('capitalise un slug simple', () => {
    expect(nomFamilleDepuisSlug('maurin')).toBe('Maurin')
  })
})
