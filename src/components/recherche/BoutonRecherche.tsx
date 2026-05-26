'use client'

import { Search } from 'lucide-react'
import { useRecherche } from './FournisseurRecherche'

export function BoutonRecherche() {
  const { ouvrir } = useRecherche()
  return (
    <button
      type="button"
      onClick={ouvrir}
      aria-label="Rechercher une personne"
      className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-douce)] border border-bordure bg-craie px-3 text-sm text-brume hover:border-sauge hover:text-encre"
    >
      <Search size={16} aria-hidden />
      <span className="hidden sm:inline">Rechercher</span>
      <kbd className="ml-2 hidden rounded border border-bordure bg-papier px-1.5 py-0.5 text-[10px] font-mono text-brume sm:inline">
        ⌘K
      </kbd>
    </button>
  )
}
