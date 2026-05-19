import { prisma } from '@/lib/prisma';

// Distance vers chaque ancêtre (en générations).
async function getAncestors(personId: string): Promise<Map<string, number>> {
  const ancestors = new Map<string, number>();
  const queue: { id: string; distance: number }[] = [
    { id: personId, distance: 0 },
  ];

  while (queue.length > 0) {
    const { id, distance } = queue.shift()!;
    const existing = ancestors.get(id);
    if (existing !== undefined && existing <= distance) continue;
    ancestors.set(id, distance);

    const parentLinks = await prisma.parentChild.findMany({
      where: { childId: id },
      select: { parentId: true },
    });

    for (const link of parentLinks) {
      queue.push({ id: link.parentId, distance: distance + 1 });
    }
  }

  return ancestors;
}

function formatAncestor(distance: number): string {
  if (distance === 1) return 'Parent';
  if (distance === 2) return 'Grand-parent';
  if (distance === 3) return 'Arrière-grand-parent';
  return `${'arrière-'.repeat(distance - 2)}grand-parent`;
}

function formatDescendant(distance: number): string {
  if (distance === 1) return 'Enfant';
  if (distance === 2) return 'Petit-enfant';
  if (distance === 3) return 'Arrière-petit-enfant';
  return `${'arrière-'.repeat(distance - 2)}petit-enfant`;
}

export async function computeRelationship(
  personAId: string,
  personBId: string
): Promise<string> {
  if (personAId === personBId) return 'Même personne';

  const ancestorsA = await getAncestors(personAId);
  const ancestorsB = await getAncestors(personBId);

  // Cas direct : B est un ancêtre de A (ou inverse).
  if (ancestorsA.has(personBId)) {
    return formatAncestor(ancestorsA.get(personBId)!);
  }
  if (ancestorsB.has(personAId)) {
    return formatDescendant(ancestorsB.get(personAId)!);
  }

  // Plus proche ancêtre commun.
  let bestA = Infinity;
  let bestB = Infinity;
  let commonFound = false;

  for (const [id, dA] of ancestorsA) {
    const dB = ancestorsB.get(id);
    if (dB === undefined) continue;
    if (dA + dB < bestA + bestB) {
      bestA = dA;
      bestB = dB;
      commonFound = true;
    }
  }

  if (!commonFound) return 'Aucun lien direct trouvé';

  // Frères/sœurs : même parent, distance 1 de chaque côté.
  if (bestA === 1 && bestB === 1) return 'Frère/Sœur';

  // Oncle/tante <-> neveu/nièce : un côté à distance 1, l'autre ≥ 2.
  if (Math.min(bestA, bestB) === 1) {
    const greats = Math.max(bestA, bestB) - 2;
    const prefix = 'arrière-'.repeat(greats);
    if (bestA > bestB) {
      // B plus proche de l'ancêtre commun → B est l'oncle/tante de A.
      return greats === 0 ? 'Oncle/Tante' : `${prefix}grand-oncle/tante`;
    }
    return greats === 0 ? 'Neveu/Nièce' : `${prefix}petit-neveu/petite-nièce`;
  }

  // Cousinage.
  const degree = Math.min(bestA, bestB) - 1;
  const removed = Math.abs(bestA - bestB);

  const base =
    degree === 1
      ? 'Cousin/Cousine germain(e)'
      : `Cousin/Cousine au ${degree}e degré`;

  return removed === 0 ? base : `${base}, ${removed} génération(s) d'écart`;
}
