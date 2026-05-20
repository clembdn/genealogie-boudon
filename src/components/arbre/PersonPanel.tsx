'use client';

import { useEffect } from 'react';
import type { ParsedPerson, ParsedEvent } from '@/lib/types';

function eventText(ev: ParsedEvent | null): string | null {
  if (!ev) return null;
  const parts: string[] = [];
  if (ev.date) parts.push(ev.approx ? `vers ${ev.date}` : ev.date);
  if (ev.lieu) parts.push(`à ${ev.lieu}`);
  return parts.length ? parts.join(' ') : null;
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--ink-soft)',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1rem', color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

export function PersonPanel({
  person,
  onClose,
}: {
  person: ParsedPerson;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(45, 42, 36, 0.3)',
          zIndex: 90,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          maxWidth: '92vw',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--line)',
          boxShadow: '-6px 0 24px var(--shadow)',
          padding: '20px 22px',
          overflowY: 'auto',
          zIndex: 100,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer la fiche"
          style={{
            float: 'right',
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            color: 'var(--ink)',
          }}
        >
          ✕
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>{person.nom}</h2>
        {person.prenoms && (
          <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>
            {person.prenoms}
          </div>
        )}
        {person.surnom && (
          <div
            style={{
              fontStyle: 'italic',
              color: 'var(--ink-soft)',
              marginBottom: 8,
            }}
          >
            dit «&nbsp;{person.surnom}&nbsp;»
          </div>
        )}

        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--line)',
            margin: '14px 0',
          }}
        />

        <Field label="Naissance" value={eventText(person.naissance)} />
        <Field label="Décès" value={eventText(person.deces)} />
        <Field label="Parrain" value={person.parrain} />
        <Field label="Marraine" value={person.marraine} />
        <Field label="Notes" value={person.notes} />

        {!person.naissance &&
          !person.deces &&
          !person.parrain &&
          !person.marraine &&
          !person.notes && (
            <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              Aucune information complémentaire enregistrée.
            </p>
          )}

        <details style={{ marginTop: 18 }}>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '0.82rem',
              color: 'var(--ink-soft)',
            }}
          >
            Texte d&apos;origine (Excel)
          </summary>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--ink-soft)',
              background: 'var(--bg)',
              borderRadius: 8,
              padding: '8px 10px',
              marginTop: 8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {person.raw}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
            Position Excel : ligne {person.row + 1}, colonne {person.col + 1}
            {person.shapeName ? ` — ${person.shapeName}` : ''}
          </p>
        </details>
      </aside>
    </>
  );
}
