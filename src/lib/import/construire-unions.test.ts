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

  it('cree une union mono-parent (partenaire2 = null) quand un seul parent est connu', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const { unions, rattachements, orphelins } = construireUnions(relations)
    expect(unions).toHaveLength(1)
    expect(unions[0].cle).toBe('solo:p1')
    expect(unions[0].partenaires).toEqual(['p1', null])
    expect(rattachements).toEqual([{ enfantId: 'e1', unionCle: 'solo:p1' }])
    expect(orphelins).toEqual([])
  })

  it('regroupe plusieurs enfants du meme parent unique sous une seule union mono-parent', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p1', toId: 'e2' },
      { type: 'parent-child', fromId: 'p1', toId: 'e3' },
    ]
    const { unions, rattachements } = construireUnions(relations)
    expect(unions).toHaveLength(1)
    expect(unions[0].partenaires).toEqual(['p1', null])
    expect(rattachements).toHaveLength(3)
    expect(rattachements.every((r) => r.unionCle === 'solo:p1')).toBe(true)
  })

  it('cree des unions mono-parent distinctes pour des parents differents', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e2' },
    ]
    const { unions } = construireUnions(relations)
    expect(unions).toHaveLength(2)
    expect(unions.map((u) => u.cle).sort()).toEqual(['solo:p1', 'solo:p2'])
  })

  it('coexiste : un enfant avec 2 parents et un autre avec 1 parent partagent les memes records', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
      { type: 'parent-child', fromId: 'p1', toId: 'e2' },
    ]
    const { unions, rattachements } = construireUnions(relations)
    expect(unions).toHaveLength(2)
    const cles = unions.map((u) => u.cle).sort()
    expect(cles).toEqual(['p1|p2', 'solo:p1'])
    expect(rattachements).toHaveLength(2)
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

  it('signale comme orphelin un enfant avec plus de 2 parents (donnee corrompue)', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
      { type: 'parent-child', fromId: 'p3', toId: 'e1' },
    ]
    const { unions, orphelins } = construireUnions(relations)
    expect(unions).toEqual([])
    expect(orphelins).toHaveLength(1)
    expect(orphelins[0].enfantId).toBe('e1')
  })
})
