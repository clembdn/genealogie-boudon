'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CartePersonne } from '@/components/personne/CartePersonne'
import {
  LARGEUR_CARTE,
  HAUTEUR_CARTE,
  TAILLE_NOEUD_UNION,
  type DonneesNoeudPersonne,
} from '@/lib/arbre/layout'

export function NoeudPersonne({ data }: NodeProps) {
  const d = data as unknown as DonneesNoeudPersonne
  return (
    <div style={{ width: LARGEUR_CARTE, height: HAUTEUR_CARTE }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none' }}
      />
      <CartePersonne
        personne={d.personne}
        variante="compacte"
        focalisee={d.focalisee}
        categorie={d.categorie}
        className="w-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none' }}
      />
    </div>
  )
}

export function NoeudUnion() {
  return (
    <div
      style={{
        width: TAILLE_NOEUD_UNION,
        height: TAILLE_NOEUD_UNION,
      }}
      className="relative"
      aria-hidden
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none' }}
      />
      <div className="absolute inset-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sauge/60" />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none' }}
      />
    </div>
  )
}
