import Link from 'next/link'
import { prisma } from '@/lib/db'

// Rendu à la demande, pas de pré-génération au build : `next build` ne se
// connecte donc jamais à la base et fonctionne même sur un réseau qui bloque
// le port PostgreSQL. Sur Vercel, la page est rendue à chaque requête et
// joint Neon normalement.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const total = await prisma.person.count()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="font-serif text-4xl font-semibold text-encre">
        Arbre généalogique de la famille Boudon
      </h1>
      <p className="text-brume">
        {total} personnes importées depuis les archives familiales.
      </p>
      <Link
        href="/login"
        className="mt-4 rounded-lg bg-sauge px-5 py-2 font-medium text-craie"
      >
        Espace administrateur
      </Link>
    </main>
  )
}
