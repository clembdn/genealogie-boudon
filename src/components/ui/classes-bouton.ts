export type VarianteBouton = 'primaire' | 'secondaire' | 'discret'
export type TailleBouton = 'petit' | 'moyen' | 'grand'

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-douce)] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'

const variantes: Record<VarianteBouton, string> = {
  primaire:
    'bg-sauge text-craie hover:bg-sauge-fonce focus-visible:outline-sauge-fonce',
  secondaire:
    'border border-bordure bg-craie text-encre hover:border-sauge hover:text-sauge',
  discret:
    'text-encre hover:bg-bordure/60',
}

const tailles: Record<TailleBouton, string> = {
  petit: 'h-9 px-3 text-sm',
  moyen: 'h-11 px-5 text-base',
  grand: 'h-12 px-6 text-lg',
}

export function classesBouton(
  variante: VarianteBouton = 'primaire',
  taille: TailleBouton = 'moyen',
  classesSupp = '',
) {
  return [base, variantes[variante], tailles[taille], classesSupp]
    .filter(Boolean)
    .join(' ')
}
