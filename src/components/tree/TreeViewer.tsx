'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { trpc } from '@/trpc/client';
import { authClient } from '@/lib/auth-client';
import { PersonNode } from './PersonNode';
import { UnionNode } from './UnionNode';
import { PersonPanel } from './PersonPanel';
import { QuickAddDialog, type AddContext } from './QuickAddDialog';
import { TreeContext, type TreeContextValue } from './TreeContext';
import { applyDagreLayout } from './layout';
import { AdminModal } from '@/components/admin/AdminModal';

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
};

export function TreeViewer() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.tree.getAll.useQuery();

  const toggleCollapsed = trpc.box.toggleCollapsed.useMutation({
    onSuccess: () => utils.tree.getAll.invalidate(),
  });

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [addContext, setAddContext] = useState<AddContext | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };

    // Index ParentChild par enfant.
    const parentsByChild = new Map<string, string[]>();
    for (const pc of data.parentChildLinks) {
      const list = parentsByChild.get(pc.childId) ?? [];
      list.push(pc.parentId);
      parentsByChild.set(pc.childId, list);
    }

    // Pour chaque Union, trouve les enfants communs aux deux partenaires.
    const childrenByUnion = new Map<string, string[]>();
    for (const u of data.unions) {
      const kids: string[] = [];
      for (const [childId, parentIds] of parentsByChild) {
        if (
          parentIds.includes(u.partner1Id) &&
          parentIds.includes(u.partner2Id)
        ) {
          kids.push(childId);
        }
      }
      childrenByUnion.set(u.id, kids);
    }

    // Détermine les personnes cachées par un collapse (BFS descendant).
    const hidden = new Set<string>();
    const queue: string[] = [];
    for (const u of data.unions) {
      if (u.box?.collapsed) {
        for (const childId of childrenByUnion.get(u.id) ?? []) {
          if (!hidden.has(childId)) {
            hidden.add(childId);
            queue.push(childId);
          }
        }
      }
    }
    while (queue.length > 0) {
      const personId = queue.shift()!;
      for (const pc of data.parentChildLinks) {
        if (pc.parentId === personId && !hidden.has(pc.childId)) {
          hidden.add(pc.childId);
          queue.push(pc.childId);
        }
      }
    }

    // Person nodes (filtré).
    const personNodes: Node[] = data.persons
      .filter((p) => !hidden.has(p.id))
      .map((p) => ({
        id: p.id,
        type: 'person',
        data: p,
        position: { x: p.positionX ?? 0, y: p.positionY ?? 0 },
      }));

    // Union nodes.
    const unionNodes: Node[] = data.unions.map((u) => ({
      id: `union-${u.id}`,
      type: 'union',
      data: {
        ...u,
        collapsed: u.box?.collapsed ?? false,
        childCount: childrenByUnion.get(u.id)?.length ?? 0,
      },
      position: {
        x: u.box?.positionX ?? 0,
        y: u.box?.positionY ?? 0,
      },
    }));

    // Edges Person ↔ Union.
    const unionEdges: Edge[] = data.unions.flatMap((u) => {
      const dashed = u.endReason === 'DIVORCE';
      const style = dashed
        ? { stroke: '#9ca3af', strokeDasharray: '6 4' }
        : { stroke: '#6b7280' };
      return [
        {
          id: `u-${u.id}-p1`,
          source: u.partner1Id,
          target: `union-${u.id}`,
          type: 'smoothstep',
          style,
        },
        {
          id: `u-${u.id}-p2`,
          source: u.partner2Id,
          target: `union-${u.id}`,
          type: 'smoothstep',
          style,
        },
      ];
    });

    // Edges Union → enfant (ou Person → enfant pour mono-parent).
    const childEdges: Edge[] = [];
    for (const [childId, parentIds] of parentsByChild) {
      if (hidden.has(childId)) continue;

      const matchingUnion = data.unions.find(
        (u) =>
          parentIds.includes(u.partner1Id) &&
          parentIds.includes(u.partner2Id) &&
          !u.box?.collapsed // si collapse, pas d'edge sortante
      );

      if (matchingUnion) {
        childEdges.push({
          id: `c-${matchingUnion.id}-${childId}`,
          source: `union-${matchingUnion.id}`,
          target: childId,
          type: 'smoothstep',
          style: { stroke: '#6b7280' },
        });
      } else {
        for (const parentId of parentIds) {
          // Skip si l'union qui contient ce parent est collapsed.
          const inCollapsed = data.unions.some(
            (u) =>
              u.box?.collapsed &&
              (u.partner1Id === parentId || u.partner2Id === parentId) &&
              childrenByUnion.get(u.id)?.includes(childId)
          );
          if (inCollapsed) continue;

          childEdges.push({
            id: `c-${parentId}-${childId}`,
            source: parentId,
            target: childId,
            type: 'smoothstep',
            style: { stroke: '#6b7280' },
          });
        }
      }
    }

    const allNodes = [...personNodes, ...unionNodes];
    const allEdges = [...unionEdges, ...childEdges];

    // Layout automatique uniquement pour les nodes sans position sauvée.
    const needsLayout = allNodes.some((n) => {
      return n.position.x === 0 && n.position.y === 0;
    });

    if (!needsLayout) {
      return { nodes: allNodes, edges: allEdges };
    }

    const laidOut = applyDagreLayout(allNodes, allEdges);
    // Ré-applique les positions sauvées par-dessus dagre (pour les nodes qui en ont).
    const final = laidOut.map((node) => {
      if (node.type === 'person') {
        const p = node.data as { positionX: number | null; positionY: number | null };
        if (p.positionX != null && p.positionY != null) {
          return { ...node, position: { x: p.positionX, y: p.positionY } };
        }
      } else if (node.type === 'union') {
        const u = node.data as {
          [k: string]: unknown;
        };
        const box = (data.unions.find((x) => `union-${x.id}` === node.id) as {
          box?: { positionX: number | null; positionY: number | null } | null;
        } | undefined)?.box;
        if (box?.positionX != null && box?.positionY != null) {
          return { ...node, position: { x: box.positionX, y: box.positionY } };
        }
      }
      return node;
    });
    return { nodes: final, edges: allEdges };
  }, [data]);

  const findPersonLabel = useCallback(
    (id: string) => {
      const p = data?.persons.find((x) => x.id === id);
      return p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '';
    },
    [data]
  );

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      if (node.type === 'person') {
        setSelectedPersonId(node.id);
      }
    },
    []
  );

  const treeContextValue: TreeContextValue = useMemo(
    () => ({
      isAdmin,
      onSelectPerson: setSelectedPersonId,
      onAddSpouse: (personId) =>
        setAddContext({
          mode: 'spouseOf',
          personId,
          personLabel: findPersonLabel(personId),
        }),
      onAddChildOfPerson: (personId) =>
        setAddContext({
          mode: 'childOfPerson',
          personId,
          personLabel: findPersonLabel(personId),
        }),
      onAddChildOfUnion: (unionId, parentIds) =>
        setAddContext({
          mode: 'childOfUnion',
          unionId,
          parentIds,
          unionLabel: `${findPersonLabel(parentIds[0])} / ${findPersonLabel(parentIds[1])}`,
        }),
      onToggleCollapse: (unionId) => toggleCollapsed.mutate({ unionId }),
    }),
    [isAdmin, findPersonLabel, toggleCollapsed]
  );

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Chargement de l&apos;arbre…</p>
      </div>
    );
  }

  if (!data || data.persons.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Aucune personne enregistrée</h2>
        {isAdmin ? (
          <>
            <p>Commence par ajouter des personnes via l&apos;administration.</p>
            <button
              onClick={() => setAdminOpen(true)}
              style={{ padding: '0.5rem 1rem' }}
            >
              Ouvrir l&apos;administration
            </button>
            {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} />}
          </>
        ) : (
          <p>Aucune donnée à afficher pour le moment.</p>
        )}
      </div>
    );
  }

  return (
    <TreeContext.Provider value={treeContextValue}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          background: '#fafafa',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          onNodeClick={handleNodeClick}
        >
          <Background gap={20} />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) =>
              node.type === 'union' ? '#e9d5ff' : '#bfdbfe'
            }
          />
        </ReactFlow>

        <Toolbar
          isAdmin={isAdmin}
          onOpenAdmin={() => setAdminOpen(true)}
        />

        {selectedPersonId && (
          <PersonPanel
            personId={selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
          />
        )}

        {addContext && (
          <QuickAddDialog
            context={addContext}
            onClose={() => setAddContext(null)}
          />
        )}

        {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} />}
      </div>
    </TreeContext.Provider>
  );
}

function Toolbar({
  isAdmin,
  onOpenAdmin,
}: {
  isAdmin: boolean;
  onOpenAdmin: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        zIndex: 5,
        flexWrap: 'wrap',
      }}
    >
      <Link href="/" style={{ textDecoration: 'none' }}>
        ← Accueil
      </Link>
      <span style={{ color: '#ccc' }}>|</span>
      <Legend color="#fce7f0" label="Mariage" />
      <Legend color="#dbeafe" label="PACS" />
      <Legend color="#dcfce7" label="Concubinage" />
      <span style={{ fontSize: 12, color: '#666' }}>
        — pointillés = divorce
      </span>
      {isAdmin && (
        <>
          <span style={{ color: '#ccc' }}>|</span>
          <button
            onClick={onOpenAdmin}
            style={{
              padding: '0.3rem 0.8rem',
              border: '1px solid #ddd',
              borderRadius: 4,
              background: '#fafafa',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Admin
          </button>
        </>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          background: color,
          border: '1px solid #888',
          borderRadius: '50%',
        }}
      />
      <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
    </span>
  );
}
