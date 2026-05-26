'use client'

import Link from 'next/link'
import type { Person, Media } from '@prisma/client'
import { Modale } from '@/components/ui/Modale'
import { nomComplet, slugPersonne } from '@/lib/personne/format'
import { classesBouton } from '@/components/ui/classes-bouton'
import { ContenuDetailPersonne } from './ContenuDetailPersonne'
import type { RelationsPersonne } from '@/lib/genealogy/relations'

export type { RelationsPersonne }

type PersonneDetail = Person & {
  photoPrincipale?: { url: string } | null
}

type Props = {
  personne: PersonneDetail | null
  relations?: RelationsPersonne
  medias?: Media[]
  ouverte: boolean
  surFermeture: () => void
  surSelectionPersonne?: (personne: Person) => void
}

export function ModaleDetailPersonne({
  personne,
  relations,
  medias,
  ouverte,
  surFermeture,
  surSelectionPersonne,
}: Props) {
  if (!personne) {
    return (
      <Modale ouverte={ouverte} surFermeture={surFermeture} titre="">
        <p className="text-brume">Aucune personne sélectionnée.</p>
      </Modale>
    )
  }

  return (
    <Modale
      ouverte={ouverte}
      surFermeture={surFermeture}
      titre={nomComplet(personne)}
      largeMax="large"
    >
      <ContenuDetailPersonne
        personne={personne}
        relations={relations}
        medias={medias}
        surSelectionPersonne={surSelectionPersonne}
      />
      <div className="mt-6 flex justify-end border-t border-bordure pt-4">
        <Link
          href={`/personne/${slugPersonne(personne)}`}
          className={classesBouton('discret', 'moyen')}
        >
          Page complète
        </Link>
      </div>
    </Modale>
  )
}
