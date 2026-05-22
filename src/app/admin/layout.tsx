import Link from 'next/link'
import { deconnexion } from './actions'

// Rendu dynamique pour tout l'espace /admin : les pages lisent la base à
// chaque requête (données toujours fraîches) et ne sont jamais pré-générées
// au build — `next build` n'a donc pas besoin de la base.
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-bordure bg-craie px-6 py-3">
        <nav className="flex items-center gap-5">
          <Link href="/admin" className="font-serif text-lg font-semibold text-encre">
            Administration
          </Link>
          <Link href="/admin/personnes" className="text-sm text-encre hover:text-sauge">
            Personnes
          </Link>
          <Link href="/admin/unions" className="text-sm text-encre hover:text-sauge">
            Unions
          </Link>
        </nav>
        <form action={deconnexion}>
          <button type="submit" className="text-sm text-brume hover:text-encre">
            Se déconnecter
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  )
}
