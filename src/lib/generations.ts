import type { ArbreData, ParsedPerson } from './types';

export interface GenerationGroup {
  key: string;
  number: number | null;
  title: string;
  description: string | null;
  period: string | null;
  persons: ParsedPerson[];
}

const YEAR_RE = /\b(1[2-9]\d{2}|20\d{2})\b/;

/** Extrait la premiere annee plausible (1200-2099) d'une chaine. */
export function extractYear(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(YEAR_RE);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Regroupe les personnes par generation, de la plus ancienne a la plus recente.
 * Une personne appartient a la derniere generation dont l'etiquette est a une
 * ligne <= la sienne (les plus anciens, places tout en haut, vont a la 1re).
 */
export function buildGenerationGroups(data: ArbreData): GenerationGroup[] {
  const gens = [...data.generations].sort((a, b) => a.row - b.row);

  const meta = gens.map((g) => {
    const segs = g.label
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    let number: number | null = null;
    const desc: string[] = [];
    for (const s of segs) {
      const m = s.match(/(\d+)\s*e?\s*g[ée]n[ée]ration/i);
      if (m) number = parseInt(m[1], 10);
      else desc.push(s);
    }
    return { row: g.row, number, description: desc.join(' ') || null };
  });

  const buckets: ParsedPerson[][] = meta.map(() => []);
  for (const p of data.persons) {
    let idx = 0;
    for (let i = 0; i < meta.length; i++) {
      if (meta[i].row <= p.row) idx = i;
    }
    buckets[idx].push(p);
  }
  // Ordre de lecture interne : colonne Excel puis ligne (couples/fratries adjacents)
  for (const b of buckets) {
    b.sort((a, c) => a.col - c.col || a.row - c.row);
  }

  return meta.map((m, i) => {
    const persons = buckets[i];
    const years = persons
      .map((p) => extractYear(p.naissance?.date))
      .filter((y): y is number => y != null);
    let period: string | null = null;
    if (years.length) {
      const min = Math.min(...years);
      const max = Math.max(...years);
      period = max - min > 20 ? `${min} – ${max}` : `vers ${min}`;
    }
    return {
      key: `gen-${i}`,
      number: m.number,
      title: m.number ? `${m.number}ᵉ génération` : 'Génération',
      description: m.description,
      period,
      persons,
    };
  });
}
