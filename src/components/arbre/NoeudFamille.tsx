'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ChevronRight, Users } from 'lucide-react'
import type { DonneesNoeudFamilleDagre } from '@/lib/arbre/layout'

export const LARGEUR_CARTE_FAMILLE = 200
export const HAUTEUR_CARTE_FAMILLE = 80

export function NoeudFamille({ data }: NodeProps) {
  const d = data as unknown as DonneesNoeudFamilleDagre

  return (
    <div
      style={{ width: LARGEUR_CARTE_FAMILLE, height: HAUTEUR_CARTE_FAMILLE }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none' }}
      />
      <div
        className="flex h-full cursor-pointer select-none items-center gap-3 rounded-[var(--radius-moyenne)] border border-bordure bg-craie px-4 shadow-[var(--shadow-douce)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevee)]"
        style={{ borderLeft: `4px solid ${d.couleur}` }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm leading-tight text-encre">
            {d.famille.nom}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-brume">
            <Users size={12} aria-hidden />
            {d.famille.nbPersonnes} personne{d.famille.nbPersonnes > 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight
          size={16}
          aria-hidden
          className="shrink-0 text-brume transition-transform duration-200"
          style={{
            transform: d.ouverte ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none' }}
      />
    </div>
  )
}
