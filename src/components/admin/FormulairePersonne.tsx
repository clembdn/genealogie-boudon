'use client'

import { useActionState } from 'react'
import type { Person, Union } from '@prisma/client'
import { libelleUnion } from '@/lib/libelles'
import {
  ChampTexte,
  ChampZoneTexte,
  ChampNombre,
  ChampCase,
  ChampSelect,
} from './champs'

type ActionFormulaire = (
  etat: string | undefined,
  formData: FormData,
) => Promise<string | undefined>

export function FormulairePersonne({
  action,
  personne,
  unions,
  personnes,
}: {
  action: ActionFormulaire
  personne?: Person
  unions: Union[]
  personnes: Person[]
}) {
  const [erreur, formAction, enCours] = useActionState(action, undefined)

  const optionsSexe = [
    { valeur: 'inconnu', libelle: 'Inconnu' },
    { valeur: 'homme', libelle: 'Homme' },
    { valeur: 'femme', libelle: 'Femme' },
  ]
  const optionsUnion = [
    { valeur: '', libelle: '— aucun (filiation inconnue) —' },
    ...unions.map((u) => ({
      valeur: u.id,
      libelle: libelleUnion(u, personnes),
    })),
  ]

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {personne ? <input type="hidden" name="id" value={personne.id} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <ChampTexte label="Nom" name="nom" defaultValue={personne?.nom} />
        <ChampTexte label="Prénoms" name="prenoms" defaultValue={personne?.prenoms} />
        <ChampTexte label="Surnom" name="surnom" defaultValue={personne?.surnom} />
        <ChampSelect
          label="Sexe"
          name="sexe"
          options={optionsSexe}
          defaultValue={personne?.sexe ?? 'inconnu'}
        />
        <ChampTexte
          label="Date de naissance"
          name="naissanceDate"
          defaultValue={personne?.naissanceDate}
        />
        <ChampTexte
          label="Lieu de naissance"
          name="naissanceLieu"
          defaultValue={personne?.naissanceLieu}
        />
        <ChampTexte
          label="Date de décès"
          name="decesDate"
          defaultValue={personne?.decesDate}
        />
        <ChampTexte
          label="Lieu de décès"
          name="decesLieu"
          defaultValue={personne?.decesLieu}
        />
        <ChampTexte label="Parrain" name="parrain" defaultValue={personne?.parrain} />
        <ChampTexte label="Marraine" name="marraine" defaultValue={personne?.marraine} />
        <ChampTexte
          label="Profession"
          name="profession"
          defaultValue={personne?.profession}
        />
        <ChampTexte label="Branche" name="branche" defaultValue={personne?.branche} />
        <ChampSelect
          label="Enfant du couple"
          name="unionParentaleId"
          options={optionsUnion}
          defaultValue={personne?.unionParentaleId}
        />
        <ChampNombre
          label="Ordre dans la fratrie"
          name="ordreFratrie"
          defaultValue={personne?.ordreFratrie}
        />
      </div>

      <ChampCase label="Personne vivante" name="vivant" defaultChecked={personne?.vivant} />
      <ChampZoneTexte label="Récit de vie" name="recit" defaultValue={personne?.recit} />
      <ChampZoneTexte
        label="Notes d'import (visibles ici uniquement)"
        name="notesImport"
        defaultValue={personne?.notesImport}
      />

      {erreur ? <p className="text-sm text-red-700">{erreur}</p> : null}
      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-lg bg-sauge px-5 py-2 font-medium text-craie disabled:opacity-60"
      >
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
