import type { Union } from '@prisma/client'

export type StyleLienUnion = 'plein' | 'pointille' | 'barre'

/**
 * Détermine l'apparence du trait reliant les deux partenaires d'une union.
 * Voir le document de conception, section 5.
 */
export function styleLienUnion(
  union: Pick<Union, 'nature' | 'causeFin'>,
): StyleLienUnion {
  if (union.nature === 'union_libre') return 'pointille'
  if (union.nature === 'mariage' && union.causeFin === 'divorce') return 'barre'
  return 'plein'
}
