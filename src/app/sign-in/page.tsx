'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await authClient.signIn.email({ email, password });
    setLoading(false);

    if (err) {
      setError(err.message ?? 'Identifiants incorrects.');
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '4rem auto' }}>
      <h1>Connexion</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Cet espace est réservé aux membres de la famille.
      </p>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              display: 'block',
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.25rem',
              fontSize: '1rem',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              display: 'block',
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.25rem',
              fontSize: '1rem',
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        {error && (
          <p style={{ color: '#c00', marginTop: '1rem' }}>{error}</p>
        )}
      </form>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
