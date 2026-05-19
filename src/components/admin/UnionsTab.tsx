'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { PersonAutocomplete } from '@/components/PersonAutocomplete';
import { inputStyle, cellStyle } from './styles';

type UnionType = 'MARRIAGE' | 'CIVIL_UNION' | 'PARTNERSHIP' | 'UNKNOWN';
type UnionEnd = '' | 'DIVORCE' | 'DEATH' | 'SEPARATION' | 'ANNULMENT';

export function UnionsTab() {
  const utils = trpc.useUtils();
  const { data: unions } = trpc.union.list.useQuery();
  const create = trpc.union.create.useMutation({
    onSuccess: () => {
      utils.union.list.invalidate();
      reset();
    },
  });
  const remove = trpc.union.delete.useMutation({
    onSuccess: () => utils.union.list.invalidate(),
  });

  const [partner1Id, setPartner1Id] = useState<string | null>(null);
  const [partner2Id, setPartner2Id] = useState<string | null>(null);
  const [type, setType] = useState<UnionType>('MARRIAGE');
  const [endReason, setEndReason] = useState<UnionEnd>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function reset() {
    setPartner1Id(null);
    setPartner2Id(null);
    setType('MARRIAGE');
    setEndReason('');
    setStartDate('');
    setEndDate('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partner1Id || !partner2Id) return;
    create.mutate({
      partner1Id,
      partner2Id,
      type,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      endReason: endReason || undefined,
    });
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Unions</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #eee',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <label>
            Conjoint 1
            <PersonAutocomplete
              value={partner1Id}
              onChange={setPartner1Id}
              excludeIds={partner2Id ? [partner2Id] : []}
            />
          </label>
          <label>
            Conjoint 2
            <PersonAutocomplete
              value={partner2Id}
              onChange={setPartner2Id}
              excludeIds={partner1Id ? [partner1Id] : []}
            />
          </label>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr) auto',
            gap: '0.5rem',
            alignItems: 'end',
          }}
        >
          <label>
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as UnionType)}
              style={inputStyle}
            >
              <option value="MARRIAGE">Mariage</option>
              <option value="CIVIL_UNION">PACS</option>
              <option value="PARTNERSHIP">Concubinage</option>
              <option value="UNKNOWN">Inconnu</option>
            </select>
          </label>
          <label>
            Début
            <input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="1875"
              style={inputStyle}
            />
          </label>
          <label>
            Fin
            <input
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="1920"
              style={inputStyle}
            />
          </label>
          <label>
            Cause de fin
            <select
              value={endReason}
              onChange={(e) => setEndReason(e.target.value as UnionEnd)}
              style={inputStyle}
            >
              <option value="">— En cours —</option>
              <option value="DIVORCE">Divorce</option>
              <option value="DEATH">Décès</option>
              <option value="SEPARATION">Séparation</option>
              <option value="ANNULMENT">Annulation</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={!partner1Id || !partner2Id || create.isPending}
            style={{ padding: '0.5rem 1rem' }}
          >
            Ajouter
          </button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
            <th style={cellStyle}>Conjoints</th>
            <th style={cellStyle}>Type</th>
            <th style={cellStyle}>Période</th>
            <th style={cellStyle}>État</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {unions?.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={cellStyle}>
                {u.partner1.firstName} {u.partner1.lastName} ↔{' '}
                {u.partner2.firstName} {u.partner2.lastName}
              </td>
              <td style={cellStyle}>{u.type}</td>
              <td style={cellStyle}>
                {u.startDate ?? '?'} – {u.endDate ?? ''}
              </td>
              <td style={cellStyle}>{u.endReason ?? 'En cours'}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => {
                    if (confirm('Supprimer cette union ?')) {
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
