'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { inputStyle, cellStyle } from './styles';

export function PeopleTab() {
  const utils = trpc.useUtils();
  const { data: people, isLoading } = trpc.person.list.useQuery();

  const create = trpc.person.create.useMutation({
    onSuccess: () => {
      utils.person.list.invalidate();
      reset();
    },
  });
  const remove = trpc.person.delete.useMutation({
    onSuccess: () => utils.person.list.invalidate(),
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'>(
    'UNKNOWN'
  );

  function reset() {
    setFirstName('');
    setLastName('');
    setBirthDate('');
    setDeathDate('');
    setGender('UNKNOWN');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      birthDate: birthDate || undefined,
      deathDate: deathDate || undefined,
      gender,
    });
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Personnes</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr) auto',
          gap: '0.5rem',
          alignItems: 'end',
          marginBottom: '2rem',
        }}
      >
        <Field label="Prénom">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Nom">
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Sexe">
          <select
            value={gender}
            onChange={(e) =>
              setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN')
            }
            style={inputStyle}
          >
            <option value="UNKNOWN">?</option>
            <option value="MALE">Homme</option>
            <option value="FEMALE">Femme</option>
            <option value="OTHER">Autre</option>
          </select>
        </Field>
        <Field label="Naissance">
          <input
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="1850 ou 1850-03-15"
            style={inputStyle}
          />
        </Field>
        <Field label="Décès">
          <input
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            placeholder="1920"
            style={inputStyle}
          />
        </Field>
        <button
          type="submit"
          disabled={create.isPending}
          style={{ padding: '0.5rem 1rem' }}
        >
          {create.isPending ? '…' : 'Ajouter'}
        </button>
      </form>

      {isLoading && <p>Chargement…</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
            <th style={cellStyle}>Prénom</th>
            <th style={cellStyle}>Nom</th>
            <th style={cellStyle}>Naissance</th>
            <th style={cellStyle}>Décès</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {people?.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={cellStyle}>{p.firstName}</td>
              <td style={cellStyle}>{p.lastName}</td>
              <td style={cellStyle}>{p.birthDate}</td>
              <td style={cellStyle}>{p.deathDate}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Supprimer ${p.firstName ?? ''} ${p.lastName ?? ''} ?`
                      )
                    ) {
                      remove.mutate({ id: p.id });
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ fontSize: '0.85rem', color: '#555' }}>
      {label}
      {children}
    </label>
  );
}
