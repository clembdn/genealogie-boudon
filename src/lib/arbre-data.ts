import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ArbreData } from './types';

/**
 * Charge les donnees extraites de l'Excel (pilote, sans base de donnees).
 * A executer cote serveur uniquement.
 */
export async function loadArbreData(): Promise<ArbreData> {
  const path = join(process.cwd(), 'data', 'arbre-persons.json');
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as ArbreData;
}
