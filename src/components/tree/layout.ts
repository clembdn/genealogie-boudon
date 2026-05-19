import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

export const PERSON_WIDTH = 200;
export const PERSON_HEIGHT = 90;
export const UNION_WIDTH = 36;
export const UNION_HEIGHT = 36;

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const isUnion = node.type === 'union';
    g.setNode(node.id, {
      width: isUnion ? UNION_WIDTH : PERSON_WIDTH,
      height: isUnion ? UNION_HEIGHT : PERSON_HEIGHT,
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const isUnion = node.type === 'union';
    const w = isUnion ? UNION_WIDTH : PERSON_WIDTH;
    const h = isUnion ? UNION_HEIGHT : PERSON_HEIGHT;
    const { x, y } = g.node(node.id);
    return {
      ...node,
      position: { x: x - w / 2, y: y - h / 2 },
    };
  });
}
