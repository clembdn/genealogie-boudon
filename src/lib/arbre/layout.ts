import dagre from 'dagre'
import type { Person, Union } from '@prisma/client'

export const LARGEUR_CARTE = 200
export const HAUTEUR_CARTE = 120
export const TAILLE_NOEUD_UNION = 14

export type DonneesNoeudPersonne = {
  personne: Person & { photoPrincipale?: { url: string } | null }
  focalisee: boolean
}

export type NoeudArbre =
  | {
      id: string
      type: 'personne'
      position: { x: number; y: number }
      data: DonneesNoeudPersonne
    }
  | {
      id: string
      type: 'union'
      position: { x: number; y: number }
      data: { unionId: string }
    }

export type ArreteArbre = {
  id: string
  source: string
  target: string
  type: 'couple' | 'filiation'
}

type PersonneAvecPhoto = Person & { photoPrincipale?: { url: string } | null }

/**
 * Calcule positions et arêtes d'un arbre généalogique via dagre.
 * - Chaque personne devient un nœud visible.
 * - Chaque union devient un petit nœud "jonction" pour relier proprement
 *   les conjoints à leurs enfants communs.
 */
export function calculerLayoutArbre({
  personnes,
  unions,
  idFocalise,
}: {
  personnes: PersonneAvecPhoto[]
  unions: Union[]
  idFocalise?: string | null
}): { noeuds: NoeudArbre[]; aretes: ArreteArbre[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB',
    ranksep: 140,
    nodesep: 60,
    edgesep: 24,
    marginx: 60,
    marginy: 60,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const p of personnes) {
    g.setNode(p.id, { width: LARGEUR_CARTE, height: HAUTEUR_CARTE })
  }

  for (const u of unions) {
    const idJonction = `u:${u.id}`
    g.setNode(idJonction, {
      width: TAILLE_NOEUD_UNION,
      height: TAILLE_NOEUD_UNION,
    })
    if (u.partenaire1Id) g.setEdge(u.partenaire1Id, idJonction)
    if (u.partenaire2Id) g.setEdge(u.partenaire2Id, idJonction)
  }

  for (const p of personnes) {
    if (p.unionParentaleId) {
      g.setEdge(`u:${p.unionParentaleId}`, p.id)
    }
  }

  dagre.layout(g)

  // Index positions des personnes pour le post-traitement.
  const positionsPersonnes = new Map<string, { x: number; y: number }>()
  for (const p of personnes) {
    const n = g.node(p.id)
    if (n) positionsPersonnes.set(p.id, { x: n.x, y: n.y })
  }

  const noeuds: NoeudArbre[] = []
  for (const p of personnes) {
    const pos = positionsPersonnes.get(p.id)
    if (!pos) continue
    noeuds.push({
      id: p.id,
      type: 'personne',
      position: {
        x: pos.x - LARGEUR_CARTE / 2,
        y: pos.y - HAUTEUR_CARTE / 2,
      },
      data: { personne: p, focalisee: p.id === idFocalise },
    })
  }
  for (const u of unions) {
    const n = g.node(`u:${u.id}`)
    if (!n) continue
    // Recentrage horizontal entre les deux partenaires : donne un « V »
    // symétrique vers le nœud d'union au lieu d'une jonction décalée.
    const a = u.partenaire1Id ? positionsPersonnes.get(u.partenaire1Id) : null
    const b = u.partenaire2Id ? positionsPersonnes.get(u.partenaire2Id) : null
    const xCentre = a && b ? (a.x + b.x) / 2 : n.x
    noeuds.push({
      id: `u:${u.id}`,
      type: 'union',
      position: {
        x: xCentre - TAILLE_NOEUD_UNION / 2,
        y: n.y - TAILLE_NOEUD_UNION / 2,
      },
      data: { unionId: u.id },
    })
  }

  const aretes: ArreteArbre[] = []
  for (const u of unions) {
    const idJonction = `u:${u.id}`
    if (u.partenaire1Id) {
      aretes.push({
        id: `c1:${u.id}`,
        source: u.partenaire1Id,
        target: idJonction,
        type: 'couple',
      })
    }
    if (u.partenaire2Id) {
      aretes.push({
        id: `c2:${u.id}`,
        source: u.partenaire2Id,
        target: idJonction,
        type: 'couple',
      })
    }
  }
  for (const p of personnes) {
    if (p.unionParentaleId) {
      aretes.push({
        id: `f:${p.id}`,
        source: `u:${p.unionParentaleId}`,
        target: p.id,
        type: 'filiation',
      })
    }
  }

  return { noeuds, aretes }
}
