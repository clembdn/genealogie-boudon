import dagre from 'dagre'
import type { Person, Union } from '@prisma/client'
import type { CategorieParente } from '@/lib/genealogy/categories'
import type { LiaisonFamille } from '@/lib/arbre/liaisons'
import {
  LARGEUR_CARTE_FAMILLE,
  HAUTEUR_CARTE_FAMILLE,
} from '@/components/arbre/NoeudFamille'

export const LARGEUR_CARTE = 200
export const HAUTEUR_CARTE = 120
export const TAILLE_NOEUD_UNION = 14

export type DonneesNoeudPersonne = {
  personne: Person & { photoPrincipale?: { url: string } | null }
  focalisee: boolean
  categorie: CategorieParente
}

export type DonneesNoeudFamilleDagre = {
  famille: LiaisonFamille['famille']
  couleur: string
  ouverte: boolean
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
  | {
      id: string
      type: 'famille'
      position: { x: number; y: number }
      data: DonneesNoeudFamilleDagre
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
 * - Chaque liaison famille externe devient un nœud "famille" positionné
 *   côté conjoint externe (à la place du conjoint absent de l'arbre).
 */
export function calculerLayoutArbre({
  personnes,
  unions,
  idFocalise,
  categorieParPersonneId = {},
  liaisonsFamilles = [],
}: {
  personnes: PersonneAvecPhoto[]
  unions: Union[]
  idFocalise?: string | null
  categorieParPersonneId?: Record<string, CategorieParente>
  liaisonsFamilles?: (LiaisonFamille & { couleur: string; ouverte?: boolean })[]
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

  // Index des personnes externes remplacées par des nœuds famille.
  // Clé = personneExterneId, valeur = id du nœud famille.
  const externeVersFamille = new Map<string, string>()
  for (const l of liaisonsFamilles) {
    externeVersFamille.set(l.personneExterneId, `fam:${l.famille.slug}`)
  }

  for (const p of personnes) {
    g.setNode(p.id, { width: LARGEUR_CARTE, height: HAUTEUR_CARTE })
  }

  // Ajouter les nœuds famille (positionnés comme des conjoints).
  for (const l of liaisonsFamilles) {
    g.setNode(`fam:${l.famille.slug}`, {
      width: LARGEUR_CARTE_FAMILLE,
      height: HAUTEUR_CARTE_FAMILLE,
    })
  }

  for (const u of unions) {
    const idJonction = `u:${u.id}`
    g.setNode(idJonction, {
      width: TAILLE_NOEUD_UNION,
      height: TAILLE_NOEUD_UNION,
    })

    // Pour chaque partenaire, vérifier s'il est un conjoint externe remplacé
    // par un nœud famille. Si oui, on relie le nœud famille au lieu du
    // conjoint fantôme.
    for (const partnerId of [u.partenaire1Id, u.partenaire2Id]) {
      if (!partnerId) continue
      const noeudFamilleId = externeVersFamille.get(partnerId)
      if (noeudFamilleId) {
        g.setEdge(noeudFamilleId, idJonction)
      } else {
        g.setEdge(partnerId, idJonction)
      }
    }
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

  // Index positions des nœuds famille.
  const positionsFamilles = new Map<string, { x: number; y: number }>()
  for (const l of liaisonsFamilles) {
    const nId = `fam:${l.famille.slug}`
    const n = g.node(nId)
    if (n) positionsFamilles.set(nId, { x: n.x, y: n.y })
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
      data: {
        personne: p,
        focalisee: p.id === idFocalise,
        categorie: categorieParPersonneId[p.id] ?? 'NEUTRE',
      },
    })
  }

  // Nœuds d'union (jonctions).
  for (const u of unions) {
    const n = g.node(`u:${u.id}`)
    if (!n) continue
    // Recentrage horizontal entre les deux partenaires : donne un « V »
    // symétrique vers le nœud d'union au lieu d'une jonction décalée.
    // On prend en compte les nœuds famille pour le recentrage.
    const resolvePos = (id: string | null) => {
      if (!id) return null
      const famId = externeVersFamille.get(id)
      if (famId) return positionsFamilles.get(famId) ?? null
      return positionsPersonnes.get(id) ?? null
    }
    const a = resolvePos(u.partenaire1Id)
    const b = resolvePos(u.partenaire2Id)
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

  // Nœuds famille.
  for (const l of liaisonsFamilles) {
    const nId = `fam:${l.famille.slug}`
    const pos = positionsFamilles.get(nId)
    if (!pos) continue
    noeuds.push({
      id: nId,
      type: 'famille',
      position: {
        x: pos.x - LARGEUR_CARTE_FAMILLE / 2,
        y: pos.y - HAUTEUR_CARTE_FAMILLE / 2,
      },
      data: {
        famille: l.famille,
        couleur: l.couleur,
        ouverte: l.ouverte ?? false,
      },
    })
  }

  // Arêtes.
  const aretes: ArreteArbre[] = []
  for (const u of unions) {
    const idJonction = `u:${u.id}`

    for (const [i, partnerId] of [u.partenaire1Id, u.partenaire2Id].entries()) {
      if (!partnerId) continue
      const noeudFamilleId = externeVersFamille.get(partnerId)
      const sourceId = noeudFamilleId ?? partnerId
      aretes.push({
        id: `c${i + 1}:${u.id}`,
        source: sourceId,
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
