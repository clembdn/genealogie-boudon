'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { PersonAutocomplete } from '@/components/PersonAutocomplete';

export function RelationshipTab() {
  const [personAId, setPersonAId] = useState<string | null>(null);
  const [personBId, setPersonBId] = useState<string | null>(null);

  const { data: relation, isFetching } = trpc.person.relationship.useQuery(
    { personAId: personAId!, personBId: personBId! },
    { enabled: !!personAId && !!personBId }
  );

  const { data: a } = trpc.person.byId.useQuery(
    { id: personAId ?? '' },
    { enabled: !!personAId }
  );
  const { data: b } = trpc.person.byId.useQuery(
    { id: personBId ?? '' },
    { enabled: !!personBId }
  );

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Calcul de parenté</h2>
      <p style={{ color: '#666' }}>
        Sélectionne deux personnes pour calculer leur lien de parenté à partir
        des filiations enregistrées.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginTop: '2rem',
          marginBottom: '2rem',
        }}
      >
        <label>
          Personne A
          <PersonAutocomplete
            value={personAId}
            onChange={setPersonAId}
            excludeIds={personBId ? [personBId] : []}
          />
        </label>
        <label>
          Personne B
          <PersonAutocomplete
            value={personBId}
            onChange={setPersonBId}
            excludeIds={personAId ? [personAId] : []}
          />
        </label>
      </div>

      {personAId && personBId && (
        <div
          style={{
            padding: '1.5rem',
            background: '#f4f8ff',
            border: '1px solid #cdd9eb',
            borderRadius: 8,
          }}
        >
          {isFetching ? (
            <span>Calcul…</span>
          ) : (
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Par rapport à{' '}
                <strong>
                  {a?.firstName} {a?.lastName}
                </strong>
                ,
              </div>
              <div style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>
                <strong>
                  {b?.firstName} {b?.lastName}
                </strong>{' '}
                est : <em>{relation}</em>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
