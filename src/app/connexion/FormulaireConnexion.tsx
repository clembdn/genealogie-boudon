'use client'

import { useActionState } from 'react'
import { Bouton } from '@/components/ui/Bouton'
import { connexionAction } from './actions'

type Props = { retour: string | null }

export function FormulaireConnexion({ retour }: Props) {
  const [etat, action, enCours] = useActionState(connexionAction, null)

  return (
    <form
      action={action}
      className="mt-10 flex w-full flex-col gap-4 text-left"
      noValidate
    >
      {retour && <input type="hidden" name="retour" value={retour} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-encre">Mot de passe</span>
        <input
          type="password"
          name="motDePasse"
          required
          autoFocus
          autoComplete="current-password"
          className="h-11 rounded-[var(--radius-douce)] border border-bordure bg-craie px-3 text-base text-encre outline-none focus:border-sauge"
        />
      </label>

      {etat?.erreur && (
        <p className="text-sm text-red-700" role="alert">
          {etat.erreur}
        </p>
      )}

      <Bouton type="submit" disabled={enCours} className="mt-2">
        {enCours ? 'Vérification…' : 'Se connecter'}
      </Bouton>
    </form>
  )
}
