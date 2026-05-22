'use client'

import { useActionState } from 'react'
import { connexion } from './actions'

export default function PageConnexion() {
  const [erreur, action, enCours] = useActionState(connexion, undefined)

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={action}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-bordure bg-craie p-8"
      >
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Espace administrateur
        </h1>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-encre">Mot de passe</span>
          <input
            type="password"
            name="motDePasse"
            autoFocus
            required
            className="rounded-lg border border-bordure bg-papier px-3 py-2"
          />
        </label>
        {erreur ? <p className="text-sm text-red-700">{erreur}</p> : null}
        <button
          type="submit"
          disabled={enCours}
          className="rounded-lg bg-sauge px-4 py-2 font-medium text-craie disabled:opacity-60"
        >
          {enCours ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}
