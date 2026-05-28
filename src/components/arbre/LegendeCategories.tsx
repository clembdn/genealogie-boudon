'use client'

import { useEffect, useState } from 'react'
import { Palette, X } from 'lucide-react'
import {
  COULEURS_CATEGORIE,
  LIBELLES_CATEGORIE,
  ORDRE_AFFICHAGE_LEGENDE,
} from '@/lib/genealogy/categories'

const CLE_LOCALSTORAGE = 'legende-categories-depliee'

function lireEtatInitial(): boolean {
  if (typeof window === 'undefined') return false
  const stocke = window.localStorage.getItem(CLE_LOCALSTORAGE)
  if (stocke === 'true') return true
  if (stocke === 'false') return false
  return window.matchMedia('(min-width: 640px)').matches
}

export function LegendeCategories() {
  const [depliee, setDepliee] = useState(false)
  const [hydrate, setHydrate] = useState(false)

  // Hydratation côté client uniquement pour éviter le mismatch SSR.
  useEffect(() => {
    setDepliee(lireEtatInitial())
    setHydrate(true)
  }, [])

  useEffect(() => {
    if (!hydrate) return
    window.localStorage.setItem(CLE_LOCALSTORAGE, String(depliee))
  }, [depliee, hydrate])

  if (!hydrate) return null

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20">
      {depliee ? (
        <div className="pointer-events-auto w-64 rounded-[var(--radius-moyenne)] border border-bordure/70 bg-craie/95 p-4 shadow-[var(--shadow-douce)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-serif text-sm text-encre">
              Lien avec le De cujus
            </h2>
            <button
              type="button"
              onClick={() => setDepliee(false)}
              aria-label="Replier la légende"
              className="rounded p-1 text-brume transition-colors hover:bg-papier hover:text-encre focus-visible:outline-sauge"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {ORDRE_AFFICHAGE_LEGENDE.map((cat) => {
              const couleur = COULEURS_CATEGORIE[cat]
              return (
                <li key={cat} className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-bordure"
                    style={{
                      backgroundColor: couleur ?? 'transparent',
                    }}
                  />
                  <span className="text-encre">{LIBELLES_CATEGORIE[cat]}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDepliee(true)}
          aria-label="Afficher la légende des couleurs"
          className="pointer-events-auto flex items-center gap-2 rounded-[var(--radius-pilule)] border border-bordure/70 bg-craie/95 px-3 py-2 text-xs text-encre shadow-[var(--shadow-douce)] backdrop-blur-md transition-shadow hover:shadow-[var(--shadow-elevee)] focus-visible:outline-sauge"
        >
          <Palette size={14} aria-hidden className="text-sauge" />
          Légende
        </button>
      )}
    </div>
  )
}
