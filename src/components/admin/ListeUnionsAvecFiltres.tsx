'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import type { Person, Union, UnionNature } from '@prisma/client'
import { Carte } from '@/components/ui/Carte'
import { libelleUnion } from '@/lib/libelles'
import {
  extraireAnnee,
  normaliserPourRecherche,
} from '@/lib/personne/format'

const libellesNature: Record<UnionNature, string> = {
  mariage: 'Mariage',
  union_libre: 'Union libre',
  inconnue: 'Union',
}

type Filtres = {
  recherche: string
  nature: '' | UnionNature
  anneeMin: string
  anneeMax: string
  lieu: string
}

const filtresVides: Filtres = {
  recherche: '',
  nature: '',
  anneeMin: '',
  anneeMax: '',
  lieu: '',
}

type PersonneLite = Pick<Person, 'id' | 'nom' | 'prenoms'>

export function ListeUnionsAvecFiltres({
  unions,
  personnes,
}: {
  unions: Union[]
  personnes: PersonneLite[]
}) {
  const [f, setF] = useState<Filtres>(filtresVides)

  const indexPersonnes = useMemo(() => {
    const m = new Map<string, PersonneLite>()
    personnes.forEach((p) => m.set(p.id, p))
    return m
  }, [personnes])

  const filtrees = useMemo(() => {
    return unions.filter((u) => correspond(u, f, indexPersonnes))
  }, [unions, f, indexPersonnes])

  const aFiltreActif =
    f.recherche || f.nature || f.anneeMin || f.anneeMax || f.lieu

  function maj<K extends keyof Filtres>(cle: K, valeur: Filtres[K]) {
    setF((prev) => ({ ...prev, [cle]: valeur }))
  }

  return (
    <div className="flex flex-col gap-5">
      <BarreFiltres
        filtres={f}
        onChange={maj}
        onReinitialiser={() => setF(filtresVides)}
        aFiltreActif={Boolean(aFiltreActif)}
      />

      <p className="text-sm text-brume">
        {filtrees.length} sur {unions.length} union{unions.length > 1 ? 's' : ''}
        {aFiltreActif && filtrees.length !== unions.length && (
          <> · filtres actifs</>
        )}
      </p>

      {filtrees.length === 0 ? (
        <Carte className="p-8 text-center">
          <p className="text-brume">
            {aFiltreActif
              ? 'Aucune union ne correspond aux filtres.'
              : 'Aucune union enregistrée. Une union est créée à partir de deux personnes existantes ; ajoute d’abord les personnes.'}
          </p>
        </Carte>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtrees.map((u) => (
            <li key={u.id}>
              <Link
                href={`/admin/unions/${u.id}`}
                className="flex items-center gap-4 rounded-[var(--radius-douce)] border border-bordure bg-craie px-4 py-3 transition-colors hover:border-sauge"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base text-encre">
                    {libelleUnion(u, personnes)}
                  </p>
                  <p className="truncate text-xs text-brume">
                    {libellesNature[u.nature]}
                    {u.dateDebut && <> · {u.dateDebut}</>}
                    {u.lieuDebut && <> · {u.lieuDebut}</>}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  aria-hidden
                  className="text-brume shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function correspond(
  u: Union,
  f: Filtres,
  index: Map<string, PersonneLite>,
): boolean {
  if (f.recherche.trim()) {
    const partenaires = [u.partenaire1Id, u.partenaire2Id]
      .map((id) => (id ? index.get(id) : null))
      .filter(Boolean) as PersonneLite[]
    const corpus = normaliserPourRecherche(
      [
        ...partenaires.map((p) => `${p.prenoms} ${p.nom}`),
        u.lieuDebut,
        u.notes,
      ]
        .filter(Boolean)
        .join(' '),
    )
    const tokens = normaliserPourRecherche(f.recherche)
      .split(' ')
      .filter(Boolean)
    if (!tokens.every((t) => corpus.includes(t))) return false
  }

  if (f.nature && u.nature !== f.nature) return false

  const annee = extraireAnnee(u.dateDebut)
  const min = parseInt(f.anneeMin, 10)
  const max = parseInt(f.anneeMax, 10)
  if (Number.isFinite(min)) {
    if (annee === null || annee < min) return false
  }
  if (Number.isFinite(max)) {
    if (annee === null || annee > max) return false
  }

  if (f.lieu.trim()) {
    const corpusLieu = normaliserPourRecherche(u.lieuDebut)
    if (!corpusLieu.includes(normaliserPourRecherche(f.lieu))) return false
  }

  return true
}

function BarreFiltres({
  filtres,
  onChange,
  onReinitialiser,
  aFiltreActif,
}: {
  filtres: Filtres
  onChange: <K extends keyof Filtres>(cle: K, val: Filtres[K]) => void
  onReinitialiser: () => void
  aFiltreActif: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-moyenne)] border border-bordure bg-craie p-4">
      <div className="flex items-center gap-2 rounded-[var(--radius-douce)] border border-bordure bg-papier px-3">
        <Search size={16} aria-hidden className="text-brume" />
        <input
          type="search"
          value={filtres.recherche}
          onChange={(e) => onChange('recherche', e.target.value)}
          placeholder="Rechercher par partenaire, lieu, notes…"
          className="h-11 flex-1 bg-transparent text-base text-encre outline-none placeholder:text-brume"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          label="Nature"
          value={filtres.nature}
          onChange={(v) => onChange('nature', v as '' | UnionNature)}
          options={[
            { value: '', label: 'Toutes' },
            { value: 'mariage', label: 'Mariage' },
            { value: 'union_libre', label: 'Union libre' },
            { value: 'inconnue', label: 'Inconnue' },
          ]}
        />
        <Champ label="Année min">
          <input
            type="number"
            inputMode="numeric"
            placeholder="ex. 1700"
            value={filtres.anneeMin}
            onChange={(e) => onChange('anneeMin', e.target.value)}
            className={inputCls}
          />
        </Champ>
        <Champ label="Année max">
          <input
            type="number"
            inputMode="numeric"
            placeholder="ex. 1900"
            value={filtres.anneeMax}
            onChange={(e) => onChange('anneeMax', e.target.value)}
            className={inputCls}
          />
        </Champ>
        <Champ label="Lieu de l'union">
          <input
            type="text"
            value={filtres.lieu}
            onChange={(e) => onChange('lieu', e.target.value)}
            placeholder="ex. Lyon"
            className={inputCls}
          />
        </Champ>
      </div>

      {aFiltreActif && (
        <div>
          <button
            type="button"
            onClick={onReinitialiser}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-douce)] px-2 text-xs text-brume hover:text-encre"
          >
            <X size={12} aria-hidden /> Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  )
}

const inputCls =
  'h-10 w-full rounded-[var(--radius-douce)] border border-bordure bg-papier px-2 text-sm text-encre outline-none focus:border-sauge'

function Champ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.12em] text-brume">
        {label}
      </span>
      {children}
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Champ label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Champ>
  )
}
