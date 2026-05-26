import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export function Carte({ interactive = false, className = '', ...rest }: Props) {
  const base =
    'rounded-[var(--radius-moyenne)] border border-bordure bg-craie shadow-[var(--shadow-douce)]'
  const inter = interactive
    ? 'cursor-pointer transition-shadow duration-200 hover:shadow-[var(--shadow-elevee)]'
    : ''
  return <div className={`${base} ${inter} ${className}`} {...rest} />
}
