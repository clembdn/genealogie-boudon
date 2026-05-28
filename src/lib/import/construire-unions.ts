export interface RelationSource {
  type: 'parent-child'
  fromId: string
  toId: string
}

export interface UnionConstruite {
  cle: string
  /** [partenaire1, partenaire2] ; partenaire2 = null pour une union mono-parent. */
  partenaires: [string, string | null]
}

export interface RattachementEnfant {
  enfantId: string
  unionCle: string
}

export interface OrphelinUnParent {
  enfantId: string
  parentId: string
}

export interface ResultatConstruction {
  unions: UnionConstruite[]
  rattachements: RattachementEnfant[]
  orphelins: OrphelinUnParent[]
}

function clePaire(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function cleSolo(parentId: string): string {
  return `solo:${parentId}`
}

export function construireUnions(
  relations: ReadonlyArray<RelationSource>,
): ResultatConstruction {
  const parentsParEnfant = new Map<string, Set<string>>()

  for (const rel of relations) {
    if (rel.type !== 'parent-child') continue
    const set = parentsParEnfant.get(rel.toId) ?? new Set<string>()
    set.add(rel.fromId)
    parentsParEnfant.set(rel.toId, set)
  }

  const unionsParCle = new Map<string, UnionConstruite>()
  const rattachements: RattachementEnfant[] = []
  const orphelins: OrphelinUnParent[] = []

  for (const [enfantId, parents] of parentsParEnfant) {
    const liste = [...parents]

    if (liste.length === 1) {
      const parentId = liste[0]
      const cle = cleSolo(parentId)
      if (!unionsParCle.has(cle)) {
        unionsParCle.set(cle, { cle, partenaires: [parentId, null] })
      }
      rattachements.push({ enfantId, unionCle: cle })
      continue
    }

    if (liste.length === 2) {
      const [a, b] = [liste[0], liste[1]].sort()
      const cle = clePaire(a, b)
      if (!unionsParCle.has(cle)) {
        unionsParCle.set(cle, { cle, partenaires: [a, b] })
      }
      rattachements.push({ enfantId, unionCle: cle })
      continue
    }

    // 3+ parents : donnée corrompue, on garde en trace.
    orphelins.push({ enfantId, parentId: liste.join(',') })
  }

  return {
    unions: [...unionsParCle.values()],
    rattachements,
    orphelins,
  }
}
