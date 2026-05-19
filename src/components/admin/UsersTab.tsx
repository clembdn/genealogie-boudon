'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { inputStyle, cellStyle } from './styles';

export function UsersTab() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();

  const invite = trpc.admin.inviteUser.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
      setName('');
      setEmail('');
      setPassword('');
      setMessage({ type: 'ok', text: 'Membre ajouté.' });
    },
    onError: (err) =>
      setMessage({ type: 'error', text: err.message ?? 'Erreur' }),
  });
  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const remove = trpc.admin.deleteUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
    onError: (err) => alert(err.message),
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<
    { type: 'ok' | 'error'; text: string } | null
  >(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    invite.mutate({ name, email, password });
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Utilisateurs</h2>

      <section style={{ marginBottom: '2rem' }}>
        <h3>Inviter un membre de la famille</h3>
        <p style={{ color: '#666' }}>
          Le membre se connectera ensuite avec l&apos;email et le mot de passe
          que tu lui transmets.
        </p>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr) auto',
            gap: '0.5rem',
            alignItems: 'end',
          }}
        >
          <label>
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
          <label>
            Mot de passe initial
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="≥ 8 caractères"
              style={inputStyle}
            />
          </label>
          <button
            type="submit"
            disabled={invite.isPending}
            style={{ padding: '0.5rem 1rem' }}
          >
            {invite.isPending ? '…' : 'Créer'}
          </button>
        </form>
        {message && (
          <p
            style={{
              marginTop: '0.5rem',
              color: message.type === 'ok' ? '#0a0' : '#c00',
            }}
          >
            {message.text}
          </p>
        )}
      </section>

      <h3>Liste des utilisateurs</h3>
      {isLoading && <p>Chargement…</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
            <th style={cellStyle}>Nom</th>
            <th style={cellStyle}>Email</th>
            <th style={cellStyle}>Rôle</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={cellStyle}>{u.name}</td>
              <td style={cellStyle}>{u.email}</td>
              <td style={cellStyle}>
                <select
                  value={u.role}
                  onChange={(e) =>
                    setRole.mutate({
                      id: u.id,
                      role: e.target.value as 'ADMIN' | 'VIEWER',
                    })
                  }
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td style={cellStyle}>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer ${u.email} ?`)) {
                      remove.mutate({ id: u.id });
                    }
                  }}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
