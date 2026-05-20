'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

interface GenData {
  title: string;
  description: string | null;
  period: string | null;
  count: number;
  collapsed: boolean;
}

export const GenerationNode = memo(function GenerationNode(props: NodeProps) {
  const d = props.data as unknown as GenData;

  return (
    <div className="gen-node">
      <div className="gen-bar">
        <span className="gen-chevron">{d.collapsed ? '▶' : '▼'}</span>
        <span className="gen-name">{d.title}</span>
        {d.description && <span className="gen-sub">{d.description}</span>}
        <span className="gen-flex" />
        {d.period && <span className="gen-period">{d.period}</span>}
        <span className="gen-badge">
          {d.count} personne{d.count > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});
