'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  ouverte: boolean
  surFermeture: () => void
  titre?: string
  children: ReactNode
  largeMax?: 'standard' | 'large'
}

export function Modale({
  ouverte,
  surFermeture,
  titre,
  children,
  largeMax = 'standard',
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (ouverte && !dialog.open) dialog.showModal()
    if (!ouverte && dialog.open) dialog.close()
  }, [ouverte])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handler = () => surFermeture()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [surFermeture])

  const surClicFond: React.MouseEventHandler<HTMLDialogElement> = (e) => {
    if (e.target === ref.current) ref.current?.close()
  }

  const largeurs = {
    standard: 'max-w-xl',
    large: 'max-w-3xl',
  } as const

  return (
    <dialog
      ref={ref}
      onClick={surClicFond}
      aria-label={titre}
      className={`m-auto w-[calc(100%-1.5rem)] ${largeurs[largeMax]} rounded-[var(--radius-moyenne)] border border-bordure bg-craie p-0 text-encre shadow-[var(--shadow-flottante)] open:animate-in`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-bordure px-6 py-4">
        <h2 className="font-serif text-2xl leading-tight">{titre}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Fermer"
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-brume hover:bg-papier hover:text-encre"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  )
}
