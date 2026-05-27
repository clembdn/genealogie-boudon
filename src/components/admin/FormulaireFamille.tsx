'use client'

import { useActionState } from 'react'
import type { Famille } from '@prisma/client'
import { ChampTexte, ChampZoneTexte } from '@/components/admin/champs'
import { Bouton } from '@/components/ui/Bouton'
import {
  mettreAJourFamilleAction,
  type EtatFormulaireFamille,
} from '@/app/admin/familles/actions'

type Props = { famille: Famille }

export function FormulaireFamille({ famille }: Props) {
  const action = mettreAJourFamilleAction.bind(null, famille.id)
  const [etat, formAction, enCours] = useActionState<EtatFormulaireFamille, FormData>(
    action,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ChampTexte
        label="Slug (lecture seule)"
        name="slug"
        defaultValue={famille.slug}
        hint="Identifiant URL, défini à l'import. Non modifiable."
        readOnly
      />
      <ChampTexte
        label="Nom"
        name="nom"
        defaultValue={famille.nom}
        requis
      />
      <ChampZoneTexte
        label="Description"
        name="description"
        defaultValue={famille.description ?? ''}
        hint="Retours à la ligne respectés à l'affichage."
        rows={6}
      />
      <ChampTexte
        label="Ordre"
        name="ordre"
        type="number"
        defaultValue={famille.ordre}
        hint="Plus petit = affiché en premier dans /familles."
      />

      {etat?.erreur && <p className="text-sm text-red-700">{etat.erreur}</p>}
      {etat?.succes && <p className="text-sm text-sauge">Modifications enregistrées.</p>}

      <div>
        <Bouton type="submit" disabled={enCours}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </Bouton>
      </div>
    </form>
  )
}
