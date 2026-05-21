# Lot 1 — Fondations — Plan de développement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le socle technique du site (projet Next.js, base de données, couche métier testée) et importer les 154 personnes de la feuille « Arbre » dans la base.

**Architecture:** Projet Next.js 16 (App Router, TypeScript, Tailwind v4). Base PostgreSQL hébergée sur Neon, accédée via l'ORM Prisma. La logique généalogique pure (déduction des liens, style des unions) vit dans `src/lib/genealogy/` et est testée à 100 % sans base de données. L'import est découpé en une fonction de transformation pure (testée) et un script d'exécution mince.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Prisma + PostgreSQL (Neon), Vitest, tsx.

**Référence :** ce plan met en œuvre l'Étape 1 du document de conception `docs/superpowers/specs/2026-05-20-arbre-genealogique-design.md`, sections 5 (modèle de données), 6 (architecture), 8 (import) et 11 (tests). Les vues publiques et l'espace admin font l'objet des Lots 2 et 3.

**Périmètre du Lot 1 :** scaffolding, dépendances verrouillées, schéma de base, couche métier testée, import des données. **Hors périmètre :** toute interface utilisateur réelle (Explorer, canvas, fiche, recherche, admin) — Lots 2 et 3.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `package.json` | Dépendances et scripts npm |
| `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` | Configuration de l'outillage |
| `vitest.config.ts` | Configuration des tests unitaires |
| `.env`, `.env.example` | Variables d'environnement (connexion base) |
| `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` | Racine de l'application + thème |
| `prisma/schema.prisma` | Modèle de données (Person, Union, Media, enums) |
| `prisma/migrations/` | Migrations SQL versionnées |
| `src/lib/db.ts` | Client Prisma partagé (singleton) |
| `src/lib/genealogy/union-style.ts` | Règle d'affichage du lien d'une union |
| `src/lib/genealogy/relations.ts` | Déduction des liens (parents, fratrie, conjoints, enfants) |
| `src/lib/import/transform-person.ts` | Transformation d'une personne du fichier source vers la base |
| `scripts/import-arbre.ts` | Script d'import à exécuter une fois |

---

## Task 1 : Initialiser le projet Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1 : Créer la branche de travail**

Run :
```bash
git checkout -b lot1-fondations
```

- [ ] **Step 2 : Créer le `package.json` initial**

Create `package.json` :
```json
{
  "name": "genealogie-boudon",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "import:arbre": "tsx scripts/import-arbre.ts"
  }
}
```

- [ ] **Step 3 : Installer les dépendances**

Run :
```bash
npm install next@latest react@latest react-dom@latest @prisma/client@latest
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D tailwindcss @tailwindcss/postcss postcss
npm install -D eslint eslint-config-next @eslint/eslintrc
npm install -D vitest prisma tsx
```
Expected : `node_modules/` et `package-lock.json` sont créés, aucune erreur.

- [ ] **Step 4 : Créer les fichiers de configuration**

Create `tsconfig.json` :
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts` :
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

Create `postcss.config.mjs` :
```js
const config = {
  plugins: ['@tailwindcss/postcss'],
}

export default config
```

Create `eslint.config.mjs` :
```js
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { ignores: ['.next/**', 'node_modules/**'] },
]

export default eslintConfig
```

- [ ] **Step 5 : Créer la structure `src/app/` minimale**

Create `src/app/globals.css` :
```css
@import "tailwindcss";
```

Create `src/app/layout.tsx` :
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arbre généalogique de la famille Boudon',
  description: 'Cinq siècles d’histoire familiale.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
```

Create `src/app/page.tsx` :
```tsx
export default function Home() {
  return (
    <main>
      <h1>Arbre généalogique de la famille Boudon</h1>
      <p>Site en construction.</p>
    </main>
  )
}
```

- [ ] **Step 6 : Vérifier que le projet compile**

Run : `npm run build`
Expected : la compilation se termine sans erreur (« Compiled successfully », route `/` listée).

- [ ] **Step 7 : Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs src/
git commit -m "chore: initialiser le projet Next.js (App Router, TypeScript, Tailwind)" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2 : Verrouiller les dépendances et alléger le dépôt

Le document de conception (§6, §7) impose un **lockfile versionné** pour des reconstructions identiques sur plusieurs années. Le `.gitignore` actuel ignore `package-lock.json` : il faut corriger cela. On retire aussi `data/sample.xlsx` (78 Mo) du suivi Git.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1 : Réécrire le `.gitignore`**

Replace the entire content of `.gitignore` with :
```gitignore
# dépendances
node_modules/

# build Next.js
.next/
dist/
out/
build/

# variables d'environnement (secrets — jamais versionnés)
.env
.env.local
.env.*.local

# outillage local
.claude/
.claude_cache/
.superpowers/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# tests
coverage/

# divers
.DS_Store

# fichier source Excel volumineux (conservé en local, hors du dépôt)
data/sample.xlsx
```
Note : `package-lock.json` et `.env.example` ne sont **plus** ignorés — ils doivent être versionnés.

- [ ] **Step 2 : Retirer du suivi Git les fichiers désormais ignorés**

Run :
```bash
git rm --cached data/sample.xlsx
git rm --cached --ignore-unmatch next-env.d.ts
```
Expected : `data/sample.xlsx` (et `next-env.d.ts` s'il était suivi) sont dé-indexés ; les fichiers restent présents sur le disque.

- [ ] **Step 3 : Vérifier l'état**

Run : `git status --short`
Expected : `package-lock.json` apparaît comme nouveau fichier à ajouter ; `data/sample.xlsx` apparaît comme supprimé ; `.gitignore` modifié.

- [ ] **Step 4 : Commit**

```bash
git add .gitignore package-lock.json
git add -u
git commit -m "chore: versionner le lockfile et sortir le fichier Excel du depot" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

> **Note (hors plan) :** `data/sample.xlsx` reste présent dans l'historique Git, donc le dossier `.git` reste volumineux. Un nettoyage d'historique (`git filter-repo`) est possible plus tard mais réécrit l'historique — à décider séparément avec le porteur du projet.

---

## Task 3 : Configurer Vitest

**Files:**
- Create: `vitest.config.ts`, `src/lib/sanity.test.ts`

- [ ] **Step 1 : Créer la configuration Vitest**

Create `vitest.config.ts` :
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 2 : Écrire un test de vérification**

Create `src/lib/sanity.test.ts` :
```ts
import { describe, it, expect } from 'vitest'

describe('vitest', () => {
  it('exécute les tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 3 : Lancer les tests**

Run : `npm test`
Expected : `Test Files  1 passed (1)` — `Tests  1 passed (1)`.

- [ ] **Step 4 : Commit**

```bash
git add vitest.config.ts src/lib/sanity.test.ts package.json
git commit -m "chore: configurer Vitest pour les tests unitaires" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4 : Polices et thème visuel

Met en place les polices **Fraunces** (noms) et **Hanken Grotesk** (interface) via `next/font`, et la palette du document de conception (§9 : papier crème, vert sauge, encre sombre) dans le thème Tailwind v4.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1 : Définir le thème dans `globals.css`**

Replace the entire content of `src/app/globals.css` with :
```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-hanken), system-ui, sans-serif;
  --font-serif: var(--font-fraunces), Georgia, serif;

  --color-papier: #f6f3ec;
  --color-craie: #ffffff;
  --color-encre: #2f3b36;
  --color-sauge: #2f6f5e;
  --color-brume: #8a8473;
  --color-bordure: #e7e2d4;
}

body {
  background-color: var(--color-papier);
  color: var(--color-encre);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2 : Charger les polices dans `layout.tsx`**

Replace the entire content of `src/app/layout.tsx` with :
```tsx
import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arbre généalogique de la famille Boudon',
  description: 'Cinq siècles d’histoire familiale.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3 : Utiliser le thème dans la page d'accueil**

Replace the entire content of `src/app/page.tsx` with :
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="font-serif text-4xl font-semibold text-encre">
        Arbre généalogique de la famille Boudon
      </h1>
      <p className="text-brume">Site en construction.</p>
    </main>
  )
}
```

- [ ] **Step 4 : Vérifier visuellement**

Run : `npm run dev`, puis ouvrir `http://localhost:3000`.
Expected : fond crème, titre en empattement (Fraunces) vert encre, sous-titre en Hanken Grotesk gris. Arrêter le serveur (Ctrl+C).

- [ ] **Step 5 : Commit**

```bash
git add src/app/
git commit -m "feat: polices Fraunces/Hanken Grotesk et theme visuel" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5 : Schéma Prisma et client de base de données

Crée le modèle de données du document de conception (§5) : `Person`, `Union`, `Media` et les énumérations. La filiation est portée par `Person.unionParentaleId`.

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `.env`, `.env.example`

- [ ] **Step 1 : Créer le schéma Prisma**

Create `prisma/schema.prisma` :
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Sexe {
  homme
  femme
  inconnu
}

enum UnionNature {
  mariage
  union_libre
  inconnue
}

enum UnionCauseFin {
  divorce
  deces
  separation
}

enum MediaType {
  photo
  document
  audio
}

model Person {
  id                String   @id @default(cuid())
  nom               String
  prenoms           String   @default("")
  surnom            String?
  sexe              Sexe     @default(inconnu)
  naissanceDate     String?
  naissanceLieu     String?
  decesDate         String?
  decesLieu         String?
  parrain           String?
  marraine          String?
  profession        String?
  recit             String?
  branche           String?
  vivant            Boolean  @default(false)
  ordreFratrie      Int      @default(0)
  notesImport       String?

  unionParentaleId  String?
  unionParentale    Union?   @relation("EnfantsUnion", fields: [unionParentaleId], references: [id], onDelete: SetNull)

  photoPrincipaleId String?  @unique
  photoPrincipale   Media?   @relation("PhotoPrincipale", fields: [photoPrincipaleId], references: [id], onDelete: SetNull)

  medias            Media[]  @relation("MediasPersonne")
  unionsPartenaire1 Union[]  @relation("Partenaire1")
  unionsPartenaire2 Union[]  @relation("Partenaire2")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([unionParentaleId])
  @@index([nom])
}

model Union {
  id            String         @id @default(cuid())

  partenaire1Id String?
  partenaire1   Person?        @relation("Partenaire1", fields: [partenaire1Id], references: [id], onDelete: SetNull)
  partenaire2Id String?
  partenaire2   Person?        @relation("Partenaire2", fields: [partenaire2Id], references: [id], onDelete: SetNull)

  nature        UnionNature    @default(inconnue)
  dateDebut     String?
  lieuDebut     String?
  dateFin       String?
  causeFin      UnionCauseFin?
  notes         String?

  enfants       Person[]       @relation("EnfantsUnion")

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Media {
  id          String    @id @default(cuid())

  personId    String
  person      Person    @relation("MediasPersonne", fields: [personId], references: [id], onDelete: Cascade)

  estPhotoDe  Person?   @relation("PhotoPrincipale")

  type        MediaType
  url         String
  titre       String
  description String?
  date        String?
  ordre       Int       @default(0)

  createdAt   DateTime  @default(now())

  @@index([personId])
}
```

- [ ] **Step 2 : Créer les fichiers d'environnement**

Create `.env.example` (versionné, sans secret) :
```dotenv
# Connexion à la base PostgreSQL Neon.
# DATABASE_URL : connexion « pooled » (hôte contenant "-pooler").
# DIRECT_URL   : connexion directe (sans "-pooler"), utilisée pour les migrations.
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/dbname?sslmode=require"
```

Create `.env` (local, non versionné) avec des valeurs provisoires — elles seront remplacées par les vraies chaînes Neon en Task 9 :
```dotenv
DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
```

- [ ] **Step 3 : Créer le client Prisma partagé**

Create `src/lib/db.ts` :
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 4 : Générer le client Prisma**

Run : `npm run db:generate`
Expected : « Generated Prisma Client » — le client TypeScript est disponible (types `Person`, `Union`, `Media`, namespace `Prisma`).

- [ ] **Step 5 : Vérifier la compilation TypeScript**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts .env.example
git commit -m "feat: schema Prisma (Person, Union, Media) et client de base" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6 : Règle d'affichage des liens d'union (TDD)

Implémente la règle du document de conception (§5) : `union_libre` → pointillé ; `mariage` + `divorce` → barré ; sinon → plein.

**Files:**
- Delete: `src/lib/sanity.test.ts`
- Create: `src/lib/genealogy/union-style.ts`
- Test: `src/lib/genealogy/union-style.test.ts`

- [ ] **Step 1 : Supprimer le test de vérification devenu inutile**

Run : `git rm src/lib/sanity.test.ts`

- [ ] **Step 2 : Écrire le test qui échoue**

Create `src/lib/genealogy/union-style.test.ts` :
```ts
import { describe, it, expect } from 'vitest'
import { styleLienUnion } from './union-style'

describe('styleLienUnion', () => {
  it('renvoie "pointille" pour une union libre', () => {
    expect(styleLienUnion({ nature: 'union_libre', causeFin: null })).toBe(
      'pointille',
    )
  })

  it('renvoie "barre" pour un mariage terminé par un divorce', () => {
    expect(styleLienUnion({ nature: 'mariage', causeFin: 'divorce' })).toBe(
      'barre',
    )
  })

  it('renvoie "plein" pour un mariage sans fin renseignée', () => {
    expect(styleLienUnion({ nature: 'mariage', causeFin: null })).toBe('plein')
  })

  it('renvoie "plein" pour un mariage terminé par un décès', () => {
    expect(styleLienUnion({ nature: 'mariage', causeFin: 'deces' })).toBe(
      'plein',
    )
  })

  it('renvoie "plein" pour une union de nature inconnue', () => {
    expect(styleLienUnion({ nature: 'inconnue', causeFin: null })).toBe('plein')
  })
})
```

- [ ] **Step 3 : Lancer le test et vérifier l'échec**

Run : `npm test`
Expected : ÉCHEC — `Failed to resolve import "./union-style"` (le fichier n'existe pas encore).

- [ ] **Step 4 : Écrire l'implémentation minimale**

Create `src/lib/genealogy/union-style.ts` :
```ts
import type { Union } from '@prisma/client'

export type StyleLienUnion = 'plein' | 'pointille' | 'barre'

/**
 * Détermine l'apparence du trait reliant les deux partenaires d'une union.
 * Voir le document de conception, section 5.
 */
export function styleLienUnion(
  union: Pick<Union, 'nature' | 'causeFin'>,
): StyleLienUnion {
  if (union.nature === 'union_libre') return 'pointille'
  if (union.nature === 'mariage' && union.causeFin === 'divorce') return 'barre'
  return 'plein'
}
```

- [ ] **Step 5 : Lancer le test et vérifier le succès**

Run : `npm test`
Expected : SUCCÈS — `Tests  5 passed (5)`.

- [ ] **Step 6 : Commit**

La suppression de `src/lib/sanity.test.ts` est déjà indexée par le `git rm` du Step 1.
```bash
git add src/lib/genealogy/union-style.ts src/lib/genealogy/union-style.test.ts
git commit -m "feat: regle d'affichage des liens d'union" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7 : Déduction des liens de parenté (TDD)

Implémente les fonctions pures qui déduisent parents, fratrie, conjoints et enfants à partir des seules filiations (`Person.unionParentaleId`). Utilisées plus tard par l'Explorer et l'espace admin.

**Files:**
- Create: `src/lib/genealogy/relations.ts`
- Test: `src/lib/genealogy/relations.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Create `src/lib/genealogy/relations.test.ts` :
```ts
import { describe, it, expect } from 'vitest'
import type { Person, Union } from '@prisma/client'
import {
  getParents,
  getFratrie,
  getEnfants,
  getUnionsDe,
  getConjoints,
} from './relations'

function person(over: Partial<Person> & Pick<Person, 'id'>): Person {
  return {
    nom: 'BOUDON',
    prenoms: '',
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
    branche: null,
    vivant: false,
    ordreFratrie: 0,
    notesImport: null,
    unionParentaleId: null,
    photoPrincipaleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

function union(over: Partial<Union> & Pick<Union, 'id'>): Union {
  return {
    partenaire1Id: null,
    partenaire2Id: null,
    nature: 'inconnue',
    dateDebut: null,
    lieuDebut: null,
    dateFin: null,
    causeFin: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

// Jeu d'essai : Pierre et Marie, mariés (union U1), parents d'Augustin et Louis.
const pierre = person({ id: 'pierre' })
const marie = person({ id: 'marie' })
const u1 = union({ id: 'U1', partenaire1Id: 'pierre', partenaire2Id: 'marie' })
const augustin = person({ id: 'augustin', unionParentaleId: 'U1', ordreFratrie: 1 })
const louis = person({ id: 'louis', unionParentaleId: 'U1', ordreFratrie: 0 })

const persons = [pierre, marie, augustin, louis]
const unions = [u1]

describe('getParents', () => {
  it('renvoie les deux parents d’un enfant', () => {
    expect(getParents(augustin, unions, persons).map((p) => p.id)).toEqual([
      'pierre',
      'marie',
    ])
  })

  it('renvoie un tableau vide quand la filiation est inconnue', () => {
    expect(getParents(pierre, unions, persons)).toEqual([])
  })
})

describe('getFratrie', () => {
  it('renvoie les frères et sœurs triés par ordreFratrie, sans la personne', () => {
    expect(getFratrie(augustin, persons).map((p) => p.id)).toEqual(['louis'])
  })

  it('renvoie un tableau vide sans filiation', () => {
    expect(getFratrie(pierre, persons)).toEqual([])
  })
})

describe('getEnfants', () => {
  it('renvoie les enfants d’une union triés par ordreFratrie', () => {
    expect(getEnfants(u1, persons).map((p) => p.id)).toEqual([
      'louis',
      'augustin',
    ])
  })
})

describe('getUnionsDe', () => {
  it('renvoie les unions auxquelles une personne a participé', () => {
    expect(getUnionsDe(pierre, unions).map((u) => u.id)).toEqual(['U1'])
  })
})

describe('getConjoints', () => {
  it('renvoie l’autre partenaire de chaque union', () => {
    expect(getConjoints(pierre, unions, persons).map((p) => p.id)).toEqual([
      'marie',
    ])
  })
})
```

- [ ] **Step 2 : Lancer le test et vérifier l'échec**

Run : `npm test`
Expected : ÉCHEC — `Failed to resolve import "./relations"`.

- [ ] **Step 3 : Écrire l'implémentation**

Create `src/lib/genealogy/relations.ts` :
```ts
import type { Person, Union } from '@prisma/client'

/** L'union dont la personne est issue (celle de ses parents), ou null. */
export function trouverUnionParentale(
  person: Pick<Person, 'unionParentaleId'>,
  unions: Union[],
): Union | null {
  if (!person.unionParentaleId) return null
  return unions.find((u) => u.id === person.unionParentaleId) ?? null
}

/** Les parents de la personne (0, 1 ou 2). */
export function getParents(
  person: Pick<Person, 'unionParentaleId'>,
  unions: Union[],
  persons: Person[],
): Person[] {
  const union = trouverUnionParentale(person, unions)
  if (!union) return []
  return [union.partenaire1Id, union.partenaire2Id]
    .filter((id): id is string => id !== null)
    .map((id) => persons.find((p) => p.id === id))
    .filter((p): p is Person => p !== undefined)
}

/** La fratrie : mêmes parents, triée par ordreFratrie, sans la personne elle-même. */
export function getFratrie(
  person: Pick<Person, 'id' | 'unionParentaleId'>,
  persons: Person[],
): Person[] {
  if (!person.unionParentaleId) return []
  return persons
    .filter(
      (p) =>
        p.unionParentaleId === person.unionParentaleId && p.id !== person.id,
    )
    .sort((a, b) => a.ordreFratrie - b.ordreFratrie)
}

/** Les enfants issus d'une union, triés par ordreFratrie. */
export function getEnfants(
  union: Pick<Union, 'id'>,
  persons: Person[],
): Person[] {
  return persons
    .filter((p) => p.unionParentaleId === union.id)
    .sort((a, b) => a.ordreFratrie - b.ordreFratrie)
}

/** Toutes les unions auxquelles la personne a participé. */
export function getUnionsDe(
  person: Pick<Person, 'id'>,
  unions: Union[],
): Union[] {
  return unions.filter(
    (u) => u.partenaire1Id === person.id || u.partenaire2Id === person.id,
  )
}

/** Les conjoints de la personne : l'autre partenaire de chacune de ses unions. */
export function getConjoints(
  person: Pick<Person, 'id'>,
  unions: Union[],
  persons: Person[],
): Person[] {
  return getUnionsDe(person, unions)
    .map((u) => (u.partenaire1Id === person.id ? u.partenaire2Id : u.partenaire1Id))
    .filter((id): id is string => id !== null)
    .map((id) => persons.find((p) => p.id === id))
    .filter((p): p is Person => p !== undefined)
}
```

- [ ] **Step 4 : Lancer le test et vérifier le succès**

Run : `npm test`
Expected : SUCCÈS — `Tests  12 passed (12)` (5 de Task 6 + 7 ici).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/genealogy/relations.ts src/lib/genealogy/relations.test.ts
git commit -m "feat: deduction des liens de parente (parents, fratrie, conjoints, enfants)" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8 : Transformation des personnes importées (TDD)

Implémente la fonction pure qui convertit une personne du fichier `data/arbre-persons.json` en enregistrement `Person` prêt pour la base. Voir le document de conception §8.

Règles de mapping : `sexe` → `inconnu` (absent de la source) ; `branche` → `"Boudon"` ; `vivant` → `false` ; `ordreFratrie` → `0` ; `profession`/`recit` → `null` ; les filiations restent vides (recréées manuellement). Le champ `notesImport` regroupe le texte Excel d'origine, l'éventuelle note et le signalement de regroupement.

**Files:**
- Create: `src/lib/import/transform-person.ts`
- Test: `src/lib/import/transform-person.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Create `src/lib/import/transform-person.test.ts` :
```ts
import { describe, it, expect } from 'vitest'
import {
  transformPerson,
  construireNotesImport,
  type SourcePerson,
} from './transform-person'

function source(over: Partial<SourcePerson> = {}): SourcePerson {
  return {
    id: 'arbre-49',
    shapeName: 'Rectangle 274',
    multiPerson: false,
    raw: 'BOUDON Marguerite | ° 1600 | + 01 juin 1695 / Rimeizenc',
    nom: 'BOUDON',
    prenoms: 'Marguerite',
    surnom: null,
    naissance: { date: '1600', lieu: null },
    deces: { date: '01 juin 1695', lieu: 'Rimeizenc' },
    parrain: null,
    marraine: null,
    notes: null,
    ...over,
  }
}

describe('transformPerson', () => {
  it('mappe les champs principaux', () => {
    const p = transformPerson(source())
    expect(p.id).toBe('arbre-49')
    expect(p.nom).toBe('BOUDON')
    expect(p.prenoms).toBe('Marguerite')
    expect(p.naissanceDate).toBe('1600')
    expect(p.decesDate).toBe('01 juin 1695')
    expect(p.decesLieu).toBe('Rimeizenc')
  })

  it('applique les valeurs par défaut', () => {
    const p = transformPerson(source())
    expect(p.sexe).toBe('inconnu')
    expect(p.branche).toBe('Boudon')
    expect(p.vivant).toBe(false)
    expect(p.ordreFratrie).toBe(0)
    expect(p.profession).toBeNull()
    expect(p.recit).toBeNull()
  })

  it('gère un décès absent', () => {
    const p = transformPerson(source({ deces: null }))
    expect(p.decesDate).toBeNull()
    expect(p.decesLieu).toBeNull()
  })

  it('gère des prénoms manquants', () => {
    const p = transformPerson(source({ prenoms: null }))
    expect(p.prenoms).toBe('')
  })

  it('place le texte Excel d’origine dans notesImport', () => {
    const p = transformPerson(source())
    expect(p.notesImport).toContain('BOUDON Marguerite')
  })

  it('ajoute la note d’origine dans notesImport quand elle existe', () => {
    const p = transformPerson(source({ notes: 'x BRUNET Philippe · 3 enfants' }))
    expect(p.notesImport).toContain('x BRUNET Philippe')
  })

  it('signale un rectangle partagé pour une personne multiPerson', () => {
    const p = transformPerson(
      source({ multiPerson: true, shapeName: 'Rectangle 274_4' }),
    )
    expect(p.notesImport).toContain('Rectangle 274_4')
  })
})

describe('construireNotesImport', () => {
  it('n’ajoute pas de ligne de regroupement hors multiPerson', () => {
    expect(construireNotesImport(source())).not.toContain('Rectangle partag')
  })
})
```

- [ ] **Step 2 : Lancer le test et vérifier l'échec**

Run : `npm test`
Expected : ÉCHEC — `Failed to resolve import "./transform-person"`.

- [ ] **Step 3 : Écrire l'implémentation**

Create `src/lib/import/transform-person.ts` :
```ts
import type { Prisma } from '@prisma/client'

/** Forme d'une personne dans `data/arbre-persons.json` (champs utilisés). */
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

/**
 * Assemble le champ `notesImport` : texte Excel d'origine, note éventuelle,
 * et signalement des personnes regroupées dans une même forme.
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

/** Convertit une personne du fichier source en enregistrement prêt pour la base. */
export function transformPerson(src: SourcePerson): Prisma.PersonCreateManyInput {
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
    branche: 'Boudon',
    vivant: false,
    ordreFratrie: 0,
    notesImport: construireNotesImport(src),
  }
}
```

- [ ] **Step 4 : Lancer le test et vérifier le succès**

Run : `npm test`
Expected : SUCCÈS — `Tests  20 passed (20)` (12 précédents + 8 ici).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/import/transform-person.ts src/lib/import/transform-person.test.ts
git commit -m "feat: transformation des personnes du fichier d'import" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9 : Provisionner la base Neon et migrer

Cette tâche comporte une **action manuelle du porteur du projet** (création du compte Neon). L'exécutant doit s'arrêter et la lui demander.

**Files:**
- Modify: `.env`
- Create: `prisma/migrations/`

- [ ] **Step 1 : Créer le projet Neon (action du porteur du projet)**

Demander au porteur du projet de :
1. Créer un compte gratuit sur `https://neon.tech`.
2. Créer un projet (région **Europe**, ex. `eu-central-1`, pour la latence).
3. Dans le tableau de bord, ouvrir **Connection Details** et copier deux chaînes :
   - la connexion **« Pooled connection »** (l'hôte contient `-pooler`) → pour `DATABASE_URL` ;
   - la connexion **directe** (décocher « Pooled connection » ; hôte sans `-pooler`) → pour `DIRECT_URL`.
4. Communiquer ces deux chaînes.

- [ ] **Step 2 : Renseigner le fichier `.env`**

Replace the content of `.env` with the real values :
```dotenv
DATABASE_URL="<chaîne pooled fournie par le porteur du projet>"
DIRECT_URL="<chaîne directe fournie par le porteur du projet>"
```
Vérifier que chaque URL se termine par `?sslmode=require`.

- [ ] **Step 3 : Créer et appliquer la migration initiale**

Run : `npm run db:migrate -- --name init`
Expected : un dossier `prisma/migrations/<horodatage>_init/` est créé avec `migration.sql` ; message « Your database is now in sync with your schema » ; « Generated Prisma Client ».

- [ ] **Step 4 : Vérifier l'état de la base**

Run : `npx prisma migrate status`
Expected : « Database schema is up to date! ».

- [ ] **Step 5 : Commit**

```bash
git add prisma/migrations/
git commit -m "feat: migration initiale de la base de donnees" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
Note : `.env` n'est pas versionné (secrets) ; seul `prisma/migrations/` l'est.

---

## Task 10 : Script d'import et exécution

Crée le script d'import, l'exécute une fois, et vérifie que les 154 personnes sont en base. Le script est **idempotent** (`upsert` par identifiant source) : le relancer ne crée pas de doublons.

**Files:**
- Create: `scripts/import-arbre.ts`

- [ ] **Step 1 : Écrire le script d'import**

Create `scripts/import-arbre.ts` :
```ts
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import {
  transformPerson,
  type SourcePerson,
} from '../src/lib/import/transform-person'

const prisma = new PrismaClient()

interface SourceFile {
  persons: SourcePerson[]
}

async function main() {
  const contenu = readFileSync('data/arbre-persons.json', 'utf-8')
  const data = JSON.parse(contenu) as SourceFile

  console.log(`${data.persons.length} personnes lues dans le fichier source.`)

  let traitees = 0
  for (const src of data.persons) {
    const row = transformPerson(src)
    await prisma.person.upsert({
      where: { id: row.id! },
      create: row,
      update: row,
    })
    traitees += 1
  }

  const total = await prisma.person.count()
  console.log(`Import terminé : ${traitees} personnes traitées.`)
  console.log(`Total en base : ${total} personnes.`)

  const exemple = await prisma.person.findUnique({ where: { id: 'arbre-49' } })
  console.log(
    `Exemple — arbre-49 : ${exemple?.nom} ${exemple?.prenoms} ` +
      `(notesImport ${exemple?.notesImport ? 'présent' : 'absent'})`,
  )
}

main()
  .catch((erreur) => {
    console.error('Echec de l’import :', erreur)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2 : Exécuter l'import**

Run : `npm run import:arbre`
Expected :
```
154 personnes lues dans le fichier source.
Import terminé : 154 personnes traitées.
Total en base : 154 personnes.
Exemple — arbre-49 : BOUDON Marguerite (notesImport présent)
```

- [ ] **Step 3 : Vérifier l'idempotence**

Run : `npm run import:arbre` (une seconde fois)
Expected : à nouveau `Total en base : 154 personnes.` (aucun doublon).

- [ ] **Step 4 : Commit**

```bash
git add scripts/import-arbre.ts
git commit -m "feat: script d'import des 154 personnes de la feuille Arbre" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11 : Page de vérification et build final

Remplace la page d'accueil provisoire par une page qui lit le nombre de personnes en base — preuve que toute la chaîne (Next.js → Prisma → Neon → données) fonctionne. Cette page sera retravaillée au Lot 3.

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1 : Mettre à jour la page d'accueil**

Replace the entire content of `src/app/page.tsx` with :
```tsx
import { prisma } from '@/lib/db'

export default async function Home() {
  const total = await prisma.person.count()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="font-serif text-4xl font-semibold text-encre">
        Arbre généalogique de la famille Boudon
      </h1>
      <p className="text-brume">
        {total} personnes importées depuis les archives familiales.
      </p>
      <p className="text-sm text-brume">Fondations en place — Lot 1 terminé.</p>
    </main>
  )
}
```

- [ ] **Step 2 : Vérifier visuellement**

Run : `npm run dev`, puis ouvrir `http://localhost:3000`.
Expected : la page affiche « 154 personnes importées depuis les archives familiales. ». Arrêter le serveur (Ctrl+C).

- [ ] **Step 3 : Vérifier le build de production**

Run : `npm run build`
Expected : compilation réussie, aucune erreur.

- [ ] **Step 4 : Lancer toute la suite de tests**

Run : `npm test`
Expected : `Tests  20 passed (20)`.

- [ ] **Step 5 : Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: page de verification affichant le nombre de personnes" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Critères de fin du Lot 1

- [ ] Le projet Next.js compile (`npm run build`) et démarre (`npm run dev`).
- [ ] `npm test` : 20 tests au vert.
- [ ] La base Neon contient les 154 personnes de la feuille « Arbre ».
- [ ] Le lockfile et les migrations sont versionnés ; `data/sample.xlsx` ne l'est plus.
- [ ] La page d'accueil affiche « 154 personnes importées ».
- [ ] Branche `lot1-fondations` prête à être relue puis fusionnée.

## Suite

Une fois le Lot 1 fusionné, le **Lot 2 — Espace administrateur** (authentification, CRUD personnes/unions/filiations, téléversement de médias sur Cloudflare R2) fera l'objet d'un plan dédié, suivi du **Lot 3 — Site public** (Explorer, vue d'ensemble, fiche, recherche, pré-rendu).
