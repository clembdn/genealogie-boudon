export interface RelationSource {
  type: 'parent-child'
  fromId: string
  toId: string
}

export interface UnionConstruite {
  cle: string
  partenaires: [string, string]
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
      orphelins.push({ enfantId, parentId: liste[0] })
      continue
    }
    if (liste.length !== 2) {
      orphelins.push({ enfantId, parentId: liste.join(',') })
      continue
    }

    const cle = clePaire(liste[0], liste[1])
    if (!unionsParCle.has(cle)) {
      const [a, b] = [liste[0], liste[1]].sort()
      unionsParCle.set(cle, { cle, partenaires: [a, b] })
    }
    rattachements.push({ enfantId, unionCle: cle })
  }

  return {
    unions: [...unionsParCle.values()],
    rattachements,
    orphelins,
  }
}
