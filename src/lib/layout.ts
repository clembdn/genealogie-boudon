import type { Node } from '@xyflow/react';
import type { GenerationGroup } from './generations';

// Dimensions de la mise en page du tableau blanc (en pixels du canvas)
export const CARD_W = 214;
export const CARD_H = 104;
export const CARD_GAP = 26;
export const BAND_PAD = 24;
export const HEADER_H = 58;
export const GEN_GAP = 62;
export const MAX_PER_ROW = 7;
export const MIN_BAND_W = 360;

export interface LayoutResult {
  nodes: Node[];
  /** Position (coin haut-gauche) de chaque carte personne, par id. */
  personPos: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
}

/**
 * Dispose les generations en bandes empilees verticalement, centrees sur x=0.
 * La plus ancienne en haut. Une bande repliee n'affiche que son bandeau.
 */
export function computeLayout(
  groups: GenerationGroup[],
  collapsed: Record<string, boolean>,
): LayoutResult {
  const nodes: Node[] = [];
  const personPos = new Map<string, { x: number; y: number }>();
  let y = 0;
  let maxW = MIN_BAND_W;

  for (const g of groups) {
    const n = g.persons.length;
    const isCollapsed = collapsed[g.key] ?? false;
    const perRow = Math.min(Math.max(n, 1), MAX_PER_ROW);
    const rows = Math.max(1, Math.ceil(n / perRow));
    const bodyW = perRow * CARD_W + (perRow - 1) * CARD_GAP;
    const bandW = Math.max(bodyW + BAND_PAD * 2, MIN_BAND_W);
    const bandH = isCollapsed
      ? HEADER_H
      : HEADER_H + BAND_PAD + rows * CARD_H + (rows - 1) * CARD_GAP + BAND_PAD;
    const bandX = -bandW / 2;
    maxW = Math.max(maxW, bandW);

    nodes.push({
      id: g.key,
      type: 'generation',
      position: { x: bandX, y },
      data: {
        title: g.title,
        description: g.description,
        period: g.period,
        count: n,
        collapsed: isCollapsed,
      },
      width: bandW,
      height: bandH,
      style: { width: bandW, height: bandH },
      draggable: false,
      selectable: false,
      zIndex: 0,
    });

    if (!isCollapsed) {
      g.persons.forEach((p, j) => {
        const r = Math.floor(j / perRow);
        const c = j % perRow;
        const rowCount = r === rows - 1 ? n - r * perRow : perRow;
        const rowW = rowCount * CARD_W + (rowCount - 1) * CARD_GAP;
        const px = -rowW / 2 + c * (CARD_W + CARD_GAP);
        const py = y + HEADER_H + BAND_PAD + r * (CARD_H + CARD_GAP);
        personPos.set(p.id, { x: px, y: py });
        nodes.push({
          id: p.id,
          type: 'person',
          position: { x: px, y: py },
          data: { person: p },
          width: CARD_W,
          height: CARD_H,
          style: { width: CARD_W, height: CARD_H },
          draggable: false,
          zIndex: 1,
        });
      });
    }

    y += bandH + GEN_GAP;
  }

  return { nodes, personPos, width: maxW, height: Math.max(0, y - GEN_GAP) };
}
