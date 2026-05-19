'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';

export type AddContext =
  | { mode: 'spouseOf'; personId: string; personLabel: string }
  | { mode: 'childOfPerson'; personId: string; personLabel: string }
  | {
      mode: 'childOfUnion';
      unionId: string;
      parentIds: [string, string];
      unionLabel: string;
    };

export function QuickAddDialog({
  context,
  onClose,
}: {
  context: AddContext;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const create = trpc.person.createLinked.useMutation({
    onSuccess: () => {
      utils.tree.getAll.invalidate();
      utils.person.list.invalidate();
      onClose();
    },
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'>(
    'UNKNOWN'
  );
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [unionType, setUnionType] = useState<
    'MARRIAGE' | 'CIVIL_UNION' | 'PARTNERSHIP' | 'UNKNOWN'
  >('MARRIAGE');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const person = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      birthDate: birthDate || undefined,
      deathDate: deathDate || undefined,
      gender,
    };

    if (context.mode === 'spouseOf') {
      create.mutate({
        person,
        relation: {
          type: 'SPOUSE_OF',
          personId: context.personId,
          unionType,
        },
      });
    } else if (context.mode === 'childOfPerson') {
      create.mutate({
        person,
        relation: { type: 'CHILD_OF', parentIds: [context.personId] },
      });
    } else {
      create.mutate({
        person,
        relation: { type: 'CHILD_OF', parentIds: context.parentIds },
      });
    }
  }

  const title =
    context.mode === 'spouseOf'
      ? `Ajouter un conjoint à ${context.personLabel}`
      : context.mode === 'childOfPerson'
        ? `Ajouter un enfant à ${context.personLabel}`
        : `Ajouter un enfant au couple ${context.unionLabel}`;

  return (
    <div
      role="dialog"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          padding: '1.5rem',
          width: 'min(500px, 90vw)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gap: '0.75rem' }}
        >
          <Field label="Prénom">
            <input
              autoFocus
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.5rem',
            }}
          >
            <Field label="Sexe">
              <select
                value={gender}
                onChange={(e) =>
                  setGender(
                    e.target.value as
                      | 'MALE'
                      | 'FEMALE'
                      | 'OTHER'
                      | 'UNKNOWN'
                  )
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
                placeholder="1900"
                style={inputStyle}
              />
            </Field>
            <Field label="Décès">
              <input
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                placeholder=""
                style={inputStyle}
              />
            </Field>
          </div>

          {context.mode === 'spouseOf' && (
            <Field label="Type d'union">
              <select
                value={unionType}
                onChange={(e) =>
                  setUnionType(
                    e.target.value as
                      | 'MARRIAGE'
                      | 'CIVIL_UNION'
                      | 'PARTNERSHIP'
                      | 'UNKNOWN'
                  )
                }
                style={inputStyle}
              >
                <option value="MARRIAGE">Mariage</option>
                <option value="CIVIL_UNION">PACS</option>
                <option value="PARTNERSHIP">Concubinage</option>
                <option value="UNKNOWN">Inconnu</option>
              </select>
            </Field>
          )}

          {create.error && (
            <p style={{ color: '#c00', margin: 0 }}>{create.error.message}</p>
          )}

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {create.isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.4rem',
  border: '1px solid #ddd',
  borderRadius: 4,
};

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
