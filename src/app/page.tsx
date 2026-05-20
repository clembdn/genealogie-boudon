import Link from 'next/link';
import { loadArbreData } from '@/lib/arbre-data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await loadArbreData();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        gap: '1.5rem',
      }}
    >
      <p
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: '0.85rem',
          color: 'var(--ink-soft)',
          margin: 0,
        }}
      >
        Arbre généalogique
      </p>

      <h1 style={{ fontSize: '3rem', margin: 0 }}>Famille Boudon</h1>

      <p
        style={{
          maxWidth: 520,
          color: 'var(--ink-soft)',
          margin: 0,
          fontSize: '1.15rem',
        }}
      >
        Plusieurs siècles d&apos;histoire familiale, du XVII<sup>e</sup> siècle à
        aujourd&apos;hui. Explorez les {data.persons.length} personnes recensées,
        génération après génération.
      </p>

      <Link href="/arbre" className="btn-primary">
        Explorer l&apos;arbre
      </Link>

      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginTop: '1rem' }}>
        {data.generations.length} générations &middot; consultation libre
      </p>
    </main>
  );
}
