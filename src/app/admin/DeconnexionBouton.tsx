'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { deconnexionAction } from '@/app/connexion/actions'
import { classesBouton } from '@/components/ui/classes-bouton'

type Props = { className?: string }

export function DeconnexionBouton({ className = '' }: Props) {
  const [enCours, demarrer] = useTransition()
  return (
    <button
      type="button"
      onClick={() => demarrer(() => deconnexionAction())}
      disabled={enCours}
      className={`${classesBouton('discret', 'petit')} ${className}`}
    >
      <LogOut size={14} aria-hidden />
      {enCours ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  )
}
