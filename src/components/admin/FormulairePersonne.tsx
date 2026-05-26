'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { Person, Union, Media } from '@prisma/client'
import {
  ChampTexte,
  ChampZoneTexte,
  ChampSelect,
  ChampCase,
} from '@/components/admin/champs'
import { Bouton } from '@/components/ui/Bouton'
import { classesBouton } from '@/components/ui/classes-bouton'
import { libelleUnion } from '@/lib/libelles'
import {
  creerPersonneAction,
  mettreAJourPersonneAction,
  type EtatFormulairePersonne,
} from '@/app/admin/personnes/actions'

type Props = {
  personne?: Person
  unions: Union[]
  personnes: Pick<Person, 'id' | 'nom' | 'prenoms'>[]
  medias?: Media[]
}

export function FormulairePersonne({
  personne,
  unions,
  personnes,
  medias = [],
}: Props) {
  const enEdition = Boolean(personne)
  const action = enEdition
    ? mettreAJourPersonneAction.bind(null, personne!.id)
    : creerPersonneAction
  const [etat, formAction, enCours] = useActionState<
    EtatFormulairePersonne,
    FormData
  >(action, null)

  const optionsUnions = [
    { value: '', label: 'Aucune / inconnue' },
    ...[...unions]
      .map((u) => ({
        value: u.id,
        label: libelleUnion(u, personnes),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
  ]

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <Section titre="Identité">
        <Grille>
          <ChampTexte label="Nom" name="nom" requis defaultValue={personne?.nom ?? ''} />
          <ChampTexte
            label="Prénoms"
            name="prenoms"
            defaultValue={personne?.prenoms ?? ''}
          />
          <ChampTexte
            label="Surnom"
            name="surnom"
            defaultValue={personne?.surnom ?? ''}
          />
          <ChampSelect
            label="Sexe"
            name="sexe"
            defaultValue={personne?.sexe ?? 'inconnu'}
            options={[
              { value: 'inconnu', label: 'Inconnu' },
              { value: 'homme', label: 'Homme' },
              { value: 'femme', label: 'Femme' },
            ]}
          />
          <ChampTexte
            label="Branche"
            name="branche"
            defaultValue={personne?.branche ?? ''}
            hint="Ex. paternelle, maternelle, alliée…"
          />
        </Grille>
      </Section>

      <Section titre="Naissance & décès">
        <Grille>
          <ChampTexte
            label="Date de naissance"
            name="naissanceDate"
            defaultValue={personne?.naissanceDate ?? ''}
            hint="Format libre : « 1820 », « 14 mars 1820 », « vers 1820 »…"
          />
          <ChampTexte
            label="Lieu de naissance"
            name="naissanceLieu"
            defaultValue={personne?.naissanceLieu ?? ''}
          />
          <ChampTexte
            label="Date de décès"
            name="decesDate"
            defaultValue={personne?.decesDate ?? ''}
            hint="Vide si vivant·e ou inconnu"
          />
          <ChampTexte
            label="Lieu de décès"
            name="decesLieu"
            defaultValue={personne?.decesLieu ?? ''}
          />
        </Grille>
        <ChampCase
          label="Personne vivante"
          name="vivant"
          defaultChecked={personne?.vivant ?? false}
          hint="Cochez si la personne est encore en vie."
        />
        <ChampCase
          label="Racine de l'arbre"
          name="racineParDefaut"
          defaultChecked={personne?.racineParDefaut ?? false}
          hint="Personne sur laquelle l'arbre se centre par défaut à l'arrivée des visiteurs. Une seule personne à la fois."
        />
      </Section>

      <Section titre="Filiation">
        <Grille>
          <ChampSelect
            label="Union des parents"
            name="unionParentaleId"
            defaultValue={personne?.unionParentaleId ?? ''}
            options={optionsUnions}
            hint="L'union qui a engendré cette personne."
          />
          <ChampTexte
            label="Ordre dans la fratrie"
            name="ordreFratrie"
            type="number"
            defaultValue={String(personne?.ordreFratrie ?? 0)}
            hint="0 = aîné·e. Sert à ordonner les frères et sœurs."
          />
          <ChampTexte
            label="Parrain"
            name="parrain"
            defaultValue={personne?.parrain ?? ''}
          />
          <ChampTexte
            label="Marraine"
            name="marraine"
            defaultValue={personne?.marraine ?? ''}
          />
        </Grille>
      </Section>

      <Section titre="Récit & profession">
        <ChampTexte
          label="Profession"
          name="profession"
          defaultValue={personne?.profession ?? ''}
        />
        <ChampZoneTexte
          label="Récit / anecdotes"
          name="recit"
          rows={10}
          defaultValue={personne?.recit ?? ''}
          hint="Texte libre, retours à la ligne préservés à l'affichage."
        />
      </Section>

      {enEdition && medias.filter((m) => m.type === 'photo').length > 0 && (
        <Section titre="Photo principale">
          <ChampSelect
            label="Photo affichée par défaut"
            name="photoPrincipaleId"
            defaultValue={personne?.photoPrincipaleId ?? ''}
            hint="Image utilisée dans l'arbre, la modale et la page publique."
            options={[
              { value: '', label: 'Aucune' },
              ...medias
                .filter((m) => m.type === 'photo')
                .map((m) => ({ value: m.id, label: m.titre || m.url })),
            ]}
          />
        </Section>
      )}

      {etat?.erreur && (
        <p className="rounded-[var(--radius-douce)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {etat.erreur}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-bordure pt-6">
        <Link
          href="/admin/personnes"
          className={classesBouton('discret', 'moyen')}
        >
          Retour à la liste
        </Link>
        <Bouton type="submit" disabled={enCours}>
          {enCours
            ? 'Enregistrement…'
            : enEdition
              ? 'Enregistrer'
              : 'Créer la personne'}
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
