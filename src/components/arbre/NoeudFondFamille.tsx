'use client'

import type { NodeProps } from '@xyflow/react'
import { Users } from 'lucide-react'

export type DonneesNoeudFondFamille = {
  nom: string
  nbPersonnes: number
  couleur: string
  largeur: number
  hauteur: number
}

/**
 * Nœud ReactFlow servant de fond coloré discret derrière les membres d'une
 * famille dépliée. Positionné en z-index négatif pour rester derrière les
 * cartes de personnes.
 */
export function NoeudFondFamille({ data }: NodeProps) {
  const d = data as unknown as DonneesNoeudFondFamille

  return (
    <div
      style={{
        width: d.largeur,
        height: d.hauteur,
        backgroundColor: `${d.couleur}08`,
        border: `1px solid ${d.couleur}22`,
        borderRadius: 'var(--radius-moyenne)',
      }}
      className="pointer-events-none"
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ color: d.couleur }}
      >
        <Users size={13} aria-hidden />
        <span className="text-xs font-medium opacity-70">
          {d.nom} · {d.nbPersonnes} personne{d.nbPersonnes > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
