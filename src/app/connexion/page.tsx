import type { Metadata } from 'next'
import { FormulaireConnexion } from './FormulaireConnexion'

export const metadata: Metadata = {
  title: 'Connexion',
  description: "Espace privé d'administration de l'arbre généalogique.",
}

type Props = {
  searchParams: Promise<{ retour?: string }>
}

export default async function PageConnexion({ searchParams }: Props) {
  const { retour } = await searchParams

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center sm:py-28">
      <p className="font-sans text-sm uppercase tracking-[0.18em] text-brume">
        Espace privé
      </p>
      <h1 className="mt-4 font-serif text-4xl text-encre">Connexion</h1>
      <p className="mt-3 max-w-sm text-base text-brume">
        Réservé aux administrateurs de l&apos;arbre.
      </p>

      <FormulaireConnexion retour={retour ?? null} />
    </section>
  )
}
