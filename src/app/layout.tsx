import type { Metadata } from 'next';
import { TRPCProvider } from '@/trpc/provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Généalogie Boudon',
  description: 'Arbre généalogique familial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
