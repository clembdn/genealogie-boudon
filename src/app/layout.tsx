import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arbre généalogique de la famille Boudon',
  description:
    "L'histoire de la famille Boudon, génération après génération.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
