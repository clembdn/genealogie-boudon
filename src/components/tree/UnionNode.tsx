'use client';

import { useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { UNION_WIDTH, UNION_HEIGHT } from './layout';
import { useTree } from './TreeContext';

type UnionData = {
  id: string;
  type: 'MARRIAGE' | 'CIVIL_UNION' | 'PARTNERSHIP' | 'UNKNOWN';
  endReason: 'DIVORCE' | 'DEATH' | 'SEPARATION' | 'ANNULMENT' | null;
  partner1Id: string;
  partner2Id: string;
  collapsed: boolean;
  childCount: number;
};

export type UnionNodeType = Node<UnionData, 'union'>;

const typeColors: Record<UnionData['type'], string> = {
  MARRIAGE: '#fce7f0',
  CIVIL_UNION: '#dbeafe',
  PARTNERSHIP: '#dcfce7',
  UNKNOWN: '#e5e7eb',
};

const typeLabels: Record<UnionData['type'], string> = {
  MARRIAGE: 'Mariage',
  CIVIL_UNION: 'PACS',
  PARTNERSHIP: 'Concubinage',
  UNKNOWN: 'Union',
};

export function UnionNode({ data }: NodeProps<UnionNodeType>) {
  const { isAdmin, onAddChildOfUnion, onToggleCollapse } = useTree();
  const [hover, setHover] = useState(false);

  const divorced = data.endReason === 'DIVORCE';
  const ended = data.endReason !== null;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`${typeLabels[data.type]}${
        ended ? ` — ${data.endReason?.toLowerCase()}` : ''
      }`}
      style={{
        width: UNION_WIDTH,
        height: UNION_HEIGHT,
        background: typeColors[data.type],
        border: `2px ${divorced ? 'dashed' : 'solid'} #6b7280`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: '#374151',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#666', width: 6, height: 6 }}
      />
      {divorced ? '✕' : ended ? '†' : '♥'}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#666', width: 6, height: 6 }}
      />

      {data.collapsed && data.childCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 11,
            color: '#444',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          ▶ {data.childCount} enfant{data.childCount > 1 ? 's' : ''} caché
          {data.childCount > 1 ? 's' : ''}
        </div>
      )}

      {(hover || data.collapsed) && data.childCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(data.id);
          }}
          title={data.collapsed ? 'Déplier' : 'Replier'}
          style={{
            position: 'absolute',
            top: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            padding: '2px 6px',
            border: '1px solid #ddd',
            borderRadius: 10,
            background: 'white',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {data.collapsed ? '▼ déplier' : '▲ replier'}
        </button>
      )}

      {isAdmin && hover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddChildOfUnion(data.id, [data.partner1Id, data.partner2Id]);
          }}
          style={{
            position: 'absolute',
            bottom: -24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            padding: '2px 6px',
            border: '1px solid #ddd',
            borderRadius: 10,
            background: '#fafafa',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          + enfant
        </button>
      )}
    </div>
  );
}
