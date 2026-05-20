// Types des donnees extraites de l'Excel par scripts/parse-arbre.mjs.

export interface ParsedEvent {
  date: string | null;
  lieu: string | null;
  /** true = annee devinee (collee dans la ligne du nom), a verifier */
  approx?: boolean;
}

export interface ParsedPerson {
  id: string;
  row: number;
  col: number;
  shapeName: string | null;
  multiPerson: boolean;
  raw: string;
  nom: string;
  prenoms: string;
  surnom: string | null;
  naissance: ParsedEvent | null;
  deces: ParsedEvent | null;
  parrain: string | null;
  marraine: string | null;
  notes: string | null;
}

export interface ParsedGeneration {
  row: number;
  col: number;
  shapeName: string | null;
  label: string;
}

export interface ParsedTextShape {
  row: number;
  col: number;
  shapeName: string | null;
  text: string;
}

export interface ArbreData {
  sheet: string;
  source: string;
  drawing: string;
  generations: ParsedGeneration[];
  persons: ParsedPerson[];
  unions: ParsedTextShape[];
  branchPointers: ParsedTextShape[];
  annotations: ParsedTextShape[];
  skipped: unknown[];
}
