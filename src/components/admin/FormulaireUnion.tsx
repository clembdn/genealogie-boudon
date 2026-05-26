'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { Person, Union } from '@prisma/client'
import {
  ChampTexte,
  ChampZoneTexte,
  ChampSelect,
} from '@/components/admin/champs'
import { Bouton } from '@/components/ui/Bouton'
import { classesBouton } from '@/components/ui/classes-bouton'
import { libellePersonne } from '@/lib/libelles'
import {
  creerUnionAction,
  mettreAJourUnionAction,
  type EtatFormulaireUnion,
} from '@/app/admin/unions/actions'

type Props = {
  union?: Union
  personnes: Pick<Person, 'id' | 'nom' | 'prenoms'>[]
}

export function FormulaireUnion({ union, personnes }: Props) {
  const enEdition = Boolean(union)
  const action = enEdition
    ? mettreAJourUnionAction.bind(null, union!.id)
    : creerUnionAction
  const [etat, formAction, enCours] = useActionState<
    EtatFormulaireUnion,
    FormData
  >(action, null)

  const optionsPersonnes = [
    { value: '', label: '— Inconnu —' },
    ...personnes
      .map((p) => ({ value: p.id, label: libellePersonne(p) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
  ]

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <Section titre="Partenaires">
        <Grille>
          <ChampSelect
            label="Partenaire 1"
            name="partenaire1Id"
            defaultValue={union?.partenaire1Id ?? ''}
            options={optionsPersonnes}
          />
          <ChampSelect
            label="Partenaire 2"
            name="partenaire2Id"
            defaultValue={union?.partenaire2Id ?? ''}
            options={optionsPersonnes}
          />
        </Grille>
        <p className="text-xs text-brume">
          Au moins un partenaire doit être renseigné. L&apos;ordre n&apos;a pas
          d&apos;importance.
        </p>
      </Section>

      <Section titre="Nature & début">
        <Grille>
          <ChampSelect
            label="Nature"
            name="nature"
            defaultValue={union?.nature ?? 'inconnue'}
            options={[
              { value: 'inconnue', label: 'Inconnue' },
              { value: 'mariage', label: 'Mariage' },
              { value: 'union_libre', label: 'Union libre' },
            ]}
          />
          <ChampTexte
            label="Date de début"
            name="dateDebut"
            defaultValue={union?.dateDebut ?? ''}
            hint="Format libre"
          />
          <ChampTexte
            label="Lieu"
            name="lieuDebut"
            defaultValue={union?.lieuDebut ?? ''}
          />
        </Grille>
      </Section>

      <Section titre="Fin de l'union">
        <Grille>
          <ChampTexte
            label="Date de fin"
            name="dateFin"
            defaultValue={union?.dateFin ?? ''}
            hint="Vide si l'union est encore en cours"
          />
          <ChampSelect
            label="Cause de fin"
            name="causeFin"
            defaultValue={union?.causeFin ?? ''}
            options={[
              { value: '', label: '— Non précisée —' },
              { value: 'divorce', label: 'Divorce' },
              { value: 'deces', label: 'Décès' },
              { value: 'separation', label: 'Séparation' },
            ]}
          />
        </Grille>
      </Section>

      <Section titre="Notes">
        <ChampZoneTexte
          label="Notes libres"
          name="notes"
          rows={4}
          defaultValue={union?.notes ?? ''}
        />
      </Section>

      {etat?.erreur && (
        <p className="rounded-[var(--radius-douce)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {etat.erreur}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-bordure pt-6">
        <Link
          href="/admin/unions"
          className={classesBouton('discret', 'moyen')}
        >
          Retour à la liste
        </Link>
        <Bouton type="submit" disabled={enCours}>
          {enCours
            ? 'Enregistrement…'
            : enEdition
              ? 'Enregistrer'
              : 'Créer l’union'}
        </Bouton>
      </div>
    </form>
  )
}

function Section({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-serif text-sm uppercase tracking-[0.16em] text-brume">
        {titre}
      </h2>
      {children}
    </section>
  )
}

function Grille({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  )
}
