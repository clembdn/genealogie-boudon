'use client';

import { trpc } from '@/trpc/client';

export function PersonPanel({
  personId,
  onClose,
}: {
  personId: string;
  onClose: () => void;
}) {
  const { data: person, isLoading } = trpc.person.byId.useQuery({
    id: personId,
  });

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 340,
        background: 'white',
        borderLeft: '1px solid #ddd',
        padding: '1.5rem',
        overflowY: 'auto',
        zIndex: 10,
        boxShadow: '-4px 0 12px rgba(0,0,0,0.05)',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Fermer"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 22,
          lineHeight: 1,
          color: '#666',
        }}
      >
        ×
      </button>

      {isLoading || !person ? (
        <p>Chargement…</p>
      ) : (
        <>
          <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>
            {person.firstName} {person.lastName}
          </h2>
          {person.birthName && (
            <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>
              née {person.birthName}
            </p>
          )}

          <dl style={{ marginTop: '1rem' }}>
            <Detail
              label="Naissance"
              value={[person.birthDate, person.birthPlace]
                .filter(Boolean)
                .join(' à ')}
            />
            <Detail
              label="Décès"
              value={[person.deathDate, person.deathPlace]
                .filter(Boolean)
                .join(' à ')}
            />
            <Detail label="Profession" value={person.occupation} />
          </dl>

          {person.notes && (
            <>
              <h3 style={{ marginTop: '1.5rem' }}>Notes</h3>
              <p style={{ whiteSpace: 'pre-wrap', color: '#444' }}>
                {person.notes}
              </p>
            </>
          )}

          <h3 style={{ marginTop: '1.5rem' }}>Unions</h3>
          {person.unionsAsPartner1.length === 0 &&
          person.unionsAsPartner2.length === 0 ? (
            <p style={{ color: '#888' }}>Aucune union enregistrée.</p>
          ) : (
            <ul style={{ paddingLeft: '1.2rem' }}>
              {person.unionsAsPartner1.map((u) => (
                <li key={u.id}>
                  {u.partner2.firstName} {u.partner2.lastName}
                  {u.endReason === 'DIVORCE' && ' (divorcés)'}
                </li>
              ))}
              {person.unionsAsPartner2.map((u) => (
                <li key={u.id}>
                  {u.partner1.firstName} {u.partner1.lastName}
                  {u.endReason === 'DIVORCE' && ' (divorcés)'}
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: '1.5rem' }}>Parents</h3>
          {person.asChild.length === 0 ? (
            <p style={{ color: '#888' }}>Aucun parent enregistré.</p>
          ) : (
            <ul style={{ paddingLeft: '1.2rem' }}>
              {person.asChild.map((link) => (
                <li key={link.id}>
                  {link.parent.firstName} {link.parent.lastName}
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: '1.5rem' }}>Enfants</h3>
          {person.asParent.length === 0 ? (
            <p style={{ color: '#888' }}>Aucun enfant enregistré.</p>
          ) : (
            <ul style={{ paddingLeft: '1.2rem' }}>
              {person.asParent.map((link) => (
                <li key={link.id}>
                  {link.child.firstName} {link.child.lastName}
                </li>
              ))}
            </ul>
          )}

        </>
      )}
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <dt style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>
        {label}
      </dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}
