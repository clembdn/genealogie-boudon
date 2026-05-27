import { describe, it, expect } from 'vitest'
import { extraireDescriptionInitiale } from './description-source'

const POINTERS = [
  { text: 'Arbre BOUDON HURGON | 12 enfants | (8 Grandviala cne F.M. et 4 Mornac cne Espinasse)' },
  { text: 'Arbre BOUDON VEYLET | 3 enfants | Aldy' },
  { text: 'Arbre BOUDON PRUNIERE | 1 enfant | Veyrès' },
  { text: 'Voir arbre BOUDON / TROCELIER' },
]

describe('extraireDescriptionInitiale', () => {
  it('trouve le pointer Hurgon et formate avec retours à la ligne', () => {
    const desc = extraireDescriptionInitiale('boudon-hurgon', POINTERS)
    expect(desc).toBe(
      'Arbre BOUDON HURGON\n12 enfants\n(8 Grandviala cne F.M. et 4 Mornac cne Espinasse)',
    )
  })

  it("trouve Prunière malgré l'absence d'accent dans le pointer", () => {
    const desc = extraireDescriptionInitiale('boudon-pruniere', POINTERS)
    expect(desc).toContain('PRUNIERE')
  })

  it('retourne null pour un slug sans pointer', () => {
    expect(extraireDescriptionInitiale('boudon-maurin', POINTERS)).toBeNull()
  })

  it('retourne null pour la famille arbre (pas auto-référente)', () => {
    expect(extraireDescriptionInitiale('arbre', POINTERS)).toBeNull()
  })

  it('ignore les pointers de type "Voir arbre" trop courts', () => {
    expect(extraireDescriptionInitiale('boudon-trocelier', POINTERS)).toBeNull()
  })
})
