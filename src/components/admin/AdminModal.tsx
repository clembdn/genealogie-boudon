'use client';

import { useState } from 'react';
import { PeopleTab } from './PeopleTab';
import { UnionsTab } from './UnionsTab';
import { RelationsTab } from './RelationsTab';
import { RelationshipTab } from './RelationshipTab';
import { UsersTab } from './UsersTab';

type TabKey = 'people' | 'unions' | 'relations' | 'relationship' | 'users';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'people', label: 'Personnes' },
  { key: 'unions', label: 'Unions' },
  { key: 'relations', label: 'Liens parents-enfants' },
  { key: 'relationship', label: 'Calcul de parenté' },
  { key: 'users', label: 'Utilisateurs' },
];

export function AdminModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>('people');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          width: '100%',
          maxWidth: 1100,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #eee',
            gap: '0.5rem',
          }}
        >
          <strong>Administration</strong>
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: '0.25rem',
              marginLeft: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '0.35rem 0.8rem',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: tab === t.key ? '#e0e7ff' : '#fafafa',
                  fontWeight: tab === t.key ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 22,
              cursor: 'pointer',
              padding: '0 0.5rem',
              color: '#666',
            }}
          >
            ×
          </button>
        </header>

        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1 }}>
          {tab === 'people' && <PeopleTab />}
          {tab === 'unions' && <UnionsTab />}
          {tab === 'relations' && <RelationsTab />}
          {tab === 'relationship' && <RelationshipTab />}
          {tab === 'users' && <UsersTab />}
        </div>
      </div>
    </div>
  );
}
