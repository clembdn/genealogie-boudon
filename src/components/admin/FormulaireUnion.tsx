'use client'

import { useActionState } from 'react'
import type { Person, Union } from '@prisma/client'
import { libellePersonne } from '@/lib/libelles'
import { ChampTexte, ChampZoneTexte, ChampSelect } from './champs'

type ActionFormulaire = (
  etat: string | undefined,
  formData: FormData,
) => Promise<string | undefined>

export function FormulaireUnion({
  action,
  union,
  personnes,
}: {
  action: ActionFormulaire
  union?: Union
  personnes: Person[]
}) {
  const [erreur, formAction, enCours] = useActionState(action, undefined)

  const optionsPersonne = [
    { valeur: '', libelle: '— inconnu —' },
    ...personnes.map((p) => ({ valeur: p.id, libelle: libellePersonne(p) })),
  ]
  const optionsNature = [
    { valeur: 'inconnue', libelle: 'Inconnue' },
    { valeur: 'mariage', libelle: 'Mariage' },
    { valeur: 'union_libre', libelle: 'Union libre' },
  ]
  const optionsCauseFin = [
    { valeur: '', libelle: '— aucune —' },
    { valeur: 'divorce', libelle: 'Divorce' },
    { valeur: 'deces', libelle: 'Décès' },
    { valeur: 'separation', libelle: 'Séparation' },
  ]

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {union ? <input type="hidden" name="id" value={union.id} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <ChampSelect
          label="Partenaire 1"
          name="partenaire1Id"
          options={optionsPersonne}
          defaultValue={union?.partenaire1Id}
        />
        <ChampSelect
          label="Partenaire 2"
          name="partenaire2Id"
          options={optionsPersonne}
          defaultValue={union?.partenaire2Id}
        />
        <ChampSelect
          label="Nature"
          name="nature"
          options={optionsNature}
          defaultValue={union?.nature ?? 'inconnue'}
        />
        <ChampSelect
          label="Cause de fin"
          name="causeFin"
          options={optionsCauseFin}
          defaultValue={union?.causeFin}
        />
        <ChampTexte label="Date de début" name="dateDebut" defaultValue={union?.dateDebut} />
        <ChampTexte label="Lieu de début" name="lieuDebut" defaultValue={union?.lieuDebut} />
        <ChampTexte label="Date de fin" name="dateFin" defaultValue={union?.dateFin} />
      </div>

      <ChampZoneTexte label="Notes" name="notes" defaultValue={union?.notes} />

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
