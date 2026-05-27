import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifierJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'

export async function Entete() {
  const store = await cookies()
  const jeton = store.get(NOM_COOKIE_SESSION)?.value
  const connecte = await verifierJetonSession(jeton)

  return (
    <header className="border-b border-bordure bg-craie">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="font-serif text-lg text-encre">
          Famille Boudon
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-[var(--radius-douce)] px-3 py-1.5 text-encre hover:bg-bordure/60"
          >
            Arbre
          </Link>
          <Link
            href="/familles"
            className="rounded-[var(--radius-douce)] px-3 py-1.5 text-encre hover:bg-bordure/60"
          >
            Familles
          </Link>
          {connecte && (
            <Link
              href="/admin"
              className="rounded-[var(--radius-douce)] px-3 py-1.5 text-brume hover:bg-bordure/60 hover:text-encre"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
