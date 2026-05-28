import type { Person } from '@prisma/client'
import { Avatar } from '@/components/ui/Avatar'
import { Carte } from '@/components/ui/Carte'
import { formatDates, nomComplet } from '@/lib/personne/format'
import {
  COULEURS_CATEGORIE,
  type CategorieParente,
} from '@/lib/genealogy/categories'

type PersonneCarte = Pick<
  Person,
  'nom' | 'prenoms' | 'naissanceDate' | 'decesDate' | 'vivant' | 'surnom'
> & {
  photoPrincipale?: { url: string } | null
}

type Props = {
  personne: PersonneCarte
  variante?: 'compacte' | 'detail'
  focalisee?: boolean
  categorie?: CategorieParente
  className?: string
}

export function CartePersonne({
  personne,
  variante = 'compacte',
  focalisee = false,
  categorie,
  className = '',
}: Props) {
  const dates = formatDates(personne)
  const nom = nomComplet(personne)
  const photoUrl = personne.photoPrincipale?.url ?? null

  const couleurBande = categorie ? COULEURS_CATEGORIE[categorie] : null
  const styleBande = couleurBande
    ? { borderLeft: `4px solid ${couleurBande}` }
    : undefined

  if (variante === 'compacte') {
    return (
      <Carte
        interactive
        style={styleBande}
        className={[
          'flex w-[180px] flex-col items-center gap-2 p-3 text-center',
          focalisee ? 'ring-2 ring-sauge ring-offset-2 ring-offset-papier' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Avatar
          url={photoUrl}
          nom={personne.nom}
          prenoms={personne.prenoms}
          taille={56}
        />
        <div className="min-w-0 w-full">
          <p className="font-serif text-base leading-tight text-encre truncate">
            {nom}
          </p>
          {dates && <p className="mt-0.5 text-xs text-brume">{dates}</p>}
        </div>
      </Carte>
    )
  }

  return (
    <Carte
      interactive
      style={styleBande}
      className={['flex items-center gap-4 p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Avatar
        url={photoUrl}
        nom={personne.nom}
        prenoms={personne.prenoms}
        taille={72}
      />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-xl leading-tight text-encre">{nom}</p>
        {personne.surnom && (
          <p className="text-sm italic text-brume">« {personne.surnom} »</p>
        )}
        {dates && <p className="mt-1 text-sm text-brume">{dates}</p>}
      </div>
    </Carte>
  )
}
