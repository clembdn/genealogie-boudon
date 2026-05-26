# Familles, médias famille et import complet — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importer les 968 personnes des 9 feuilles Excel, reconstruire automatiquement les unions, introduire une entité Famille avec page publique et description éditable, et permettre les médias rattachés à une famille (pas seulement à une personne).

**Architecture:** Nouvelle table Prisma `Famille` reliée 1-N à `Person` et 1-N à `Media`. `Media.personId` devient nullable, invariant XOR personne|famille géré côté applicatif. Script d'import idempotent unique qui upsert famille → personnes → unions reconstruites → médias uploadés sur Vercel Blob. UI publique avec `/familles` (index) et `/familles/[slug]` (détail). Admin avec édition de la description et des médias famille via le composant `SectionMedias` généralisé.

**Tech Stack:** Next.js 16, Prisma 6 + Postgres (Neon), Vercel Blob, React 19 Server Components, Tailwind 4, vitest, tsx.

**Spec source :** [`docs/superpowers/specs/2026-05-26-familles-medias-design.md`](../specs/2026-05-26-familles-medias-design.md)

**Conventions du projet :**
- Code en français (`prisma/schema.prisma` aussi : `Famille`, `personnes`, `medias`).
- `'use server'` pour les server actions, `'use client'` pour les hooks React.
- Tests vitest avec `describe`/`it`/`expect`.
- `prisma` importé depuis `@/lib/db`.
- L'utilisateur exécute lui-même les commandes `git`, `db:migrate`, `db:generate`, `dev`, etc. Les blocs `git commit` du plan sont à proposer à l'utilisateur, pas à exécuter automatiquement.
- L'accès BDD passe par un hotspot 4G (port 5432 bloqué sur le réseau habituel) — prévenir l'utilisateur avant chaque commande nécessitant Prisma.

---

## Cartographie des fichiers

**Schéma & migration :**
- Modifier : `prisma/schema.prisma` (ajout `Famille`, champs nullables sur `Media`, `familleId` sur `Person`)
- Créer : migration Prisma (générée par `prisma migrate dev --name familles_medias_famille`)

**Bibliothèques (`src/lib`) :**
- Créer : `src/lib/famille/nom.ts` (slug → libellé d'affichage)
- Créer : `src/lib/famille/nom.test.ts`
- Créer : `src/lib/famille/description-source.ts` (extrait la description amorcée depuis les pointers de `arbre.json`)
- Créer : `src/lib/famille/description-source.test.ts`
- Créer : `src/lib/famille/charger.ts` (chargerFamilles, chargerFamilleParSlug)
- Modifier : `src/lib/import/transform-person.ts` (ajout `familleId`)
- Modifier : `src/lib/import/transform-person.test.ts`
- Créer : `src/lib/import/construire-unions.ts`
- Créer : `src/lib/import/construire-unions.test.ts`
- Créer : `src/lib/import/upload-image.ts`
- Créer : `src/lib/import/merge-personne.ts` (logique de merge intelligent à l'upsert)
- Créer : `src/lib/import/merge-personne.test.ts`

**Script d'import :**
- Créer : `scripts/import-extracted.ts`
- Supprimer : `scripts/import-arbre.ts`
- Modifier : `package.json` (renommer le script npm)

**UI publique :**
- Créer : `src/app/familles/page.tsx`
- Créer : `src/app/familles/[slug]/page.tsx`
- Créer : `src/components/famille/CarteFamille.tsx`
- Créer : `src/components/famille/GalerieFamille.tsx`
- Créer : `src/components/Entete.tsx`
- Modifier : `src/app/layout.tsx` (ajout `<Entete />`)
- Créer : `src/components/famille/ModaleImage.tsx` (lightbox simple sur les photos famille)

**Admin :**
- Créer : `src/app/admin/familles/page.tsx`
- Créer : `src/app/admin/familles/[id]/page.tsx`
- Créer : `src/app/admin/familles/actions.ts`
- Créer : `src/components/admin/FormulaireFamille.tsx`
- Modifier : `src/app/admin/layout.tsx` (ajout du lien « Familles »)
- Modifier : `src/components/admin/SectionMedias.tsx` (prop `cible: { type, id }`)
- Modifier : `src/app/admin/personnes/[id]/medias/actions.ts` → renommer en `src/app/admin/medias/actions.ts` et étendre pour gérer `familleId`
- Modifier : `src/app/admin/personnes/[id]/page.tsx` (nouvelle prop `cible`)

---

## Task 1 : Schéma Prisma — table Famille et champs nullables

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1 : Ajouter le modèle Famille**

Dans `prisma/schema.prisma`, après l'enum `MediaType`, ajouter :

```prisma
model Famille {
  id          String   @id @default(cuid())
  slug        String   @unique
  nom         String
  description String?
  ordre       Int      @default(0)

  personnes   Person[]
  medias      Media[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 2 : Ajouter `familleId` sur Person**

Dans le modèle `Person`, juste après `unionParentaleId` et avant `photoPrincipaleId`, ajouter :

```prisma
  familleId         String?
  famille           Famille? @relation(fields: [familleId], references: [id], onDelete: SetNull)
```

Et ajouter `@@index([familleId])` dans le bloc d'index à la fin du modèle (après `@@index([nom])`).

- [ ] **Step 3 : Rendre `Media.personId` nullable et ajouter `familleId`**

Dans le modèle `Media`, remplacer :

```prisma
  personId    String
  person      Person    @relation("MediasPersonne", fields: [personId], references: [id], onDelete: Cascade)
```

par :

```prisma
  personId    String?
  person      Person?   @relation("MediasPersonne", fields: [personId], references: [id], onDelete: Cascade)

  familleId   String?
  famille     Famille?  @relation(fields: [familleId], references: [id], onDelete: Cascade)
```

Et ajouter `@@index([familleId])` après `@@index([personId])`.

- [ ] **Step 4 : Demander à l'utilisateur d'exécuter la migration**

Annoncer à l'utilisateur :

> Schéma modifié. Lance ces commandes (hotspot 4G nécessaire pour la connexion 5432) :
> ```
> npm run db:migrate -- --name familles_medias_famille
> npm run db:generate
> ```
> Préviens-moi quand c'est fait.

Attendre confirmation avant de passer à la suite. Les tâches suivantes dépendent du client Prisma régénéré.

- [ ] **Step 5 : Commit (proposé à l'utilisateur)**

Proposer :

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): ajoute table Famille et rend Media.personId nullable"
```

---

## Task 2 : Helper nom-famille (slug → libellé)

**Files:**
- Create: `src/lib/famille/nom.ts`
- Test: `src/lib/famille/nom.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/lib/famille/nom.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import { nomFamilleDepuisSlug } from './nom'

describe('nomFamilleDepuisSlug', () => {
  it('renomme arbre en Arbre principal', () => {
    expect(nomFamilleDepuisSlug('arbre')).toBe('Arbre principal')
  })

  it('formate boudon-hurgon en Boudon-Hurgon', () => {
    expect(nomFamilleDepuisSlug('boudon-hurgon')).toBe('Boudon-Hurgon')
  })

  it('formate boudon-pruniere en Boudon-Prunière', () => {
    expect(nomFamilleDepuisSlug('boudon-pruniere')).toBe('Boudon-Prunière')
  })

  it('capitalise un slug simple', () => {
    expect(nomFamilleDepuisSlug('maurin')).toBe('Maurin')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

Lancer : `npm test -- nom.test`

Attendu : `Cannot find module './nom'`.

- [ ] **Step 3 : Implémenter le helper**

Créer `src/lib/famille/nom.ts` :

```typescript
const ACCENTS: Record<string, string> = {
  pruniere: 'Prunière',
}

const SPECIAUX: Record<string, string> = {
  arbre: 'Arbre principal',
}

function capitaliser(mot: string): string {
  if (mot.length === 0) return mot
  return mot[0].toUpperCase() + mot.slice(1)
}

export function nomFamilleDepuisSlug(slug: string): string {
  if (SPECIAUX[slug]) return SPECIAUX[slug]
  return slug
    .split('-')
    .map((mot) => ACCENTS[mot] ?? capitaliser(mot))
    .join('-')
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Lancer : `npm test -- nom.test`

Attendu : 4 tests passent.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/lib/famille/nom.ts src/lib/famille/nom.test.ts
git commit -m "feat(famille): helper nomFamilleDepuisSlug"
```

---

## Task 3 : Extracteur description-famille depuis les pointers

**Files:**
- Create: `src/lib/famille/description-source.ts`
- Test: `src/lib/famille/description-source.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/lib/famille/description-source.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import { extraireDescriptionInitiale } from './description-source'

const POINTERS = [
  { text: 'Arbre BOUDON HURGON | 12 enfants | (8 Grandviala cne F.M. et 4 Mornac cne Espinasse)' },
  { text: 'Arbre BOUDON VEYLET | 3 enfants | Aldy' },
  { text: 'Arbre BOUDON PRUNIERE | 1 enfant | Veyrès' },
  { text: 'Voir arbre BOUDON / TROCELIER' },
]

describe('extraireDescriptionInitiale', () => {
  it('trouve le pointer Hurgon et formate avec retours à la ligne', () => {
    const desc = extraireDescriptionInitiale('boudon-hurgon', POINTERS)
    expect(desc).toBe(
      'Arbre BOUDON HURGON\n12 enfants\n(8 Grandviala cne F.M. et 4 Mornac cne Espinasse)',
    )
  })

  it('trouve Prunière malgré l\'absence d\'accent dans le pointer', () => {
    const desc = extraireDescriptionInitiale('boudon-pruniere', POINTERS)
    expect(desc).toContain('PRUNIERE')
  })

  it('retourne null pour un slug sans pointer', () => {
    expect(extraireDescriptionInitiale('boudon-maurin', POINTERS)).toBeNull()
  })

  it('retourne null pour la famille arbre (pas auto-référente)', () => {
    expect(extraireDescriptionInitiale('arbre', POINTERS)).toBeNull()
  })

  it('ignore les pointers de type "Voir arbre" trop courts', () => {
    expect(extraireDescriptionInitiale('boudon-trocelier', POINTERS)).toBeNull()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

Lancer : `npm test -- description-source`

Attendu : `Cannot find module './description-source'`.

- [ ] **Step 3 : Implémenter l'extracteur**

Créer `src/lib/famille/description-source.ts` :

```typescript
export type Pointer = { text: string }

const MIN_SEGMENTS = 2

function motCleDepuisSlug(slug: string): string | null {
  if (slug === 'arbre') return null
  const morceaux = slug.split('-')
  const dernier = morceaux[morceaux.length - 1]
  return dernier.toUpperCase()
}

export function extraireDescriptionInitiale(
  slug: string,
  pointers: ReadonlyArray<Pointer>,
): string | null {
  const motCle = motCleDepuisSlug(slug)
  if (!motCle) return null

  const candidat = pointers.find((p) =>
    p.text.toUpperCase().includes(motCle),
  )
  if (!candidat) return null

  const segments = candidat.text
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (segments.length < MIN_SEGMENTS) return null

  return segments.join('\n')
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Lancer : `npm test -- description-source`

Attendu : 5 tests passent.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/lib/famille/description-source.ts src/lib/famille/description-source.test.ts
git commit -m "feat(famille): extraction description initiale depuis pointers"
```

---

## Task 4 : Étendre transform-person avec familleId

**Files:**
- Modify: `src/lib/import/transform-person.ts`
- Modify: `src/lib/import/transform-person.test.ts`

- [ ] **Step 1 : Étendre la signature et ajouter le test**

Dans `src/lib/import/transform-person.test.ts`, ajouter à la fin du `describe('transformPerson', ...)` :

```typescript
  it('rattache la personne à la famille fournie', () => {
    const p = transformPerson(source(), {
      familleId: 'fam-hurgon',
      familleNom: 'Boudon-Hurgon',
    })
    expect(p.familleId).toBe('fam-hurgon')
    expect(p.branche).toBe('Boudon-Hurgon')
  })

  it('utilise les valeurs par defaut si pas de famille fournie', () => {
    const p = transformPerson(source())
    expect(p.familleId).toBeNull()
    expect(p.branche).toBe('Boudon')
  })
```

- [ ] **Step 2 : Vérifier que les tests échouent**

Lancer : `npm test -- transform-person`

Attendu : les 2 nouveaux tests échouent (`familleId` n'existe pas dans le retour).

- [ ] **Step 3 : Modifier transform-person.ts**

Remplacer le contenu de `src/lib/import/transform-person.ts` par :

```typescript
import type { Prisma } from '@prisma/client'

/** Forme d'une personne dans les JSON de `data/extracted/<slug>.json` (champs utilises). */
export interface SourcePerson {
  id: string
  shapeName: string
  multiPerson: boolean
  raw: string
  nom: string
  prenoms: string | null
  surnom: string | null
  naissance: { date: string | null; lieu: string | null } | null
  deces: { date: string | null; lieu: string | null } | null
  parrain: string | null
  marraine: string | null
  notes: string | null
}

export interface OptionsTransform {
  familleId?: string
  familleNom?: string
}

/**
 * Assemble le champ `notesImport` : texte Excel d'origine, note eventuelle,
 * et signalement des personnes regroupees dans une meme forme.
 */
export function construireNotesImport(src: SourcePerson): string {
  const lignes: string[] = ['Import Excel — feuille « Arbre »']
  lignes.push(`Texte d'origine : ${src.raw}`)
  if (src.notes) {
    lignes.push(`Note d'origine : ${src.notes}`)
  }
  if (src.multiPerson) {
    lignes.push(
      `Rectangle partagé (${src.shapeName}) : cette personne était ` +
        `regroupée avec d'autres dans le fichier d'origine — ` +
        `vérifier les liens de parenté.`,
    )
  }
  return lignes.join('\n')
}

/** Convertit une personne du fichier source en enregistrement pret pour la base. */
export function transformPerson(
  src: SourcePerson,
  options: OptionsTransform = {},
): Prisma.PersonCreateManyInput {
  return {
    id: src.id,
    nom: src.nom,
    prenoms: src.prenoms ?? '',
    surnom: src.surnom ?? null,
    sexe: 'inconnu',
    naissanceDate: src.naissance?.date ?? null,
    naissanceLieu: src.naissance?.lieu ?? null,
    decesDate: src.deces?.date ?? null,
    decesLieu: src.deces?.lieu ?? null,
    parrain: src.parrain ?? null,
    marraine: src.marraine ?? null,
    profession: null,
    recit: null,
    branche: options.familleNom ?? 'Boudon',
    vivant: false,
    ordreFratrie: 0,
    familleId: options.familleId ?? null,
    notesImport: construireNotesImport(src),
  }
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Lancer : `npm test -- transform-person`

Attendu : tous les tests (anciens + 2 nouveaux) passent.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/lib/import/transform-person.ts src/lib/import/transform-person.test.ts
git commit -m "feat(import): transformPerson accepte familleId et familleNom"
```

---

## Task 5 : Merge intelligent à l'upsert

**Files:**
- Create: `src/lib/import/merge-personne.ts`
- Test: `src/lib/import/merge-personne.test.ts`

Cette fonction prend la personne existante en base et la personne calculée par `transformPerson`, et retourne les champs à écrire (préservant les valeurs non vides).

- [ ] **Step 1 : Écrire les tests**

Créer `src/lib/import/merge-personne.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import type { Person } from '@prisma/client'
import { fusionnerPourMiseAJour } from './merge-personne'

function personne(over: Partial<Person> = {}): Person {
  return {
    id: 'arbre-1',
    nom: 'BOUDON',
    prenoms: 'Jean',
    surnom: null,
    sexe: 'inconnu',
    naissanceDate: null,
    naissanceLieu: null,
    decesDate: null,
    decesLieu: null,
    parrain: null,
    marraine: null,
    profession: null,
    recit: null,
    branche: 'Boudon',
    vivant: false,
    ordreFratrie: 0,
    racineParDefaut: false,
    notesImport: 'Texte initial',
    unionParentaleId: null,
    photoPrincipaleId: null,
    familleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

describe('fusionnerPourMiseAJour', () => {
  it('preserve les champs non vides en base', () => {
    const existante = personne({
      surnom: 'Edité par admin',
      profession: 'Tailleur',
    })
    const calculee = {
      surnom: null,
      profession: null,
      naissanceLieu: 'Rimeizenc',
    }
    const fusion = fusionnerPourMiseAJour(existante, calculee)
    expect(fusion.surnom).toBe('Edité par admin')
    expect(fusion.profession).toBe('Tailleur')
    expect(fusion.naissanceLieu).toBe('Rimeizenc')
  })

  it('regenere notesImport systematiquement', () => {
    const existante = personne({ notesImport: 'Ancien' })
    const calculee = { notesImport: 'Nouveau texte regenere' }
    const fusion = fusionnerPourMiseAJour(existante, calculee)
    expect(fusion.notesImport).toBe('Nouveau texte regenere')
  })

  it('ne touche pas aux flags admin (racineParDefaut, vivant, sexe)', () => {
    const existante = personne({
      racineParDefaut: true,
      vivant: true,
      sexe: 'homme',
    })
    const calculee = {
      sexe: 'inconnu' as const,
    }
    const fusion = fusionnerPourMiseAJour(existante, calculee)
    expect(fusion.racineParDefaut).toBeUndefined()
    expect(fusion.vivant).toBeUndefined()
    expect(fusion.sexe).toBeUndefined()
  })

  it('remplit familleId si null en base', () => {
    const existante = personne({ familleId: null })
    const fusion = fusionnerPourMiseAJour(existante, { familleId: 'fam-1' })
    expect(fusion.familleId).toBe('fam-1')
  })

  it('ne remplit pas familleId si deja rempli en base', () => {
    const existante = personne({ familleId: 'fam-deja' })
    const fusion = fusionnerPourMiseAJour(existante, { familleId: 'fam-1' })
    expect(fusion.familleId).toBeUndefined()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

Lancer : `npm test -- merge-personne`

Attendu : `Cannot find module './merge-personne'`.

- [ ] **Step 3 : Implémenter merge-personne**

Créer `src/lib/import/merge-personne.ts` :

```typescript
import type { Person, Prisma } from '@prisma/client'

const CHAMPS_TEXTE_PRESERVES = [
  'prenoms',
  'surnom',
  'naissanceDate',
  'naissanceLieu',
  'decesDate',
  'decesLieu',
  'parrain',
  'marraine',
  'profession',
  'recit',
  'branche',
] as const

type ChampPreserveValue = string | null | undefined

function estVide(v: ChampPreserveValue): boolean {
  return v === null || v === undefined || v === ''
}

/**
 * Calcule les champs à mettre à jour sur une Person existante.
 * Règles :
 * - Champs texte : remplacés uniquement si la valeur en base est vide.
 * - notesImport : toujours régénéré.
 * - familleId : rempli uniquement si null en base.
 * - Flags admin (racineParDefaut, vivant, sexe, ordreFratrie, unionParentaleId,
 *   photoPrincipaleId) : jamais touchés.
 */
export function fusionnerPourMiseAJour(
  existante: Person,
  calculee: Partial<Prisma.PersonUpdateInput>,
): Prisma.PersonUpdateInput {
  const sortie: Prisma.PersonUpdateInput = {}

  for (const champ of CHAMPS_TEXTE_PRESERVES) {
    const valeurExistante = existante[champ] as ChampPreserveValue
    const valeurCalculee = calculee[champ] as ChampPreserveValue
    if (estVide(valeurExistante) && !estVide(valeurCalculee)) {
      sortie[champ] = valeurCalculee
    }
  }

  if (calculee.notesImport !== undefined) {
    sortie.notesImport = calculee.notesImport
  }

  if (existante.familleId === null && typeof calculee.familleId === 'string') {
    sortie.familleId = calculee.familleId
  }

  return sortie
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Lancer : `npm test -- merge-personne`

Attendu : 5 tests passent.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/lib/import/merge-personne.ts src/lib/import/merge-personne.test.ts
git commit -m "feat(import): merge intelligent preservant les edits admin"
```

---

## Task 6 : Reconstruire les unions depuis les relations parent-enfant

**Files:**
- Create: `src/lib/import/construire-unions.ts`
- Test: `src/lib/import/construire-unions.test.ts`

- [ ] **Step 1 : Écrire les tests**

Créer `src/lib/import/construire-unions.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import { construireUnions, type RelationSource } from './construire-unions'

describe('construireUnions', () => {
  it('cree une union pour deux parents partageant un enfant', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
    ]
    const { unions, rattachements, orphelins } = construireUnions(relations)
    expect(unions).toHaveLength(1)
    expect(unions[0].partenaires).toEqual(['p1', 'p2'].sort())
    expect(rattachements).toEqual([{ enfantId: 'e1', unionCle: 'p1|p2' }])
    expect(orphelins).toEqual([])
  })

  it('regroupe plusieurs enfants sous la meme union de parents', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
      { type: 'parent-child', fromId: 'p1', toId: 'e2' },
      { type: 'parent-child', fromId: 'p2', toId: 'e2' },
    ]
    const { unions, rattachements } = construireUnions(relations)
    expect(unions).toHaveLength(1)
    expect(rattachements).toHaveLength(2)
    expect(rattachements.every((r) => r.unionCle === 'p1|p2')).toBe(true)
  })

  it('signale comme orphelin un enfant avec un seul parent', () => {
    const relations: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const { unions, rattachements, orphelins } = construireUnions(relations)
    expect(unions).toEqual([])
    expect(rattachements).toEqual([])
    expect(orphelins).toEqual([{ enfantId: 'e1', parentId: 'p1' }])
  })

  it('ignore les relations non parent-child', () => {
    const relations: RelationSource[] = [
      { type: 'cousin' as 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const { unions } = construireUnions(relations)
    expect(unions).toEqual([])
  })

  it('genere une cle deterministe quelle que soit l\'ordre des parents', () => {
    const r1: RelationSource[] = [
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
    ]
    const r2: RelationSource[] = [
      { type: 'parent-child', fromId: 'p1', toId: 'e1' },
      { type: 'parent-child', fromId: 'p2', toId: 'e1' },
    ]
    expect(construireUnions(r1).unions[0].cle).toBe(
      construireUnions(r2).unions[0].cle,
    )
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

Lancer : `npm test -- construire-unions`

Attendu : `Cannot find module './construire-unions'`.

- [ ] **Step 3 : Implémenter construire-unions**

Créer `src/lib/import/construire-unions.ts` :

```typescript
export interface RelationSource {
  type: 'parent-child'
  fromId: string
  toId: string
}

export interface UnionConstruite {
  cle: string
  partenaires: [string, string]
}

export interface RattachementEnfant {
  enfantId: string
  unionCle: string
}

export interface OrphelinUnParent {
  enfantId: string
  parentId: string
}

export interface ResultatConstruction {
  unions: UnionConstruite[]
  rattachements: RattachementEnfant[]
  orphelins: OrphelinUnParent[]
}

function clePaire(a: string, b: string): string {
  return [a, b].sort().join('|')
}

export function construireUnions(
  relations: ReadonlyArray<RelationSource>,
): ResultatConstruction {
  const parentsParEnfant = new Map<string, Set<string>>()

  for (const rel of relations) {
    if (rel.type !== 'parent-child') continue
    const set = parentsParEnfant.get(rel.toId) ?? new Set<string>()
    set.add(rel.fromId)
    parentsParEnfant.set(rel.toId, set)
  }

  const unionsParCle = new Map<string, UnionConstruite>()
  const rattachements: RattachementEnfant[] = []
  const orphelins: OrphelinUnParent[] = []

  for (const [enfantId, parents] of parentsParEnfant) {
    const liste = [...parents]
    if (liste.length === 1) {
      orphelins.push({ enfantId, parentId: liste[0] })
      continue
    }
    if (liste.length !== 2) {
      // Plus de 2 parents : on prend les deux premiers, on log via orphelins
      // partiels (cas marginal, hors v1).
      orphelins.push({ enfantId, parentId: liste.join(',') })
      continue
    }

    const cle = clePaire(liste[0], liste[1])
    if (!unionsParCle.has(cle)) {
      const [a, b] = [liste[0], liste[1]].sort()
      unionsParCle.set(cle, { cle, partenaires: [a, b] })
    }
    rattachements.push({ enfantId, unionCle: cle })
  }

  return {
    unions: [...unionsParCle.values()],
    rattachements,
    orphelins,
  }
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Lancer : `npm test -- construire-unions`

Attendu : 5 tests passent.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/lib/import/construire-unions.ts src/lib/import/construire-unions.test.ts
git commit -m "feat(import): reconstruction unions depuis relations parent-enfant"
```

---

## Task 7 : Helper upload-image (Vercel Blob)

**Files:**
- Create: `src/lib/import/upload-image.ts`

Ce module wrap `@vercel/blob` pour l'import : upload d'un fichier local avec clé déterministe + détection idempotence (skip si l'URL existe déjà en base).

Pas de tests unitaires (intégration BDD + Blob, couverte par le test manuel du script).

- [ ] **Step 1 : Créer le fichier**

Créer `src/lib/import/upload-image.ts` :

```typescript
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { put } from '@vercel/blob'
import { MediaType } from '@prisma/client'

const EXTENSIONS_IMAGE = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

export interface ResultatUpload {
  url: string
  contentType: string
  type: MediaType
  cleBlob: string
}

export function devinerTypeMedia(cheminFichier: string): MediaType {
  const ext = extname(cheminFichier).toLowerCase()
  if (EXTENSIONS_IMAGE.has(ext)) return 'photo'
  return 'document'
}

function devinerContentType(cheminFichier: string): string {
  const ext = extname(cheminFichier).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

export function cleBlobPourImage(slugFamille: string, cheminFichier: string): string {
  return `familles/${slugFamille}/${basename(cheminFichier)}`
}

export async function uploaderImage(
  cheminFichier: string,
  cleBlob: string,
): Promise<ResultatUpload> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN absent. Configure le token Vercel Blob avant de lancer l\'import.',
    )
  }
  const contenu = await readFile(cheminFichier)
  const contentType = devinerContentType(cheminFichier)
  const blob = await put(cleBlob, contenu, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
  })
  return {
    url: blob.url,
    contentType,
    type: devinerTypeMedia(cheminFichier),
    cleBlob,
  }
}
```


- [ ] **Step 2 : Vérifier que le fichier compile**

Lancer : `npx tsc --noEmit -p .` (ou `npm run lint`).

Attendu : pas d'erreurs TypeScript.

- [ ] **Step 3 : Commit (proposé)**

```bash
git add src/lib/import/upload-image.ts
git commit -m "feat(import): helper upload-image pour Vercel Blob"
```

---

## Task 8 : Loader famille (chargerFamilles, chargerFamilleParSlug)

**Files:**
- Create: `src/lib/famille/charger.ts`

- [ ] **Step 1 : Créer le loader**

Créer `src/lib/famille/charger.ts` :

```typescript
import { cache } from 'react'
import { prisma } from '@/lib/db'

/**
 * Charge la liste des familles avec leurs comptages. Cache de requête.
 */
export const chargerFamilles = cache(async () => {
  return prisma.famille.findMany({
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: {
      _count: {
        select: { personnes: true, medias: true },
      },
      medias: {
        where: { type: 'photo' },
        orderBy: { ordre: 'asc' },
        take: 1,
        select: { url: true, titre: true },
      },
    },
  })
})

/**
 * Charge le détail d'une famille par son slug.
 */
export async function chargerFamilleParSlug(slug: string) {
  return prisma.famille.findUnique({
    where: { slug },
    include: {
      personnes: {
        orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
        select: {
          id: true,
          nom: true,
          prenoms: true,
          surnom: true,
          naissanceDate: true,
          decesDate: true,
          photoPrincipale: { select: { url: true } },
        },
      },
      medias: {
        orderBy: { ordre: 'asc' },
      },
    },
  })
}

export type FamilleListe = Awaited<ReturnType<typeof chargerFamilles>>[number]
export type FamilleDetail = NonNullable<Awaited<ReturnType<typeof chargerFamilleParSlug>>>
```

- [ ] **Step 2 : Vérifier que le fichier compile**

Lancer : `npx tsc --noEmit -p .`

Attendu : pas d'erreurs.

- [ ] **Step 3 : Commit (proposé)**

```bash
git add src/lib/famille/charger.ts
git commit -m "feat(famille): loaders chargerFamilles et chargerFamilleParSlug"
```

---

## Task 9 : Script d'import — partie 1 (familles + personnes)

**Files:**
- Create: `scripts/import-extracted.ts`

Cette tâche pose le squelette et gère les étapes 1-3 du spec (famille upsert + personnes upsert avec merge intelligent).

- [ ] **Step 1 : Créer le squelette du script**

Créer `scripts/import-extracted.ts` :

```typescript
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient, type Prisma } from '@prisma/client'
import { transformPerson, type SourcePerson } from '../src/lib/import/transform-person'
import { fusionnerPourMiseAJour } from '../src/lib/import/merge-personne'
import { nomFamilleDepuisSlug } from '../src/lib/famille/nom'
import { extraireDescriptionInitiale } from '../src/lib/famille/description-source'

const RACINE = 'data/extracted'

interface SummaryEntry {
  name: string
  slug: string
  drawing: string
  persons: number
  unions: number
}

interface FeuilleData {
  sheet: string
  sheetSlug: string
  persons: SourcePerson[]
  pointers: Array<{ text: string; row?: number | null; col?: number | null }>
  relations: Array<{ type: string; fromId: string; toId: string }>
  images: Array<{ shapeName: string; embed: string; file: string }>
}

interface Options {
  dryRun: boolean
  slugs: string[] | null
}

function lireOptions(argv: string[]): Options {
  const dryRun = argv.includes('--dry-run')
  const familles = argv.find((a) => a.startsWith('--familles='))
  const slugs = familles ? familles.slice('--familles='.length).split(',') : null
  return { dryRun, slugs }
}

function chargerSummary(): SummaryEntry[] {
  const path = join(RACINE, '_summary.json')
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as { sheets: SummaryEntry[] }
  return raw.sheets
}

function chargerFeuille(slug: string): FeuilleData {
  const path = join(RACINE, `${slug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8')) as FeuilleData
}

const prisma = new PrismaClient()

async function main() {
  const options = lireOptions(process.argv.slice(2))
  console.log(`Import extracted — dryRun=${options.dryRun}`)

  const sheets = chargerSummary()
  const sheetsAImporter = options.slugs
    ? sheets.filter((s) => options.slugs!.includes(s.slug))
    : sheets

  const arbreJson = chargerFeuille('arbre')
  const pointersArbre = arbreJson.pointers

  for (const sheet of sheetsAImporter) {
    console.log(`\n=== ${sheet.name} (${sheet.slug}) ===`)
    const feuille = chargerFeuille(sheet.slug)

    const famille = await upsertFamille(
      sheet.slug,
      pointersArbre,
      sheetsAImporter.indexOf(sheet),
      options.dryRun,
    )

    await importerPersonnes(famille.id, famille.nom, feuille.persons, options.dryRun)
  }

  console.log('\nImport partie 1 terminé.')
}

async function upsertFamille(
  slug: string,
  pointers: Array<{ text: string }>,
  ordre: number,
  dryRun: boolean,
) {
  const existante = await prisma.famille.findUnique({ where: { slug } })
  if (existante) {
    console.log(`Famille ${slug} existante (id=${existante.id})`)
    return existante
  }
  const nom = nomFamilleDepuisSlug(slug)
  const description = extraireDescriptionInitiale(slug, pointers)
  if (dryRun) {
    console.log(`[dry-run] créerait famille ${slug} (nom=${nom})`)
    return { id: `dry-${slug}`, slug, nom, description, ordre, createdAt: new Date(), updatedAt: new Date() }
  }
  return prisma.famille.create({
    data: { slug, nom, description, ordre },
  })
}

async function importerPersonnes(
  familleId: string,
  familleNom: string,
  sources: SourcePerson[],
  dryRun: boolean,
) {
  let crees = 0
  let majs = 0
  let inchangees = 0

  for (const src of sources) {
    const data = transformPerson(src, { familleId, familleNom })
    const existante = await prisma.person.findUnique({ where: { id: src.id } })

    if (!existante) {
      if (dryRun) {
        console.log(`[dry-run] créerait ${src.id} (${src.nom} ${src.prenoms ?? ''})`)
      } else {
        await prisma.person.create({ data })
      }
      crees++
      continue
    }

    const fusion = fusionnerPourMiseAJour(existante, data)
    if (Object.keys(fusion).length === 0) {
      inchangees++
      continue
    }
    if (dryRun) {
      console.log(`[dry-run] màj ${src.id} : ${Object.keys(fusion).join(', ')}`)
    } else {
      await prisma.person.update({ where: { id: src.id }, data: fusion })
    }
    majs++
  }

  console.log(`Personnes — créées : ${crees}, mises à jour : ${majs}, inchangées : ${inchangees}`)
}

main()
  .catch((err) => {
    console.error('Echec de l\'import :', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2 : Ajouter le script npm**

Modifier `package.json`, dans la section `scripts`, remplacer :

```json
"import:arbre": "tsx scripts/import-arbre.ts"
```

par :

```json
"import:complet": "tsx scripts/import-extracted.ts"
```

- [ ] **Step 3 : Tester en dry-run**

Demander à l'utilisateur :

> Lance en dry-run (pas besoin de hotspot pour ça, lecture seule) :
> ```
> npm run import:complet -- --dry-run
> ```
> Vérifie que la sortie liste les 9 familles et indique les bonnes statistiques par feuille (X personnes créées, Y mises à jour).

Attendre confirmation. Si erreur, déboguer ensemble avant de continuer.

- [ ] **Step 4 : Commit (proposé)**

```bash
git add scripts/import-extracted.ts package.json
git commit -m "feat(import): script orchestrateur — familles et personnes"
```

---

## Task 10 : Script d'import — partie 2 (unions reconstruites)

**Files:**
- Modify: `scripts/import-extracted.ts`

- [ ] **Step 1 : Ajouter la reconstruction des unions**

Dans `scripts/import-extracted.ts`, ajouter en haut l'import :

```typescript
import { construireUnions, type RelationSource } from '../src/lib/import/construire-unions'
```

Ajouter la fonction `importerUnions` après `importerPersonnes` :

```typescript
async function importerUnions(
  slug: string,
  relations: RelationSource[],
  dryRun: boolean,
) {
  const { unions, rattachements, orphelins } = construireUnions(relations)
  if (unions.length === 0) {
    console.log(`Unions — aucune à reconstruire pour ${slug}`)
    return
  }

  const cleVersUnionId = new Map<string, string>()
  let crees = 0
  let existantes = 0

  for (const u of unions) {
    const [a, b] = u.partenaires
    // Recherche d'une union existante avec ces deux partenaires (peu importe l'ordre).
    const existante = await prisma.union.findFirst({
      where: {
        OR: [
          { partenaire1Id: a, partenaire2Id: b },
          { partenaire1Id: b, partenaire2Id: a },
        ],
      },
    })
    if (existante) {
      cleVersUnionId.set(u.cle, existante.id)
      existantes++
      continue
    }
    if (dryRun) {
      console.log(`[dry-run] créerait union ${a} × ${b}`)
      cleVersUnionId.set(u.cle, `dry-${u.cle}`)
      crees++
      continue
    }
    const creee = await prisma.union.create({
      data: { partenaire1Id: a, partenaire2Id: b, nature: 'inconnue' },
    })
    cleVersUnionId.set(u.cle, creee.id)
    crees++
  }

  let rattaches = 0
  for (const r of rattachements) {
    const unionId = cleVersUnionId.get(r.unionCle)
    if (!unionId) continue
    if (dryRun) continue
    const enfant = await prisma.person.findUnique({
      where: { id: r.enfantId },
      select: { unionParentaleId: true },
    })
    if (!enfant) continue
    if (enfant.unionParentaleId && enfant.unionParentaleId !== unionId) continue
    if (enfant.unionParentaleId === unionId) continue
    await prisma.person.update({
      where: { id: r.enfantId },
      data: { unionParentaleId: unionId },
    })
    rattaches++
  }

  console.log(
    `Unions — créées : ${crees}, existantes : ${existantes}, enfants rattachés : ${rattaches}, orphelins (1 parent) : ${orphelins.length}`,
  )
}
```

Et ajouter l'appel dans la boucle `for (const sheet of sheetsAImporter)`, après `importerPersonnes` :

```typescript
    await importerUnions(sheet.slug, feuille.relations as RelationSource[], options.dryRun)
```

- [ ] **Step 2 : Tester en dry-run**

Demander à l'utilisateur :

> Relance :
> ```
> npm run import:complet -- --dry-run
> ```
> Vérifie que les unions sont reconstruites (ex. pour `boudon-veylet` : 1 union prévue, 2 orphelins).

- [ ] **Step 3 : Commit (proposé)**

```bash
git add scripts/import-extracted.ts
git commit -m "feat(import): reconstruction des unions depuis les relations"
```

---

## Task 11 : Script d'import — partie 3 (médias famille)

**Files:**
- Modify: `scripts/import-extracted.ts`

- [ ] **Step 1 : Ajouter l'import des images**

Dans `scripts/import-extracted.ts`, ajouter en haut :

```typescript
import { existsSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { uploaderImage, cleBlobPourImage, devinerTypeMedia } from '../src/lib/import/upload-image'
```

Ajouter la fonction `importerMedias` après `importerUnions` :

```typescript
async function importerMedias(
  familleId: string,
  slug: string,
  images: Array<{ shapeName: string; file: string }>,
  dryRun: boolean,
) {
  if (images.length === 0) {
    console.log(`Médias — aucune image pour ${slug}`)
    return
  }

  // Déduplication : plusieurs shapes peuvent pointer vers le même fichier.
  const fichiersUniques = [...new Set(images.map((i) => i.file))]

  let uploaded = 0
  let skipped = 0

  for (let i = 0; i < fichiersUniques.length; i++) {
    const fichier = fichiersUniques[i]
    if (!existsSync(fichier)) {
      console.warn(`  Fichier introuvable, ignoré : ${fichier}`)
      continue
    }
    const cleBlob = cleBlobPourImage(slug, fichier)
    const urlAttendue = `https://blob.vercel-storage.com/${cleBlob}`
    // Note : l'URL réelle est retournée par put(). On cherche par cleBlob via titre stocké à l'import.
    // Pour idempotence : on cherche un Media famille avec titre = basename(fichier sans ext).
    const titre = basename(fichier, extname(fichier))

    const existant = await prisma.media.findFirst({
      where: { familleId, titre },
    })
    if (existant) {
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] uploaderait ${fichier} → ${cleBlob}`)
      uploaded++
      continue
    }

    const resultat = await uploaderImage(fichier, cleBlob)
    await prisma.media.create({
      data: {
        familleId,
        personId: null,
        type: resultat.type,
        url: resultat.url,
        titre,
        description: null,
        ordre: i,
      },
    })
    uploaded++
  }

  console.log(`Médias — uploadés : ${uploaded}, déjà en base : ${skipped}`)
}
```

Et ajouter l'appel dans la boucle, après `importerUnions` :

```typescript
    await importerMedias(famille.id, sheet.slug, feuille.images, options.dryRun)
```

- [ ] **Step 2 : Tester en dry-run**

Demander à l'utilisateur :

> Relance en dry-run :
> ```
> npm run import:complet -- --dry-run
> ```
> Vérifie : les 60 images seraient uploadées.

- [ ] **Step 3 : Test réel (hotspot 4G nécessaire)**

Demander à l'utilisateur :

> Lance pour de vrai (hotspot 4G + `BLOB_READ_WRITE_TOKEN` dans `.env`) :
> ```
> npm run import:complet
> ```
> Vérifie en BDD que les familles existent et que des médias sont créés. Relance une 2e fois pour vérifier l'idempotence (aucune création supplémentaire).

- [ ] **Step 4 : Commit (proposé)**

```bash
git add scripts/import-extracted.ts
git commit -m "feat(import): upload des images comme medias famille"
```

---

## Task 12 : Nettoyage de l'ancien script

**Files:**
- Delete: `scripts/import-arbre.ts`

- [ ] **Step 1 : Supprimer l'ancien script**

Le script `scripts/import-arbre.ts` n'a plus d'utilité (sa logique est intégrée dans `import-extracted.ts` qui traite aussi la feuille `arbre`).

```bash
rm scripts/import-arbre.ts
```

- [ ] **Step 2 : Vérifier que rien ne le référence**

Lancer : `grep -r "import-arbre" --include="*.ts" --include="*.json"`

Attendu : aucune occurrence (sauf éventuellement le `package-lock.json` qui ne nous concerne pas).

- [ ] **Step 3 : Commit (proposé)**

```bash
git rm scripts/import-arbre.ts
git commit -m "chore: supprime ancien script import-arbre remplacé par import-extracted"
```

---

## Task 13 : Refactor actions médias — invariant XOR

**Files:**
- Create: `src/app/admin/medias/actions.ts`
- Create: `src/app/admin/medias/actions.test.ts`
- Delete: `src/app/admin/personnes/[id]/medias/actions.ts`

- [ ] **Step 1 : Écrire les tests d'invariant**

Créer `src/app/admin/medias/actions.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import { validerCible, type Cible } from './actions'

describe('validerCible', () => {
  it('accepte une cible personne valide', () => {
    expect(validerCible({ type: 'personne', id: 'p1' })).toBeUndefined()
  })

  it('accepte une cible famille valide', () => {
    expect(validerCible({ type: 'famille', id: 'f1' })).toBeUndefined()
  })

  it('rejette une cible sans id', () => {
    expect(() => validerCible({ type: 'personne', id: '' } as Cible)).toThrow()
  })

  it('rejette un type inconnu', () => {
    expect(() => validerCible({ type: 'autre' as 'personne', id: 'x' })).toThrow()
  })
})
```

- [ ] **Step 2 : Vérifier l'échec**

Lancer : `npm test -- actions.test`

Attendu : `Cannot find module './actions'` (le module n'existe pas encore au bon endroit).

- [ ] **Step 3 : Créer le nouveau module actions**

Créer `src/app/admin/medias/actions.ts` :

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { MediaType } from '@prisma/client'
import { prisma } from '@/lib/db'

export type Cible =
  | { type: 'personne'; id: string }
  | { type: 'famille'; id: string }

export type EtatUpload = { erreur?: string; succesAt?: number } | null

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024

export function validerCible(cible: Cible): void {
  if (cible.type !== 'personne' && cible.type !== 'famille') {
    throw new Error(`Type de cible inconnu : ${cible.type}`)
  }
  if (!cible.id || cible.id.length === 0) {
    throw new Error('Cible sans identifiant.')
  }
}

function devinerType(fichier: File): MediaType {
  if (fichier.type.startsWith('image/')) return 'photo'
  if (fichier.type.startsWith('audio/')) return 'audio'
  return 'document'
}

function cheminPourCible(cible: Cible, nomFichier: string): string {
  const prefixe = cible.type === 'personne' ? 'personnes' : 'familles'
  return `${prefixe}/${cible.id}/${Date.now()}-${nomFichier}`
}

function pathARevalider(cible: Cible): string {
  return cible.type === 'personne'
    ? `/admin/personnes/${cible.id}`
    : `/admin/familles/${cible.id}`
}

export async function uploaderMediaAction(
  cible: Cible,
  _prev: EtatUpload,
  formData: FormData,
): Promise<EtatUpload> {
  try {
    validerCible(cible)
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Cible invalide.' }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      erreur: "BLOB_READ_WRITE_TOKEN absent. Configure le token Vercel Blob dans le projet.",
    }
  }

  const fichier = formData.get('fichier')
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: 'Aucun fichier sélectionné.' }
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    return { erreur: `Fichier trop volumineux (max 10 Mo).` }
  }

  const titre = (formData.get('titre')?.toString().trim() ?? '') || fichier.name
  const description = formData.get('description')?.toString().trim() || null
  const date = formData.get('date')?.toString().trim() || null
  const type = devinerType(fichier)
  const cheminBlob = cheminPourCible(cible, fichier.name)

  try {
    const blob = await put(cheminBlob, fichier, { access: 'public', addRandomSuffix: false })
    await prisma.media.create({
      data: {
        personId: cible.type === 'personne' ? cible.id : null,
        familleId: cible.type === 'famille' ? cible.id : null,
        type,
        url: blob.url,
        titre,
        description,
        date,
      },
    })
  } catch (e) {
    return {
      erreur: e instanceof Error ? `Échec du téléversement : ${e.message}` : 'Échec du téléversement.',
    }
  }

  revalidatePath(pathARevalider(cible))
  if (cible.type === 'personne') revalidatePath('/')
  else revalidatePath(`/familles/${cible.id}`)
  return { succesAt: Date.now() }
}

export async function supprimerMediaAction(mediaId: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id: mediaId } })
  if (!media) return

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(media.url)
    }
  } catch {
    // non bloquant
  }

  await prisma.media.delete({ where: { id: mediaId } })
  if (media.personId) revalidatePath(`/admin/personnes/${media.personId}`)
  if (media.familleId) revalidatePath(`/admin/familles/${media.familleId}`)
  revalidatePath('/')
}

export async function definirPhotoPrincipaleAction(
  personId: string,
  mediaId: string | null,
): Promise<void> {
  await prisma.person.update({
    where: { id: personId },
    data: { photoPrincipaleId: mediaId },
  })
  revalidatePath(`/admin/personnes/${personId}`)
  revalidatePath('/')
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Lancer : `npm test -- actions.test`

Attendu : 4 tests passent.

- [ ] **Step 5 : Supprimer l'ancien module**

```bash
rm src/app/admin/personnes/[id]/medias/actions.ts
```

(Le dossier `medias/` peut être supprimé aussi s'il est vide après cette suppression.)

- [ ] **Step 6 : Commit (proposé)**

```bash
git rm src/app/admin/personnes/[id]/medias/actions.ts
git add src/app/admin/medias/actions.ts src/app/admin/medias/actions.test.ts
git commit -m "refactor(medias): unifie les actions personne et famille (invariant XOR)"
```

---

## Task 14 : Refactor SectionMedias avec prop cible

**Files:**
- Modify: `src/components/admin/SectionMedias.tsx`
- Modify: `src/app/admin/personnes/[id]/page.tsx`

- [ ] **Step 1 : Lire la page actuelle de la personne**

Avant d'éditer, lire `src/app/admin/personnes/[id]/page.tsx` pour identifier où `SectionMedias` est appelé et avec quelles props.

- [ ] **Step 2 : Réécrire SectionMedias avec prop cible**

Remplacer le contenu de `src/components/admin/SectionMedias.tsx` :

```tsx
'use client'

import Image from 'next/image'
import { useActionState, useEffect, useRef, useTransition } from 'react'
import { Upload, Star, Trash2, FileText } from 'lucide-react'
import type { Media } from '@prisma/client'
import { Bouton } from '@/components/ui/Bouton'
import { Carte } from '@/components/ui/Carte'
import { ChampTexte } from '@/components/admin/champs'
import {
  uploaderMediaAction,
  supprimerMediaAction,
  definirPhotoPrincipaleAction,
  type EtatUpload,
  type Cible,
} from '@/app/admin/medias/actions'

type Props = {
  cible: Cible
  medias: Media[]
  photoPrincipaleId?: string | null
}

export function SectionMedias({ cible, medias, photoPrincipaleId = null }: Props) {
  const action = uploaderMediaAction.bind(null, cible)
  const [etat, formAction, enCours] = useActionState<EtatUpload, FormData>(action, null)
  const formulaireRef = useRef<HTMLFormElement>(null)

  const photos = medias.filter((m) => m.type === 'photo')
  const documents = medias.filter((m) => m.type === 'document')

  useEffect(() => {
    if (etat?.succesAt) {
      formulaireRef.current?.reset()
    }
  }, [etat?.succesAt])

  const labelCible = cible.type === 'personne' ? 'cette personne' : 'cette famille'

  return (
    <section className="flex flex-col gap-6 border-t border-bordure pt-8">
      <header>
        <h2 className="font-serif text-2xl text-encre">Médias</h2>
        <p className="mt-1 text-sm text-brume">
          Photos et documents rattachés à {labelCible} ({medias.length} au total).
        </p>
      </header>

      <form
        ref={formulaireRef}
        action={formAction}
        className="flex flex-col gap-4 rounded-[var(--radius-moyenne)] border border-dashed border-bordure bg-papier/50 p-5"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-encre">
          <Upload size={16} aria-hidden /> Téléverser un fichier
        </p>
        <input
          type="file"
          name="fichier"
          required
          accept="image/*,application/pdf,audio/*"
          className="block w-full text-sm text-encre file:mr-3 file:rounded-[var(--radius-douce)] file:border-0 file:bg-sauge file:px-4 file:py-2 file:font-medium file:text-craie hover:file:bg-sauge-fonce"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ChampTexte label="Titre" name="titre" hint="Optionnel" />
          <ChampTexte label="Date" name="date" hint="Format libre, optionnel" />
          <ChampTexte label="Description" name="description" hint="Optionnelle" />
        </div>

        {etat?.erreur && <p className="text-sm text-red-700">{etat.erreur}</p>}

        <div>
          <Bouton type="submit" taille="petit" disabled={enCours}>
            {enCours ? 'Téléversement…' : 'Téléverser'}
          </Bouton>
        </div>
      </form>

      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-encre">Photos ({photos.length})</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((m) => (
              <CartePhoto key={m.id} media={m} cible={cible} principale={m.id === photoPrincipaleId} />
            ))}
          </ul>
        </div>
      )}

      {documents.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-encre">Documents ({documents.length})</p>
          <ul className="flex flex-col gap-2">
            {documents.map((m) => (
              <LigneDocument key={m.id} media={m} />
            ))}
          </ul>
        </div>
      )}

      {medias.length === 0 && (
        <p className="text-sm text-brume">Aucun média pour l&apos;instant.</p>
      )}
    </section>
  )
}

function CartePhoto({
  media,
  cible,
  principale,
}: {
  media: Media
  cible: Cible
  principale: boolean
}) {
  const [enCours, demarrer] = useTransition()
  const peutDefinirPrincipale = cible.type === 'personne'

  return (
    <li>
      <Carte className={`overflow-hidden ${principale ? 'ring-2 ring-sauge' : ''}`}>
        <div className="relative aspect-square bg-papier">
          <Image
            src={media.url}
            alt={media.titre || 'Photo sans titre'}
            fill
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 50vw"
            className="object-cover"
          />
          {principale && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[var(--radius-pilule)] bg-sauge px-2 py-0.5 text-[10px] font-medium text-craie">
              <Star size={10} aria-hidden /> Principale
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 p-2.5">
          {media.titre && (
            <p className="truncate text-xs font-medium text-encre">{media.titre}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {peutDefinirPrincipale && !principale && (
              <button
                type="button"
                onClick={() =>
                  demarrer(() => definirPhotoPrincipaleAction(cible.id, media.id))
                }
                disabled={enCours}
                className="inline-flex items-center gap-1 rounded-[var(--radius-douce)] px-2 py-1 text-[11px] text-brume hover:bg-papier hover:text-encre disabled:opacity-50"
              >
                <Star size={11} aria-hidden /> Définir comme principale
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm(`Supprimer « ${media.titre} » ?`)) {
                  demarrer(() => supprimerMediaAction(media.id))
                }
              }}
              disabled={enCours}
              className="inline-flex items-center gap-1 rounded-[var(--radius-douce)] px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={11} aria-hidden /> Supprimer
            </button>
          </div>
        </div>
      </Carte>
    </li>
  )
}

function LigneDocument({ media }: { media: Media }) {
  const [enCours, demarrer] = useTransition()
  return (
    <li>
      <Carte className="flex items-center gap-3 px-4 py-3">
        <FileText size={18} aria-hidden className="text-brume shrink-0" />
        <div className="min-w-0 flex-1">
          <a
            href={media.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-medium text-encre hover:text-sauge"
          >
            {media.titre}
          </a>
          {(media.description || media.date) && (
            <p className="truncate text-xs text-brume">
              {[media.date, media.description].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Supprimer « ${media.titre} » ?`)) {
              demarrer(() => supprimerMediaAction(media.id))
            }
          }}
          disabled={enCours}
          className="inline-flex items-center gap-1 rounded-[var(--radius-douce)] px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={12} aria-hidden /> Supprimer
        </button>
      </Carte>
    </li>
  )
}
```

- [ ] **Step 3 : Mettre à jour la page personne**

Dans `src/app/admin/personnes/[id]/page.tsx`, modifier l'appel à `SectionMedias`. Remplacer :

```tsx
<SectionMedias
  personneId={personne.id}
  medias={personne.medias}
  photoPrincipaleId={personne.photoPrincipaleId}
/>
```

par :

```tsx
<SectionMedias
  cible={{ type: 'personne', id: personne.id }}
  medias={personne.medias}
  photoPrincipaleId={personne.photoPrincipaleId}
/>
```

- [ ] **Step 4 : Vérifier la compilation**

Lancer : `npx tsc --noEmit -p .`

Attendu : pas d'erreurs.

- [ ] **Step 5 : Test manuel**

Demander à l'utilisateur :

> Lance `npm run dev`, va sur `/admin/personnes/<id>` (n'importe quelle fiche), vérifie que l'upload d'une photo fonctionne toujours et que « Définir comme principale » apparaît.

- [ ] **Step 6 : Commit (proposé)**

```bash
git add src/components/admin/SectionMedias.tsx src/app/admin/personnes/[id]/page.tsx
git commit -m "refactor(admin): SectionMedias accepte une cible {type, id}"
```

---

## Task 15 : Composant CarteFamille

**Files:**
- Create: `src/components/famille/CarteFamille.tsx`

- [ ] **Step 1 : Créer la carte**

Créer `src/components/famille/CarteFamille.tsx` :

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { Users, Image as ImageIcon } from 'lucide-react'
import { Carte } from '@/components/ui/Carte'

type Props = {
  slug: string
  nom: string
  description: string | null
  nbPersonnes: number
  nbMedias: number
  vignetteUrl: string | null
  vignetteTitre: string | null
}

export function CarteFamille({
  slug,
  nom,
  description,
  nbPersonnes,
  nbMedias,
  vignetteUrl,
  vignetteTitre,
}: Props) {
  return (
    <Link href={`/familles/${slug}`} className="group">
      <Carte interactive className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[4/3] bg-papier">
          {vignetteUrl ? (
            <Image
              src={vignetteUrl}
              alt={vignetteTitre || nom}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brume">
              <ImageIcon size={40} aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h2 className="font-serif text-xl text-encre">{nom}</h2>
          {description && (
            <p className="line-clamp-3 text-sm text-brume">{description}</p>
          )}
          <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-brume">
            <span className="inline-flex items-center gap-1">
              <Users size={14} aria-hidden /> {nbPersonnes} personne{nbPersonnes > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={14} aria-hidden /> {nbMedias} média{nbMedias > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Carte>
    </Link>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

Lancer : `npx tsc --noEmit -p .`

Attendu : pas d'erreurs.

- [ ] **Step 3 : Commit (proposé)**

```bash
git add src/components/famille/CarteFamille.tsx
git commit -m "feat(famille): composant CarteFamille pour la liste publique"
```

---

## Task 16 : Page publique /familles (index)

**Files:**
- Create: `src/app/familles/page.tsx`

- [ ] **Step 1 : Créer la page index**

Créer `src/app/familles/page.tsx` :

```tsx
import type { Metadata } from 'next'
import { CarteFamille } from '@/components/famille/CarteFamille'
import { chargerFamilles } from '@/lib/famille/charger'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Familles',
  description:
    'Les neuf branches de la famille Boudon. Hurgon, Veylet, Prunière, Trocellier, Malafosse, Maurin, Gotty, Doulcier et l\'arbre principal.',
}

export default async function PageFamilles() {
  const familles = await chargerFamilles()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="font-sans text-sm uppercase tracking-[0.18em] text-brume">
          Branches
        </p>
        <h1 className="mt-3 font-serif text-3xl text-encre sm:text-4xl">
          Les neuf branches de la famille Boudon
        </h1>
        <p className="mt-4 text-base text-brume">
          Chaque famille regroupe ses personnes, ses photos et ses documents
          collectifs. Cliquez pour explorer.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {familles.map((f) => (
          <li key={f.id}>
            <CarteFamille
              slug={f.slug}
              nom={f.nom}
              description={f.description}
              nbPersonnes={f._count.personnes}
              nbMedias={f._count.medias}
              vignetteUrl={f.medias[0]?.url ?? null}
              vignetteTitre={f.medias[0]?.titre ?? null}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2 : Test manuel**

Demander à l'utilisateur :

> Lance `npm run dev` et va sur `http://localhost:3000/familles`. Vérifie que 9 cartes s'affichent.

- [ ] **Step 3 : Commit (proposé)**

```bash
git add src/app/familles/page.tsx
git commit -m "feat(public): page d'index /familles"
```

---

## Task 17 : Composant GalerieFamille + ModaleImage

**Files:**
- Create: `src/components/famille/ModaleImage.tsx`
- Create: `src/components/famille/GalerieFamille.tsx`

- [ ] **Step 1 : Lire le composant Modale existant**

Lire `src/components/ui/Modale.tsx` pour réutiliser la même API.

- [ ] **Step 2 : Créer ModaleImage**

Créer `src/components/famille/ModaleImage.tsx` :

```tsx
'use client'

import Image from 'next/image'
import type { Media } from '@prisma/client'
import { Modale } from '@/components/ui/Modale'

type Props = {
  media: Media | null
  onFermer: () => void
}

export function ModaleImage({ media, onFermer }: Props) {
  if (!media) return null
  return (
    <Modale ouverte={true} onFermer={onFermer} titre={media.titre || 'Photo'}>
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] w-full bg-papier">
          <Image
            src={media.url}
            alt={media.titre || 'Photo'}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-contain"
          />
        </div>
        {media.description && (
          <p className="text-sm text-encre">{media.description}</p>
        )}
        {media.date && (
          <p className="text-xs text-brume">Date : {media.date}</p>
        )}
      </div>
    </Modale>
  )
}
```

NOTE : si l'API du composant `Modale` diffère (props comme `open` / `onClose` au lieu de `ouverte` / `onFermer`), adapter en conséquence après lecture.

- [ ] **Step 3 : Créer GalerieFamille**

Créer `src/components/famille/GalerieFamille.tsx` :

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Media } from '@prisma/client'
import { ModaleImage } from './ModaleImage'

type Props = {
  photos: Media[]
}

export function GalerieFamille({ photos }: Props) {
  const [selection, setSelection] = useState<Media | null>(null)

  if (photos.length === 0) {
    return <p className="text-sm text-brume">Aucune photo pour l&apos;instant.</p>
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelection(m)}
              className="group relative block aspect-square w-full overflow-hidden rounded-[var(--radius-moyenne)] bg-papier focus-visible:outline-2 focus-visible:outline-sauge"
            >
              <Image
                src={m.url}
                alt={m.titre || 'Photo de famille'}
                fill
                sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      <ModaleImage media={selection} onFermer={() => setSelection(null)} />
    </>
  )
}
```

- [ ] **Step 4 : Vérifier la compilation**

Lancer : `npx tsc --noEmit -p .`

Attendu : pas d'erreurs (sinon adapter l'API de Modale).

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/components/famille/GalerieFamille.tsx src/components/famille/ModaleImage.tsx
git commit -m "feat(famille): galerie photo avec lightbox"
```

---

## Task 18 : Page publique /familles/[slug]

**Files:**
- Create: `src/app/familles/[slug]/page.tsx`

- [ ] **Step 1 : Créer la page détail**

Créer `src/app/familles/[slug]/page.tsx` :

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Users } from 'lucide-react'
import { chargerFamilleParSlug } from '@/lib/famille/charger'
import { GalerieFamille } from '@/components/famille/GalerieFamille'
import { Carte } from '@/components/ui/Carte'
import { classesBouton } from '@/components/ui/classes-bouton'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const famille = await chargerFamilleParSlug(slug)
  if (!famille) return { title: 'Famille introuvable' }
  return {
    title: famille.nom,
    description: famille.description ?? `Page de la famille ${famille.nom}.`,
  }
}

export default async function PageFamille({ params }: Props) {
  const { slug } = await params
  const famille = await chargerFamilleParSlug(slug)
  if (!famille) notFound()

  const photos = famille.medias.filter((m) => m.type === 'photo')
  const documents = famille.medias.filter((m) => m.type === 'document')
  const premierePersonne = famille.personnes[0]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <Link
          href="/familles"
          className="text-sm text-brume hover:text-encre"
        >
          ← Toutes les familles
        </Link>
        <h1 className="font-serif text-4xl text-encre">{famille.nom}</h1>
        <p className="text-sm text-brume">
          {famille.personnes.length} personnes · {photos.length} photos · {documents.length} documents
        </p>
      </header>

      {famille.description && (
        <section className="prose prose-stone max-w-none">
          {famille.description.split('\n').map((ligne, i) => (
            <p key={i} className="text-base text-encre">
              {ligne}
            </p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-encre">Photos</h2>
        <GalerieFamille photos={photos} />
      </section>

      {documents.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-encre">Documents</h2>
          <ul className="flex flex-col gap-2">
            {documents.map((m) => (
              <li key={m.id}>
                <Carte className="flex items-center gap-3 px-4 py-3">
                  <FileText size={18} aria-hidden className="text-brume shrink-0" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium text-encre hover:text-sauge"
                    >
                      {m.titre}
                    </a>
                    {m.description && (
                      <p className="truncate text-xs text-brume">{m.description}</p>
                    )}
                  </div>
                </Carte>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-encre">
          Personnes ({famille.personnes.length})
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {famille.personnes.map((p) => (
            <li key={p.id}>
              <Link
                href={`/?focus=${p.id}`}
                className="block rounded-[var(--radius-douce)] px-3 py-2 hover:bg-bordure/60"
              >
                <p className="font-medium text-encre">
                  {p.nom} {p.prenoms}
                </p>
                <p className="text-xs text-brume">
                  {p.naissanceDate ?? '?'} – {p.decesDate ?? '?'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {premierePersonne && (
        <div>
          <Link
            href={`/?focus=${premierePersonne.id}`}
            className={classesBouton('secondaire', 'moyen')}
          >
            <Users size={16} aria-hidden /> Voir dans l&apos;arbre
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Test manuel**

Demander à l'utilisateur :

> Va sur `http://localhost:3000/familles/boudon-hurgon`. Vérifie : titre, description (si amorcée), grille photo cliquable, lightbox, liste personnes.

- [ ] **Step 3 : Commit (proposé)**

```bash
git add src/app/familles/[slug]/page.tsx
git commit -m "feat(public): page detaillee /familles/[slug]"
```

---

## Task 19 : Header global Entete

**Files:**
- Create: `src/components/Entete.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1 : Vérifier la session admin existante**

Lire `src/lib/session.ts` pour identifier comment savoir si l'utilisateur est connecté côté serveur (probablement une fonction `sessionAdmin()` ou similaire).

- [ ] **Step 2 : Créer Entete**

Créer `src/components/Entete.tsx` :

```tsx
import Link from 'next/link'
import { sessionActive } from '@/lib/session'

export async function Entete() {
  const connecte = await sessionActive()

  return (
    <header className="border-b border-bordure bg-craie">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="font-serif text-lg text-encre">
          Famille Boudon
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-[var(--radius-douce)] px-3 py-1.5 text-encre hover:bg-bordure/60"
          >
            Arbre
          </Link>
          <Link
            href="/familles"
            className="rounded-[var(--radius-douce)] px-3 py-1.5 text-encre hover:bg-bordure/60"
          >
            Familles
          </Link>
          {connecte && (
            <Link
              href="/admin"
              className="rounded-[var(--radius-douce)] px-3 py-1.5 text-brume hover:bg-bordure/60 hover:text-encre"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

NOTE : si la fonction de vérification de session s'appelle autrement (ex. `getSession`, `verifierSession`), adapter l'import. La présence d'une session = lien admin visible.

- [ ] **Step 3 : Intégrer dans le layout**

Modifier `src/app/layout.tsx`, après le `<a href="#contenu">` skip-link et avant `<FournisseurRecherche>`, ajouter :

```tsx
<Entete />
```

et l'import en haut :

```tsx
import { Entete } from '@/components/Entete'
```

- [ ] **Step 4 : Test manuel**

Demander à l'utilisateur :

> Recharge `/`, vérifie que le header apparaît avec « Arbre » et « Familles ». Connecte-toi à l'admin et vérifie que « Admin » apparaît.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/components/Entete.tsx src/app/layout.tsx
git commit -m "feat(layout): header global avec liens Arbre, Familles et Admin"
```

---

## Task 20 : Admin — liste des familles

**Files:**
- Create: `src/app/admin/familles/page.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1 : Ajouter le lien dans le menu admin**

Modifier `src/app/admin/layout.tsx`, ajouter dans la liste `liens` :

```typescript
import { LayoutDashboard, Users, HeartHandshake, FolderTree } from 'lucide-react'

const liens = [
  { href: '/admin', label: 'Tableau de bord', icone: LayoutDashboard },
  { href: '/admin/personnes', label: 'Personnes', icone: Users },
  { href: '/admin/unions', label: 'Unions', icone: HeartHandshake },
  { href: '/admin/familles', label: 'Familles', icone: FolderTree },
]
```

- [ ] **Step 2 : Créer la page liste**

Créer `src/app/admin/familles/page.tsx` :

```tsx
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { prisma } from '@/lib/db'
import { Carte } from '@/components/ui/Carte'

export const dynamic = 'force-dynamic'

export default async function PageAdminFamilles() {
  const familles = await prisma.famille.findMany({
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: {
      _count: { select: { personnes: true, medias: true } },
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-encre">Familles</h1>
        <p className="mt-1 text-sm text-brume">
          Les 9 branches importées depuis l&apos;Excel. Modifie le nom, la
          description et les médias collectifs.
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {familles.map((f) => (
          <li key={f.id}>
            <Carte className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-encre">{f.nom}</p>
                <p className="truncate text-xs text-brume">
                  {f.slug} · {f._count.personnes} personnes · {f._count.medias} médias
                </p>
              </div>
              <Link
                href={`/admin/familles/${f.id}`}
                className="inline-flex items-center gap-1 rounded-[var(--radius-douce)] px-3 py-1.5 text-sm text-encre hover:bg-bordure/60"
              >
                <Pencil size={14} aria-hidden /> Modifier
              </Link>
            </Carte>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3 : Test manuel**

Demander à l'utilisateur :

> Connecte-toi à `/admin`, clique « Familles ». Vérifie que la liste affiche les 9 familles.

- [ ] **Step 4 : Commit (proposé)**

```bash
git add src/app/admin/familles/page.tsx src/app/admin/layout.tsx
git commit -m "feat(admin): liste des familles"
```

---

## Task 21 : Admin — édition d'une famille

**Files:**
- Create: `src/app/admin/familles/[id]/page.tsx`
- Create: `src/app/admin/familles/actions.ts`
- Create: `src/components/admin/FormulaireFamille.tsx`

- [ ] **Step 1 : Créer les actions**

Créer `src/app/admin/familles/actions.ts` :

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export type EtatFormulaireFamille = { erreur?: string; succes?: boolean } | null

function lireString(v: FormDataEntryValue | null): string {
  return v?.toString().trim() ?? ''
}

function lireStringOpt(v: FormDataEntryValue | null): string | null {
  const s = lireString(v)
  return s.length > 0 ? s : null
}

function lireInt(v: FormDataEntryValue | null, defaut = 0): number {
  const n = parseInt(v?.toString() ?? '', 10)
  return Number.isFinite(n) ? n : defaut
}

export async function mettreAJourFamilleAction(
  id: string,
  _prev: EtatFormulaireFamille,
  formData: FormData,
): Promise<EtatFormulaireFamille> {
  const nom = lireString(formData.get('nom'))
  if (nom.length === 0) {
    return { erreur: 'Le nom est obligatoire.' }
  }
  const description = lireStringOpt(formData.get('description'))
  const ordre = lireInt(formData.get('ordre'))

  await prisma.famille.update({
    where: { id },
    data: { nom, description, ordre },
  })

  revalidatePath('/admin/familles')
  revalidatePath(`/admin/familles/${id}`)
  revalidatePath('/familles')

  const famille = await prisma.famille.findUnique({
    where: { id },
    select: { slug: true },
  })
  if (famille) revalidatePath(`/familles/${famille.slug}`)

  return { succes: true }
}
```

- [ ] **Step 2 : Créer le formulaire**

Créer `src/components/admin/FormulaireFamille.tsx` :

```tsx
'use client'

import { useActionState } from 'react'
import type { Famille } from '@prisma/client'
import { ChampTexte, ChampNombre, ChampZoneTexte } from '@/components/admin/champs'
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
        required
      />
      <ChampZoneTexte
        label="Description"
        name="description"
        defaultValue={famille.description ?? ''}
        hint="Markdown léger : retours à la ligne respectés."
        rows={6}
      />
      <ChampNombre
        label="Ordre"
        name="ordre"
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
```

NOTE : vérifier dans `src/components/admin/champs.tsx` que les composants `ChampTexte`, `ChampNombre`, `ChampZoneTexte` existent avec ces props. Si `ChampZoneTexte` n'existe pas, créer un wrapper local minimal autour de `<textarea>` ou utiliser directement `<textarea>` avec les classes existantes.

- [ ] **Step 3 : Créer la page d'édition**

Créer `src/app/admin/familles/[id]/page.tsx` :

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FormulaireFamille } from '@/components/admin/FormulaireFamille'
import { SectionMedias } from '@/components/admin/SectionMedias'

type Props = { params: Promise<{ id: string }> }

export default async function PageAdminFamille({ params }: Props) {
  const { id } = await params
  const famille = await prisma.famille.findUnique({
    where: { id },
    include: { medias: { orderBy: { ordre: 'asc' } } },
  })
  if (!famille) notFound()

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl text-encre">{famille.nom}</h1>
        <p className="mt-1 text-sm text-brume">Édition de la famille</p>
      </header>

      <FormulaireFamille famille={famille} />

      <SectionMedias
        cible={{ type: 'famille', id: famille.id }}
        medias={famille.medias}
      />
    </div>
  )
}
```

- [ ] **Step 4 : Test manuel**

Demander à l'utilisateur :

> Va sur `/admin/familles`, ouvre `boudon-hurgon`. Modifie la description, enregistre, recharge → vérifie persistance. Téléverse une photo, retourne sur `/familles/boudon-hurgon` → vérifie qu'elle apparaît.

- [ ] **Step 5 : Commit (proposé)**

```bash
git add src/app/admin/familles/[id]/page.tsx src/app/admin/familles/actions.ts src/components/admin/FormulaireFamille.tsx
git commit -m "feat(admin): edition d'une famille (description + medias)"
```

---

## Task 22 : Carte « Familles » dans le tableau de bord admin

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1 : Ajouter le comptage et la carte**

Modifier `src/app/admin/page.tsx` :

Remplacer :

```tsx
  const [nbPersonnes, nbUnions, nbMedias] = await Promise.all([
    prisma.person.count(),
    prisma.union.count(),
    prisma.media.count(),
  ])
```

par :

```tsx
  const [nbPersonnes, nbUnions, nbMedias, nbFamilles] = await Promise.all([
    prisma.person.count(),
    prisma.union.count(),
    prisma.media.count(),
    prisma.famille.count(),
  ])
```

Et remplacer la grille de stats :

```tsx
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CarteStat label="Personnes" valeur={nbPersonnes} href="/admin/personnes" />
        <CarteStat label="Unions" valeur={nbUnions} href="/admin/unions" />
        <CarteStat label="Médias" valeur={nbMedias} href="/admin/personnes" />
      </section>
```

par :

```tsx
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CarteStat label="Personnes" valeur={nbPersonnes} href="/admin/personnes" />
        <CarteStat label="Unions" valeur={nbUnions} href="/admin/unions" />
        <CarteStat label="Familles" valeur={nbFamilles} href="/admin/familles" />
        <CarteStat label="Médias" valeur={nbMedias} href="/admin/personnes" />
      </section>
```

- [ ] **Step 2 : Test manuel**

Demander à l'utilisateur :

> Va sur `/admin`, vérifie la nouvelle carte « Familles » avec compte = 9.

- [ ] **Step 3 : Commit (proposé)**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): carte stat Familles dans le tableau de bord"
```

---

## Task 23 : Vérification finale — bilan complet

- [ ] **Step 1 : Lancer la suite de tests complète**

Demander à l'utilisateur :

> ```
> npm test
> ```
> Tous les tests doivent passer.

- [ ] **Step 2 : Lint**

> ```
> npm run lint
> ```
> Aucune erreur.

- [ ] **Step 3 : Build**

> ```
> npm run build
> ```
> Le build doit réussir.

- [ ] **Step 4 : Parcours fonctionnel**

Liste de contrôle pour l'utilisateur :

- [ ] `/` — l'arbre fonctionne toujours (regression test).
- [ ] `/familles` — 9 cartes.
- [ ] `/familles/boudon-hurgon` — galerie avec lightbox, liste personnes, lien « Voir dans l'arbre ».
- [ ] `/admin` — carte Familles visible.
- [ ] `/admin/familles` — 9 lignes.
- [ ] `/admin/familles/<id>` — édition description + upload média famille fonctionnel.
- [ ] `/admin/personnes/<id>` — médias personne fonctionnent toujours (regression).
- [ ] Re-lancer `npm run import:complet` — idempotent, aucune création supplémentaire.

- [ ] **Step 5 : Tag final (optionnel)**

Si tout passe, proposer :

```bash
git tag -a v0.2-familles -m "Étape 2 : familles, médias famille et import complet"
```
