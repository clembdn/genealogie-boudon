import Link from 'next/link'
import { classesBouton } from '@/components/ui/classes-bouton'

export default function PersonneIntrouvable() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <p className="font-sans text-sm uppercase tracking-[0.18em] text-brume">
        Page introuvable
      </p>
      <h1 className="mt-4 font-serif text-3xl text-encre sm:text-4xl">
        Cette personne n&apos;a pas été trouvée
      </h1>
      <p className="mt-3 max-w-sm text-base text-brume">
        L&apos;adresse a peut-être changé, ou la fiche a été retirée par les
        administrateurs.
      </p>
      <Link href="/" className={`mt-8 ${classesBouton('primaire', 'moyen')}`}>
        Explorer l&apos;arbre
      </Link>
    </section>
  )
}
