'use client';

import { useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { PERSON_WIDTH, PERSON_HEIGHT } from './layout';
import { useTree } from './TreeContext';

type PersonData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  birthName: string | null;
  birthDate: string | null;
  deathDate: string | null;
  photoUrl: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
};

export type PersonNodeType = Node<PersonData, 'person'>;

const genderBg: Record<PersonData['gender'], string> = {
  MALE: '#e3ecff',
  FEMALE: '#ffe1ec',
  OTHER: '#fff4d4',
  UNKNOWN: '#f0f0f0',
};

export function PersonNode({ data, selected, id }: NodeProps<PersonNodeType>) {
  const { isAdmin, onAddSpouse, onAddChildOfPerson } = useTree();
  const [hover, setHover] = useState(false);

  const fullName =
    `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || '(sans nom)';
  const dates =
    data.birthDate || data.deathDate
      ? `${data.birthDate ?? '?'}${
          data.deathDate ? ` – ${data.deathDate}` : data.birthDate ? ' – ' : ''
        }`
      : '';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: PERSON_WIDTH,
        minHeight: PERSON_HEIGHT,
        background: genderBg[data.gender],
        border: `2px solid ${selected ? '#3b82f6' : '#9ca3af'}`,
        borderRadius: 10,
        padding: '0.5rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#666', width: 8, height: 8 }}
      />

      {data.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.photoUrl}
          alt=""
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#666',
            flexShrink: 0,
          }}
        >
          {(data.firstName?.[0] ?? '?').toUpperCase()}
        </div>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={fullName}
        >
          {fullName}
        </div>
        {data.birthName && (
          <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
            née {data.birthName}
          </div>
        )}
        {dates && <div style={{ fontSize: 11, color: '#666' }}>{dates}</div>}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#666', width: 8, height: 8 }}
      />

      {isAdmin && hover && (
        <div
          style={{
            position: 'absolute',
            top: -32,
            right: 0,
            display: 'flex',
            gap: 4,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: 2,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionButton
            label="+ conjoint"
            onClick={() => onAddSpouse(id)}
          />
          <ActionButton
            label="+ enfant"
            onClick={() => onAddChildOfPerson(id)}
          />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: '2px 6px',
        border: '1px solid #ddd',
        borderRadius: 3,
        background: '#fafafa',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
