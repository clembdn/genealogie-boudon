import { describe, it, expect } from 'vitest'
import { construireUnions, type RelationSource } from './construire-unions'

describe('construireUnions', () => {
  it('cree une union pour deux parents partageant un enfant', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
    ]
    const { unions, rattachements, orphelins } = construireUnions(relations)
    expect(unions).toHaveLength(1)
    expect(unions[0].partenaires).toEqual(['p1', 'p2'].sort())
    expect(rattachements).toEqual([{ enfantId: 'e1', unionCle: 'p1|p2' }])
    expect(orphelins).toEqual([])
  })

  it('regroupe plusieurs enfants sous la meme union de parents', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
      { type: 'parent-child', fromId: 'p1', toId: 'e2' },
      { type: 'parent-child', fromId: 'p2', toId: 'e2' },
    ]
    const { unions, rattachements } = construireUnions(relations)
    expect(unions).toHaveLength(1)
    expect(rattachements).toHaveLength(2)
    expect(rattachements.every((r) => r.unionCle === 'p1|p2')).toBe(true)
  })

  it('signale comme orphelin un enfant avec un seul parent', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const { unions, rattachements, orphelins } = construireUnions(relations)
    expect(unions).toEqual([])
    expect(rattachements).toEqual([])
    expect(orphelins).toEqual([{ enfantId: 'e1', parentId: 'p1' }])
  })

  it('ignore les relations non parent-child', () => {
    const relations: RelationSource[] = [
      { type: 'cousin' as 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const { unions } = construireUnions(relations)
    expect(unions).toEqual([])
  })

  it("genere une cle deterministe quelle que soit l'ordre des parents", () => {
    const r1: RelationSource[] = [
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const r2: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
    ]
    expect(construireUnions(r1).unions[0].cle).toBe(
      construireUnions(r2).unions[0].cle,
    )
  })
})
