'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import type { Person, Sexe } from '@prisma/client'
import { Carte } from '@/components/ui/Carte'
import { Avatar } from '@/components/ui/Avatar'
import {
  extraireAnnee,
  formatDates,
  nomComplet,
  normaliserPourRecherche,
} from '@/lib/personne/format'

type PersonneListe = Person & {
  photoPrincipale?: { url: string } | null
}

type Filtres = {
  recherche: string
  branche: string
  sexe: '' | Sexe
  vivant: '' | 'oui' | 'non'
  anneeMin: string
  anneeMax: string
  lieu: string
}

const filtresVides: Filtres = {
  recherche: '',
  branche: '',
  sexe: '',
  vivant: '',
  anneeMin: '',
  anneeMax: '',
  lieu: '',
}

export function ListePersonnesAvecFiltres({
  personnes,
}: {
  personnes: PersonneListe[]
}) {
  const [f, setF] = useState<Filtres>(filtresVides)

  const branches = useMemo(() => {
    const set = new Set<string>()
    personnes.forEach((p) => p.branche && set.add(p.branche))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [personnes])

  const filtrees = useMemo(() => {
    return personnes.filter((p) => correspond(p, f))
  }, [personnes, f])

  const aFiltreActif =
    f.recherche || f.branche || f.sexe || f.vivant || f.anneeMin || f.anneeMax || f.lieu

  function maj<K extends keyof Filtres>(cle: K, valeur: Filtres[K]) {
    setF((prev) => ({ ...prev, [cle]: valeur }))
  }

  return (
    <div className="flex flex-col gap-5">
      <BarreFiltres
        filtres={f}
        branches={branches}
        onChange={maj}
        onReinitialiser={() => setF(filtresVides)}
        aFiltreActif={Boolean(aFiltreActif)}
      />

      <p className="text-sm text-brume">
        {filtrees.length} sur {personnes.length} personne
        {personnes.length > 1 ? 's' : ''}
        {aFiltreActif && filtrees.length !== personnes.length && (
          <> · filtres actifs</>
        )}
      </p>

      {filtrees.length === 0 ? (
        <Carte className="p-8 text-center">
          <p className="text-brume">
            {aFiltreActif
              ? 'Aucune personne ne correspond aux filtres.'
              : 'Aucune personne pour le moment. Commence par en créer une.'}
          </p>
        </Carte>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtrees.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/personnes/${p.id}`}
                className="flex items-center gap-4 rounded-[var(--radius-douce)] border border-bordure bg-craie px-4 py-3 transition-colors hover:border-sauge"
              >
                <Avatar
                  url={p.photoPrincipale?.url ?? null}
                  nom={p.nom}
                  prenoms={p.prenoms}
                  taille={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base text-encre">
                    {nomComplet(p)}
                  </p>
                  <p className="truncate text-xs text-brume">
                    {formatDates(p) || 'Dates inconnues'}
                    {p.branche && <> · branche {p.branche}</>}
                    {p.naissanceLieu && <> · {p.naissanceLieu}</>}
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

function correspond(p: PersonneListe, f: Filtres): boolean {
  if (f.recherche.trim()) {
    const corpus = normaliserPourRecherche(
      [p.nom, p.prenoms, p.surnom, p.branche, p.naissanceLieu, p.decesLieu]
        .filter(Boolean)
        .join(' '),
    )
    const tokens = normaliserPourRecherche(f.recherche)
      .split(' ')
      .filter(Boolean)
    if (!tokens.every((t) => corpus.includes(t))) return false
  }
  if (f.branche && p.branche !== f.branche) return false
  if (f.sexe && p.sexe !== f.sexe) return false
  if (f.vivant === 'oui' && !p.vivant) return false
  if (f.vivant === 'non' && p.vivant) return false

  const annee = extraireAnnee(p.naissanceDate)
  const min = parseInt(f.anneeMin, 10)
  const max = parseInt(f.anneeMax, 10)
  if (Number.isFinite(min)) {
    if (annee === null || annee < min) return false
  }
  if (Number.isFinite(max)) {
    if (annee === null || annee > max) return false
  }

  if (f.lieu.trim()) {
    const corpusLieu = normaliserPourRecherche(
      [p.naissanceLieu, p.decesLieu].filter(Boolean).join(' '),
    )
    if (!corpusLieu.includes(normaliserPourRecherche(f.lieu))) return false
  }

  return true
}

function BarreFiltres({
  filtres,
  branches,
  onChange,
  onReinitialiser,
  aFiltreActif,
}: {
  filtres: Filtres
  branches: string[]
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
          placeholder="Rechercher par nom, prénom, surnom, branche, lieu…"
          className="h-11 flex-1 bg-transparent text-base text-encre outline-none placeholder:text-brume"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Select
          label="Branche"
          value={filtres.branche}
          onChange={(v) => onChange('branche', v)}
          options={[
            { value: '', label: 'Toutes' },
            ...branches.map((b) => ({ value: b, label: b })),
          ]}
        />
        <Select
          label="Sexe"
          value={filtres.sexe}
          onChange={(v) => onChange('sexe', v as '' | Sexe)}
          options={[
            { value: '', label: 'Tous' },
            { value: 'homme', label: 'Homme' },
            { value: 'femme', label: 'Femme' },
            { value: 'inconnu', label: 'Inconnu' },
          ]}
        />
        <Select
          label="Vivant·e"
          value={filtres.vivant}
          onChange={(v) => onChange('vivant', v as '' | 'oui' | 'non')}
          options={[
            { value: '', label: 'Tous' },
            { value: 'oui', label: 'Oui' },
            { value: 'non', label: 'Non' },
          ]}
        />
        <Champ label="Né·e après">
          <input
            type="number"
            inputMode="numeric"
            placeholder="ex. 1700"
            value={filtres.anneeMin}
            onChange={(e) => onChange('anneeMin', e.target.value)}
            className={inputCls}
          />
        </Champ>
        <Champ label="Né·e avant">
          <input
            type="number"
            inputMode="numeric"
            placeholder="ex. 1900"
            value={filtres.anneeMax}
            onChange={(e) => onChange('anneeMax', e.target.value)}
            className={inputCls}
          />
        </Champ>
        <Champ label="Lieu (naissance ou décès)">
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
