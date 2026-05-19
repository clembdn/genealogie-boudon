'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  excludeIds?: string[];
};

export function PersonAutocomplete({
  value,
  onChange,
  placeholder = 'Rechercher une personne…',
  excludeIds = [],
}: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const { data: results } = trpc.person.search.useQuery(
    { q },
    { enabled: q.length > 0 && !value }
  );

  const { data: current } = trpc.person.byId.useQuery(
    { id: value ?? '' },
    { enabled: !!value }
  );

  if (value) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#fafafa',
        }}
      >
        <span style={{ flex: 1 }}>
          {current
            ? `${current.firstName ?? ''} ${current.lastName ?? ''}`.trim() ||
              '(sans nom)'
            : '…'}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: 1,
          }}
          aria-label="Effacer la sélection"
        >
          ×
        </button>
      </div>
    );
  }

  const filtered = (results ?? []).filter((p) => !excludeIds.includes(p.id));

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.4rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      />
      {open && q.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            margin: '0.25rem 0 0 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {filtered.length === 0 ? (
            <li style={{ padding: '0.5rem', color: '#888' }}>
              Aucun résultat
            </li>
          ) : (
            filtered.map((p) => (
              <li
                key={p.id}
                onMouseDown={() => {
                  onChange(p.id);
                  setQ('');
                  setOpen(false);
                }}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#f5f5f5')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'white')
                }
              >
                <div>
                  {p.firstName} {p.lastName}
                </div>
                {(p.birthDate || p.deathDate) && (
                  <small style={{ color: '#888' }}>
                    {p.birthDate ?? '?'} – {p.deathDate ?? ''}
                  </small>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
