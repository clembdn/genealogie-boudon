import { forwardRef, type ButtonHTMLAttributes } from 'react'
import {
  classesBouton,
  type TailleBouton,
  type VarianteBouton,
} from './classes-bouton'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton
  taille?: TailleBouton
}

export const Bouton = forwardRef<HTMLButtonElement, Props>(function Bouton(
  { variante = 'primaire', taille = 'moyen', className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classesBouton(variante, taille, className)}
      {...rest}
    />
  )
})
