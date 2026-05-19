'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: people } = trpc.person.list.useQuery();

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Généalogie Boudon</h1>
        {session?.user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#666' }}>{session.user.email}</span>
            <button
              onClick={async () => {
                await authClient.signOut();
                router.push('/sign-in');
              }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      <p>
        <Link href="/tree/main">→ Voir l&apos;arbre généalogique</Link>
      </p>

      <h2 style={{ marginTop: '2rem' }}>
        Personnes recensées ({people?.length ?? 0})
      </h2>
      {people && people.length === 0 && (
        <p style={{ color: '#888' }}>
          Aucune personne enregistrée pour le moment.
        </p>
      )}
      <ul>
        {people?.map((p) => (
          <li key={p.id}>
            {p.firstName ?? '?'} {p.lastName ?? '?'}{' '}
            <small style={{ color: '#888' }}>
              ({p.birthDate ?? '?'}
              {p.deathDate ? ` – ${p.deathDate}` : ''})
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}
