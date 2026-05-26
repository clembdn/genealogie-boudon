import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import { FournisseurRecherche } from '@/components/recherche/FournisseurRecherche'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Famille Boudon — Arbre généalogique',
    template: '%s · Famille Boudon',
  },
  description:
    'Cinq siècles de mémoires familiales : portraits, récits, documents et arbre généalogique de la famille Boudon.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--radius-douce)] focus:bg-encre focus:px-4 focus:py-2 focus:text-craie"
        >
          Aller au contenu
        </a>
        <FournisseurRecherche>
          <main id="contenu" className="flex-1">
            {children}
          </main>
        </FournisseurRecherche>
      </body>
    </html>
  )
}
