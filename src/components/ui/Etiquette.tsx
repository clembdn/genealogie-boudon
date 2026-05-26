import type { HTMLAttributes } from 'react'

type Ton = 'neutre' | 'sauge' | 'discret'

const tons: Record<Ton, string> = {
  neutre: 'bg-papier text-encre border-bordure',
  sauge: 'bg-sauge/10 text-sauge-fonce border-sauge/20',
  discret: 'bg-transparent text-brume border-bordure/60',
}

type Props = HTMLAttributes<HTMLSpanElement> & { ton?: Ton }

export function Etiquette({ ton = 'neutre', className = '', ...rest }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-pilule)] border px-2.5 py-0.5 text-xs font-medium ${tons[ton]} ${className}`}
      {...rest}
    />
  )
}
