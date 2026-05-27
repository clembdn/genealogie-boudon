import { describe, it, expect } from 'vitest'
import { validerCible, type Cible } from './cible'

describe('validerCible', () => {
  it('accepte une cible personne valide', () => {
    expect(validerCible({ type: 'personne', id: 'p1' })).toBeUndefined()
  })

  it('accepte une cible famille valide', () => {
    expect(validerCible({ type: 'famille', id: 'f1' })).toBeUndefined()
  })

  it('rejette une cible sans id', () => {
    expect(() => validerCible({ type: 'personne', id: '' } as Cible)).toThrow()
  })

  it('rejette un type inconnu', () => {
    expect(() => validerCible({ type: 'autre' as 'personne', id: 'x' })).toThrow()
  })
})
