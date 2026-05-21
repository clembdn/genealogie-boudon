import { describe, it, expect } from 'vitest'
import { styleLienUnion } from './union-style'

describe('styleLienUnion', () => {
  it('renvoie "pointille" pour une union libre', () => {
    expect(styleLienUnion({ nature: 'union_libre', causeFin: null })).toBe(
      'pointille',
    )
  })

  it('renvoie "barre" pour un mariage terminé par un divorce', () => {
    expect(styleLienUnion({ nature: 'mariage', causeFin: 'divorce' })).toBe(
      'barre',
    )
  })

  it('renvoie "plein" pour un mariage sans fin renseignée', () => {
    expect(styleLienUnion({ nature: 'mariage', causeFin: null })).toBe('plein')
  })

  it('renvoie "plein" pour un mariage terminé par un décès', () => {
    expect(styleLienUnion({ nature: 'mariage', causeFin: 'deces' })).toBe(
      'plein',
    )
  })

  it('renvoie "plein" pour une union de nature inconnue', () => {
    expect(styleLienUnion({ nature: 'inconnue', causeFin: null })).toBe('plein')
  })
})
