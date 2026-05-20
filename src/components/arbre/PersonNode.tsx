'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ParsedPerson } from '@/lib/types';
import { extractYear } from '@/lib/generations';

function initials(p: ParsedPerson): string {
  const a = p.nom?.trim()?.[0] ?? '';
  const b = p.prenoms?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

function lifespan(p: ParsedPerson): string {
  const b = extractYear(p.naissance?.date);
  const d = extractYear(p.deces?.date);
  if (!b && !d) return 'dates inconnues';
  const bs = b ? (p.naissance?.approx ? `~${b}` : `${b}`) : '?';
  const ds = d ? (p.deces?.approx ? `~${d}` : `${d}`) : '?';
  return `${bs} – ${ds}`;
}

export const PersonNode = memo(function PersonNode(props: NodeProps) {
  const p = props.data.person as ParsedPerson;

  return (
    <div className={`person-node${props.selected ? ' is-selected' : ''}`}>
      <div className="pn-avatar">{initials(p)}</div>
      <div className="pn-body">
        <div className="pn-nom">{p.nom || '—'}</div>
        <div className="pn-prenoms">{p.prenoms || ' '}</div>
        <div className="pn-life">{lifespan(p)}</div>
      </div>
    </div>
  );
});
