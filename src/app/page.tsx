import { prisma } from '@/lib/db'

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
      <p className="text-sm text-brume">Fondations en place — Lot 1 terminé.</p>
    </main>
  )
}
