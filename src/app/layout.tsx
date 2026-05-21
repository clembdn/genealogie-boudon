import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
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
  title: 'Arbre généalogique de la famille Boudon',
  description: "Cinq siècles d'histoire familiale.",
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  )
}
