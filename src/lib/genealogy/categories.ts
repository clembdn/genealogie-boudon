export const CATEGORIES_PARENTE = [
  'LIGNE_DIRECTE',
  'COUSIN_GERMAIN',
  'COUSIN_DEMI_GERMAIN',
  'COUSIN_ISSU_DE_GERMAIN',
  'PETIT_COUSIN',
  'ARRIERE_PETIT_COUSIN',
  'CONTACT_LIGNE',
  'NEUTRE',
] as const

export type CategorieParente = (typeof CATEGORIES_PARENTE)[number]

export const LIBELLES_CATEGORIE: Record<CategorieParente, string> = {
  LIGNE_DIRECTE: 'Ligne directe',
  COUSIN_GERMAIN: 'Cousin germain',
  COUSIN_DEMI_GERMAIN: 'Cousin demi-germain',
  COUSIN_ISSU_DE_GERMAIN: 'Cousin issu de germain',
  PETIT_COUSIN: 'Petit-cousin',
  ARRIERE_PETIT_COUSIN: 'Arrière-petit-cousin',
  CONTACT_LIGNE: 'Conjoint de la ligne directe',
  NEUTRE: 'Autre / non rattaché',
}

export const COULEURS_CATEGORIE: Record<CategorieParente, string | null> = {
  LIGNE_DIRECTE: '#FFE600',
  COUSIN_GERMAIN: '#6E3A07',
  COUSIN_DEMI_GERMAIN: '#B45F06',
  COUSIN_ISSU_DE_GERMAIN: '#E67E22',
  PETIT_COUSIN: '#F39C12',
  ARRIERE_PETIT_COUSIN: '#F1C40F',
  CONTACT_LIGNE: '#FFADAD',
  NEUTRE: null,
}

export const ORDRE_AFFICHAGE_LEGENDE: readonly CategorieParente[] = [
  'LIGNE_DIRECTE',
  'CONTACT_LIGNE',
  'COUSIN_GERMAIN',
  'COUSIN_DEMI_GERMAIN',
  'COUSIN_ISSU_DE_GERMAIN',
  'PETIT_COUSIN',
  'ARRIERE_PETIT_COUSIN',
  'NEUTRE',
]
