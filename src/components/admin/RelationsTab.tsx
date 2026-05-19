'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { PersonAutocomplete } from '@/components/PersonAutocomplete';
import { inputStyle, cellStyle } from './styles';

type LinkType = 'BIOLOGICAL' | 'ADOPTIVE' | 'STEP' | 'LEGAL' | 'UNKNOWN';

export function RelationsTab() {
  const utils = trpc.useUtils();
  const { data: relations } = trpc.parentChild.list.useQuery();
  const create = trpc.parentChild.create.useMutation({
    onSuccess: () => {
      utils.parentChild.list.invalidate();
      setParentId(null);
      setChildId(null);
    },
  });
  const remove = trpc.parentChild.delete.useMutation({
    onSuccess: () => utils.parentChild.list.invalidate(),
  });

  const [parentId, setParentId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [type, setType] = useState<LinkType>('BIOLOGICAL');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !childId) return;
    create.mutate({ parentId, childId, type });
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Liens parents-enfants</h2>

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
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: '0.5rem',
            alignItems: 'end',
          }}
        >
          <label>
            Parent
            <PersonAutocomplete
              value={parentId}
              onChange={setParentId}
              excludeIds={childId ? [childId] : []}
            />
          </label>
          <label>
            Enfant
            <PersonAutocomplete
              value={childId}
              onChange={setChildId}
              excludeIds={parentId ? [parentId] : []}
            />
          </label>
          <label>
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LinkType)}
              style={inputStyle}
            >
              <option value="BIOLOGICAL">Biologique</option>
              <option value="ADOPTIVE">Adoptif</option>
              <option value="STEP">Beau-parent</option>
              <option value="LEGAL">Légal</option>
              <option value="UNKNOWN">Inconnu</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={!parentId || !childId || create.isPending}
            style={{ padding: '0.5rem 1rem' }}
          >
            Ajouter
          </button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
            <th style={cellStyle}>Parent</th>
            <th style={cellStyle}>Enfant</th>
            <th style={cellStyle}>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {relations?.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={cellStyle}>
                {r.parent.firstName} {r.parent.lastName}
              </td>
              <td style={cellStyle}>
                {r.child.firstName} {r.child.lastName}
              </td>
              <td style={cellStyle}>{r.type}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => {
                    if (confirm('Supprimer ce lien ?')) {
                      remove.mutate({ id: r.id });
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
