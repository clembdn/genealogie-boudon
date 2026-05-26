'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { classesBouton } from '@/components/ui/classes-bouton'

type Props = {
  action: () => Promise<void>
  confirmation: string
  libelle?: string
}

export function BoutonSupprimer({
  action,
  confirmation,
  libelle = 'Supprimer',
}: Props) {
  const [enCours, demarrer] = useTransition()
  const [confirme, setConfirme] = useState(false)

  if (!confirme) {
    return (
      <button
        type="button"
        onClick={() => setConfirme(true)}
        className={`${classesBouton('discret', 'petit')} text-red-700 hover:bg-red-50`}
      >
        <Trash2 size={14} aria-hidden />
        {libelle}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-douce)] border border-red-200 bg-red-50 px-3 py-2 text-sm">
      <span className="text-red-700">{confirmation}</span>
      <button
        type="button"
        onClick={() => demarrer(() => action())}
        disabled={enCours}
        className="rounded-[var(--radius-douce)] bg-red-700 px-3 py-1 text-craie hover:bg-red-800 disabled:opacity-50"
      >
        {enCours ? 'Suppression…' : 'Confirmer'}
      </button>
      <button
        type="button"
        onClick={() => setConfirme(false)}
        disabled={enCours}
        className="rounded-[var(--radius-douce)] px-3 py-1 text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Annuler
      </button>
    </div>
  )
}
