'use client';

import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ArbreData, ParsedPerson } from '@/lib/types';
import { buildGenerationGroups } from '@/lib/generations';
import { computeLayout, CARD_W, CARD_H } from '@/lib/layout';
import { PersonNode } from './PersonNode';
import { GenerationNode } from './GenerationNode';
import { PersonPanel } from './PersonPanel';

const nodeTypes = { person: PersonNode, generation: GenerationNode };

function Canvas({ data }: { data: ArbreData }) {
  const groups = useMemo(() => buildGenerationGroups(data), [data]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<ParsedPerson | null>(null);
  const [query, setQuery] = useState('');
  const { setCenter } = useReactFlow();
  const didInit = useRef(false);

  const layout = useMemo(
    () => computeLayout(groups, collapsed),
    [groups, collapsed],
  );

  // Marque la carte selectionnee (surbrillance)
  const nodes = useMemo<Node[]>(() => {
    if (!selected) return layout.nodes;
    return layout.nodes.map((n) =>
      n.type === 'person' && n.id === selected.id
        ? { ...n, selected: true }
        : n,
    );
  }, [layout.nodes, selected]);

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    if (node.type === 'generation') {
      setCollapsed((c) => ({ ...c, [node.id]: !c[node.id] }));
    } else if (node.type === 'person') {
      setSelected((node.data as { person: ParsedPerson }).person);
    }
  }, []);

  const allCollapsed =
    groups.length > 0 && groups.every((g) => collapsed[g.key]);

  const toggleAll = useCallback(() => {
    const next = !(groups.length > 0 && groups.every((g) => collapsed[g.key]));
    setCollapsed(Object.fromEntries(groups.map((g) => [g.key, next] as const)));
  }, [groups, collapsed]);

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      if (didInit.current) return;
      didInit.current = true;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const zoom = Math.min(0.95, Math.max(0.4, (vw - 130) / layout.width));
      instance.setViewport({ x: vw / 2, y: 104, zoom });
    },
    [layout.width],
  );

  const onSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = query.trim().toLowerCase();
      if (!q) return;
      let foundKey: string | null = null;
      let found: ParsedPerson | null = null;
      for (const g of groups) {
        const hit = g.persons.find((p) =>
          `${p.nom} ${p.prenoms}`.toLowerCase().includes(q),
        );
        if (hit) {
          found = hit;
          foundKey = g.key;
          break;
        }
      }
      if (!found || !foundKey) return;
      // Deplie la generation de la personne trouvee puis y centre la vue
      const nextCollapsed = { ...collapsed, [foundKey]: false };
      setCollapsed(nextCollapsed);
      const pos = computeLayout(groups, nextCollapsed).personPos.get(found.id);
      if (pos) {
        setCenter(pos.x + CARD_W / 2, pos.y + CARD_H / 2, {
          zoom: 1,
          duration: 800,
        });
      }
      setSelected(found);
    },
    [query, groups, collapsed, setCenter],
  );

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onInit={onInit}
        onNodesChange={() => {}}
        defaultViewport={{ x: 600, y: 104, zoom: 0.6 }}
        minZoom={0.2}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.6}
          color="#d6cfbd"
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.type === 'generation' ? '#6b4f2a' : '#cbb78f')}
          maskColor="rgba(45,42,36,0.08)"
        />
      </ReactFlow>

      <div className="toolbar">
        <Link href="/" className="tb-title">
          ↩ Famille Boudon
        </Link>
        <span className="tb-sep" />
        <form onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            className="tb-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom…"
            aria-label="Rechercher une personne"
          />
          <button type="submit" className="tb-btn primary">
            Chercher
          </button>
        </form>
        <span className="tb-sep" />
        <button className="tb-btn" onClick={toggleAll}>
          {allCollapsed ? 'Tout déplier' : 'Tout replier'}
        </button>
        <span className="tb-count">{data.persons.length} personnes</span>
      </div>

      {selected && (
        <PersonPanel person={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export function ArbreCanvas({ data }: { data: ArbreData }) {
  return (
    <ReactFlowProvider>
      <Canvas data={data} />
    </ReactFlowProvider>
  );
}
