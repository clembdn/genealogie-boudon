import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutDashboard, Users, HeartHandshake } from 'lucide-react'
import { DeconnexionBouton } from './DeconnexionBouton'

export const metadata: Metadata = {
  title: 'Administration',
  description: "Espace de gestion de l'arbre généalogique.",
}

const liens = [
  { href: '/admin', label: 'Tableau de bord', icone: LayoutDashboard },
  { href: '/admin/personnes', label: 'Personnes', icone: Users },
  { href: '/admin/unions', label: 'Unions', icone: HeartHandshake },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:gap-10 sm:py-10">
      <aside className="sm:w-56 sm:shrink-0">
        <div className="mb-6 flex items-center justify-between sm:mb-8 sm:block">
          <p className="font-serif text-xs uppercase tracking-[0.18em] text-brume">
            Administration
          </p>
          <DeconnexionBouton className="sm:hidden" />
        </div>
        <nav className="flex flex-wrap gap-1 sm:flex-col sm:gap-0.5">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-2 rounded-[var(--radius-douce)] px-3 py-2 text-sm text-encre hover:bg-bordure/60"
            >
              <l.icone size={16} aria-hidden className="text-brume" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 hidden sm:block">
          <DeconnexionBouton />
        </div>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  )
}
