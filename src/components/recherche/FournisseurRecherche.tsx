'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PaletteRecherche } from './PaletteRecherche'

type RechercheCtx = {
  ouvrir: () => void
  fermer: () => void
}

const Contexte = createContext<RechercheCtx | null>(null)

export function useRecherche(): RechercheCtx {
  const ctx = useContext(Contexte)
  if (!ctx) {
    throw new Error("useRecherche doit être utilisé dans <FournisseurRecherche>.")
  }
  return ctx
}

export function FournisseurRecherche({ children }: { children: ReactNode }) {
  const [ouverte, setOuverte] = useState(false)

  const ouvrir = useCallback(() => setOuverte(true), [])
  const fermer = useCallback(() => setOuverte(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null
      const dansChamp =
        cible?.tagName === 'INPUT' ||
        cible?.tagName === 'TEXTAREA' ||
        cible?.isContentEditable
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOuverte((o) => !o)
        return
      }
      if (!ouverte && !dansChamp && e.key === '/') {
        e.preventDefault()
        setOuverte(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [ouverte])

  const valeur = useMemo(() => ({ ouvrir, fermer }), [ouvrir, fermer])

  return (
    <Contexte.Provider value={valeur}>
      {children}
      <PaletteRecherche ouverte={ouverte} surFermeture={fermer} />
    </Contexte.Provider>
  )
}
