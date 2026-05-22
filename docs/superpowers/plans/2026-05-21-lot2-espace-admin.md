# Lot 2 — Espace administrateur (gestion des données) — Plan de développement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'administrateur un espace `/admin` protégé par mot de passe pour créer, modifier et supprimer les personnes, les unions et les liens de parenté — puis le déployer sur Vercel pour qu'il soit réellement utilisable.

**Architecture:** Authentification à administrateur unique : empreinte du mot de passe en variable d'environnement (bcryptjs), session par jeton JWT signé (jose) dans un cookie httpOnly, middleware Next.js protégeant `/admin`. CRUD via Server Actions et l'ORM Prisma. Pas d'interface publique ni de médias dans ce lot.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma 6, `bcryptjs`, `jose`, Tailwind v4, Vercel.

**Référence :** met en œuvre la section §4.5 (espace administrateur) du document de conception `docs/superpowers/specs/2026-05-20-arbre-genealogique-design.md`, en s'appuyant sur le modèle de données (§5) déjà créé au Lot 1.

**Hors périmètre :** médias / Cloudflare R2 (lot dédié ultérieur), interface publique (Explorer, canvas, fiche, recherche — Lot suivant), revalidation des pages publiques. Les tests de bout en bout automatisés (Playwright) sont eux aussi reportés : le parcours critique (connexion, CRUD personnes et unions) est vérifié manuellement sur le site déployé à la Task 9.

**Contexte d'exécution important :**
- Le réseau habituel de l'administrateur **bloque le port 5432** (accès direct à la base Neon). Toutes les pages qui lisent la base sont en **rendu dynamique** (`export const dynamic = 'force-dynamic'`) : `npx next build` ne se connecte donc **jamais** à la base et fonctionne sur le réseau interne. Le site déployé sur Vercel joint Neon normalement. Tester l'admin localement (`npm run dev`) demanderait la base — l'admin se teste donc directement sur le site déployé (Task 9).
- **L'administrateur gère lui-même tous les commits et `git push`.** Les sous-agents et l'exécutant ne doivent jamais exécuter `git commit`/`git push`/`git add` : à chaque fin de tâche, fournir les commandes de commit à l'administrateur.
- Lancer le build via `npx next build` (et non `npm run build`).

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `scripts/generer-secrets-admin.ts` | Génère l'empreinte du mot de passe et le secret de session |
| `src/lib/session.ts` | Jeton de session JWT (jose) — création / vérification ; nom du cookie. Compatible Edge |
| `src/lib/mot-de-passe.ts` | Vérification du mot de passe administrateur (bcryptjs) |
| `src/lib/libelles.ts` | Libellés d'affichage d'une personne / d'une union |
| `src/middleware.ts` | Protège `/admin/*` : redirige vers `/login` sans session valide |
| `src/app/login/page.tsx` | Page de connexion |
| `src/app/login/actions.ts` | Server Action `connexion` |
| `src/app/admin/layout.tsx` | Cadre de l'espace admin (navigation, déconnexion) |
| `src/app/admin/actions.ts` | Server Action `deconnexion` |
| `src/app/admin/page.tsx` | Tableau de bord admin |
| `src/components/admin/champs.tsx` | Composants de champ de formulaire réutilisables |
| `src/app/admin/personnes/page.tsx` | Liste des personnes |
| `src/app/admin/personnes/actions.ts` | Server Actions personnes (créer / modifier / supprimer) |
| `src/components/admin/FormulairePersonne.tsx` | Formulaire de création / édition d'une personne |
| `src/app/admin/personnes/nouvelle/page.tsx` | Page « nouvelle personne » |
| `src/app/admin/personnes/[id]/page.tsx` | Page « modifier une personne » |
| `src/app/admin/unions/page.tsx` | Liste des unions |
| `src/app/admin/unions/actions.ts` | Server Actions unions |
| `src/components/admin/FormulaireUnion.tsx` | Formulaire de création / édition d'une union |
| `src/app/admin/unions/nouvelle/page.tsx` | Page « nouvelle union » |
| `src/app/admin/unions/[id]/page.tsx` | Page « modifier une union » |

---

## Task 1 : Dépendances et secrets d'administration

**Files:**
- Create: `scripts/generer-secrets-admin.ts`
- Modify: `.env`, `.env.example`

- [ ] **Step 1 : Créer la branche de travail**

Run : `git checkout -b lot2-espace-admin`

- [ ] **Step 2 : Installer les dépendances**

Run : `npm install bcryptjs jose` puis `npm install -D @types/bcryptjs`
Expected : les paquets s'ajoutent à `package.json`, aucune erreur. (En cas d'erreur Windows de chemin trop long : relancer avec `--cache C:\tmp\npm-cache`.)

- [ ] **Step 3 : Créer le script de génération des secrets**

Create `scripts/generer-secrets-admin.ts` :
```ts
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const motDePasse = process.argv[2]
if (!motDePasse) {
  console.error(
    'Usage : npx tsx scripts/generer-secrets-admin.ts "<mot de passe choisi>"',
  )
  process.exit(1)
}

const hash = bcrypt.hashSync(motDePasse, 12)
const secret = randomBytes(32).toString('base64')

console.log('Ajoute (ou remplace) ces deux lignes dans ton fichier .env :\n')
console.log(`ADMIN_PASSWORD_HASH="${hash}"`)
console.log(`AUTH_SECRET="${secret}"`)
```

- [ ] **Step 4 : Générer les secrets (action de l'administrateur)**

Demander à l'administrateur de choisir un mot de passe et de lancer :
`npx tsx scripts/generer-secrets-admin.ts "<son mot de passe>"`
puis de **coller les deux lignes affichées dans `.env`** (sans les communiquer dans la conversation).

- [ ] **Step 5 : Compléter `.env.example`**

Add to `.env.example` (à la suite du contenu existant) :
```dotenv

# Authentification de l'espace admin.
# ADMIN_PASSWORD_HASH : empreinte bcrypt du mot de passe (cf. scripts/generer-secrets-admin.ts).
# AUTH_SECRET         : secret aléatoire de signature du cookie de session.
ADMIN_PASSWORD_HASH="$2a$12$remplacer_par_une_vraie_empreinte_bcrypt"
AUTH_SECRET="remplacer_par_un_secret_aleatoire_base64"
```

- [ ] **Step 6 : Vérifier**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 7 : Commit (par l'administrateur)**

Fournir à l'administrateur :
```bash
git add scripts/generer-secrets-admin.ts .env.example package.json package-lock.json
git commit -m "chore: dependances et script de generation des secrets admin"
```

---

## Task 2 : Authentification — fonctions cœur (TDD)

Deux modules séparés : `session.ts` (jeton JWT, **compatible Edge** car utilisé par le middleware) et `mot-de-passe.ts` (bcryptjs, Node uniquement). Les séparer évite de charger bcryptjs dans le middleware Edge.

**Files:**
- Create: `src/lib/session.ts`, `src/lib/mot-de-passe.ts`
- Test: `src/lib/session.test.ts`, `src/lib/mot-de-passe.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `src/lib/session.test.ts` :
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { creerJetonSession, verifierJetonSession } from './session'

beforeAll(() => {
  process.env.AUTH_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
})

describe('jeton de session', () => {
  it('valide un jeton fraichement cree', async () => {
    const jeton = await creerJetonSession()
    expect(await verifierJetonSession(jeton)).toBe(true)
  })

  it('refuse une valeur qui n est pas un jeton', async () => {
    expect(await verifierJetonSession('pas.un.jeton')).toBe(false)
  })

  it('refuse un jeton absent', async () => {
    expect(await verifierJetonSession(undefined)).toBe(false)
  })
})
```

Create `src/lib/mot-de-passe.test.ts` :
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { verifierMotDePasse } from './mot-de-passe'

beforeAll(() => {
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('bonMotDePasse', 10)
})

describe('verifierMotDePasse', () => {
  it('accepte le bon mot de passe', async () => {
    expect(await verifierMotDePasse('bonMotDePasse')).toBe(true)
  })

  it('refuse un mauvais mot de passe', async () => {
    expect(await verifierMotDePasse('mauvais')).toBe(false)
  })
})
```

- [ ] **Step 2 : Lancer les tests et vérifier l'échec**

Run : `npm test`
Expected : ÉCHEC — imports `./session` et `./mot-de-passe` introuvables.

- [ ] **Step 3 : Écrire `src/lib/session.ts`**

```ts
import { SignJWT, jwtVerify } from 'jose'

/** Nom du cookie httpOnly portant la session administrateur. */
export const NOM_COOKIE_SESSION = 'session_admin'

function cle(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET manquant.')
  return new TextEncoder().encode(secret)
}

/** Crée un jeton de session signé, valable 30 jours. */
export async function creerJetonSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(cle())
}

/** Vrai si le jeton est présent, bien signé et non expiré. */
export async function verifierJetonSession(
  jeton: string | undefined,
): Promise<boolean> {
  if (!jeton) return false
  try {
    await jwtVerify(jeton, cle())
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 4 : Écrire `src/lib/mot-de-passe.ts`**

```ts
import bcrypt from 'bcryptjs'

/** Vrai si le mot de passe correspond à l'empreinte ADMIN_PASSWORD_HASH. */
export async function verifierMotDePasse(motDePasse: string): Promise<boolean> {
  const empreinte = process.env.ADMIN_PASSWORD_HASH
  if (!empreinte) return false
  return bcrypt.compare(motDePasse, empreinte)
}
```

- [ ] **Step 5 : Lancer les tests et vérifier le succès**

Run : `npm test`
Expected : SUCCÈS — `Tests  25 passed (25)` (20 du Lot 1 + 5 ici).

- [ ] **Step 6 : Commit (par l'administrateur)**

```bash
git add src/lib/session.ts src/lib/session.test.ts src/lib/mot-de-passe.ts src/lib/mot-de-passe.test.ts
git commit -m "feat: fonctions d'authentification (session JWT, verification du mot de passe)"
```

---

## Task 3 : Connexion et déconnexion

**Files:**
- Create: `src/app/login/actions.ts`, `src/app/login/page.tsx`, `src/app/admin/actions.ts`

- [ ] **Step 1 : Créer la Server Action de connexion**

Create `src/app/login/actions.ts` :
```ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifierMotDePasse } from '@/lib/mot-de-passe'
import { creerJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'

export async function connexion(
  _etatPrecedent: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const motDePasse = String(formData.get('motDePasse') ?? '')
  if (!(await verifierMotDePasse(motDePasse))) {
    return 'Mot de passe incorrect.'
  }
  const jeton = await creerJetonSession()
  const cookieStore = await cookies()
  cookieStore.set(NOM_COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/admin')
}
```

- [ ] **Step 2 : Créer la page de connexion**

Create `src/app/login/page.tsx` :
```tsx
'use client'

import { useActionState } from 'react'
import { connexion } from './actions'

export default function PageConnexion() {
  const [erreur, action, enCours] = useActionState(connexion, undefined)

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={action}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-bordure bg-craie p-8"
      >
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Espace administrateur
        </h1>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-encre">Mot de passe</span>
          <input
            type="password"
            name="motDePasse"
            autoFocus
            required
            className="rounded-lg border border-bordure bg-papier px-3 py-2"
          />
        </label>
        {erreur ? <p className="text-sm text-red-700">{erreur}</p> : null}
        <button
          type="submit"
          disabled={enCours}
          className="rounded-lg bg-sauge px-4 py-2 font-medium text-craie disabled:opacity-60"
        >
          {enCours ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3 : Créer la Server Action de déconnexion**

Create `src/app/admin/actions.ts` :
```ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NOM_COOKIE_SESSION } from '@/lib/session'

export async function deconnexion(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(NOM_COOKIE_SESSION)
  redirect('/login')
}
```

- [ ] **Step 4 : Vérifier**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 5 : Commit (par l'administrateur)**

```bash
git add src/app/login src/app/admin/actions.ts
git commit -m "feat: page de connexion et actions connexion/deconnexion"
```

---

## Task 4 : Middleware de protection de `/admin`

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1 : Créer le middleware**

Create `src/middleware.ts` :
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { verifierJetonSession, NOM_COOKIE_SESSION } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const jeton = request.cookies.get(NOM_COOKIE_SESSION)?.value
  if (await verifierJetonSession(jeton)) {
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

Note : le middleware n'importe que `src/lib/session.ts` (jose, compatible Edge). Il n'importe **jamais** `mot-de-passe.ts` (bcryptjs) ni `@/lib/db` (Prisma) — incompatibles avec le runtime Edge.

- [ ] **Step 2 : Vérifier la compilation**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 3 : Vérifier le build**

Run : `npx next build`
Expected : compilation réussie ; le middleware apparaît dans le récapitulatif (`ƒ Middleware`).

- [ ] **Step 4 : Commit (par l'administrateur)**

```bash
git add src/middleware.ts
git commit -m "feat: middleware de protection de l'espace admin"
```

---

## Task 5 : Socle de l'espace admin

Le cadre commun de `/admin` : barre de navigation, bouton de déconnexion, tableau de bord ; plus les composants de champ et les libellés réutilisés par les formulaires.

**Files:**
- Create: `src/lib/libelles.ts`, `src/components/admin/champs.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`

- [ ] **Step 1 : Créer les libellés d'affichage**

Create `src/lib/libelles.ts` :
```ts
import type { Person, Union } from '@prisma/client'

/** « NOM Prénoms » d'une personne (sans espace superflu). */
export function libellePersonne(
  personne: Pick<Person, 'nom' | 'prenoms'>,
): string {
  return `${personne.nom} ${personne.prenoms}`.trim()
}

/** « NOM Prénoms & NOM Prénoms » d'une union, partenaires inconnus compris. */
export function libelleUnion(
  union: Pick<Union, 'partenaire1Id' | 'partenaire2Id'>,
  personnes: Person[],
): string {
  const nom = (id: string | null) => {
    if (!id) return '?'
    const p = personnes.find((x) => x.id === id)
    return p ? libellePersonne(p) : '?'
  }
  return `${nom(union.partenaire1Id)} & ${nom(union.partenaire2Id)}`
}
```

- [ ] **Step 2 : Créer les composants de champ**

Create `src/components/admin/champs.tsx` :
```tsx
type OptionSelect = { valeur: string; libelle: string }

const styleChamp =
  'rounded-lg border border-bordure bg-craie px-3 py-2 text-encre'

export function ChampTexte({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ''} className={styleChamp} />
    </label>
  )
}

export function ChampZoneTexte({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        rows={4}
        className={styleChamp}
      />
    </label>
  )
}

export function ChampNombre({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: number | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue ?? 0}
        className={styleChamp}
      />
    </label>
  )
}

export function ChampCase({
  label,
  name,
  defaultChecked,
}: {
  label: string
  name: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className="text-sm font-medium text-encre">{label}</span>
    </label>
  )
}

export function ChampSelect({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: OptionSelect[]
  defaultValue?: string | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className={styleChamp}
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  )
}
```

- [ ] **Step 3 : Créer le cadre de l'espace admin**

Create `src/app/admin/layout.tsx` :
```tsx
import Link from 'next/link'
import { deconnexion } from './actions'

// Rendu dynamique pour tout l'espace /admin : les pages lisent la base à
// chaque requête (données toujours fraîches) et ne sont jamais pré-générées
// au build — `next build` n'a donc pas besoin de la base.
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-bordure bg-craie px-6 py-3">
        <nav className="flex items-center gap-5">
          <Link href="/admin" className="font-serif text-lg font-semibold text-encre">
            Administration
          </Link>
          <Link href="/admin/personnes" className="text-sm text-encre hover:text-sauge">
            Personnes
          </Link>
          <Link href="/admin/unions" className="text-sm text-encre hover:text-sauge">
            Unions
          </Link>
        </nav>
        <form action={deconnexion}>
          <button type="submit" className="text-sm text-brume hover:text-encre">
            Se déconnecter
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4 : Créer le tableau de bord**

Create `src/app/admin/page.tsx` :
```tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'

export default async function TableauDeBord() {
  const [nbPersonnes, nbUnions] = await Promise.all([
    prisma.person.count(),
    prisma.union.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-encre">
        Tableau de bord
      </h1>
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/personnes"
          className="rounded-2xl border border-bordure bg-craie p-6"
        >
          <div className="font-serif text-3xl text-sauge">{nbPersonnes}</div>
          <div className="text-sm text-brume">personnes</div>
        </Link>
        <Link
          href="/admin/unions"
          className="rounded-2xl border border-bordure bg-craie p-6"
        >
          <div className="font-serif text-3xl text-sauge">{nbUnions}</div>
          <div className="text-sm text-brume">unions</div>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 6 : Commit (par l'administrateur)**

```bash
git add src/lib/libelles.ts src/components/admin/champs.tsx src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat: socle de l'espace admin (cadre, tableau de bord, composants de champ)"
```

---

## Task 6 : Liste et suppression des personnes

**Files:**
- Create: `src/app/admin/personnes/page.tsx`, `src/app/admin/personnes/actions.ts`

- [ ] **Step 1 : Créer les Server Actions personnes (suppression d'abord)**

Create `src/app/admin/personnes/actions.ts` :
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma, Sexe } from '@prisma/client'
import { prisma } from '@/lib/db'

/** Lit les champs d'une personne depuis le formulaire. */
function lireChamps(formData: FormData): Prisma.PersonUncheckedCreateInput {
  const texte = (cle: string): string | null => {
    const valeur = String(formData.get(cle) ?? '').trim()
    return valeur.length > 0 ? valeur : null
  }
  return {
    nom: String(formData.get('nom') ?? '').trim(),
    prenoms: String(formData.get('prenoms') ?? '').trim(),
    surnom: texte('surnom'),
    sexe: (String(formData.get('sexe') ?? 'inconnu') as Sexe),
    naissanceDate: texte('naissanceDate'),
    naissanceLieu: texte('naissanceLieu'),
    decesDate: texte('decesDate'),
    decesLieu: texte('decesLieu'),
    parrain: texte('parrain'),
    marraine: texte('marraine'),
    profession: texte('profession'),
    recit: texte('recit'),
    branche: texte('branche'),
    vivant: formData.get('vivant') === 'on',
    ordreFratrie: Number(formData.get('ordreFratrie') ?? 0) || 0,
    notesImport: texte('notesImport'),
    unionParentaleId: texte('unionParentaleId'),
  }
}

export async function creerPersonne(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const champs = lireChamps(formData)
  if (!champs.nom) return 'Le nom est obligatoire.'
  await prisma.person.create({ data: champs })
  revalidatePath('/admin/personnes')
  redirect('/admin/personnes')
}

export async function modifierPersonne(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const id = String(formData.get('id') ?? '')
  if (!id) return 'Identifiant manquant.'
  const champs = lireChamps(formData)
  if (!champs.nom) return 'Le nom est obligatoire.'
  await prisma.person.update({ where: { id }, data: champs })
  revalidatePath('/admin/personnes')
  redirect('/admin/personnes')
}

export async function supprimerPersonne(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (id) {
    await prisma.person.delete({ where: { id } })
    revalidatePath('/admin/personnes')
  }
}
```

- [ ] **Step 2 : Créer la page liste des personnes**

Create `src/app/admin/personnes/page.tsx` :
```tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { libellePersonne } from '@/lib/libelles'
import { supprimerPersonne } from './actions'

export default async function ListePersonnes() {
  const personnes = await prisma.person.findMany({
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Personnes ({personnes.length})
        </h1>
        <Link
          href="/admin/personnes/nouvelle"
          className="rounded-lg bg-sauge px-4 py-2 text-sm font-medium text-craie"
        >
          Nouvelle personne
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-bordure rounded-2xl border border-bordure bg-craie">
        {personnes.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <Link
              href={`/admin/personnes/${p.id}`}
              className="font-medium text-encre hover:text-sauge"
            >
              {libellePersonne(p)}
              <span className="ml-2 text-sm text-brume">
                {p.naissanceDate ?? ''}
                {p.decesDate ? ` – ${p.decesDate}` : ''}
              </span>
            </Link>
            <form action={supprimerPersonne}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="text-sm text-brume hover:text-red-700">
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 4 : Commit (par l'administrateur)**

```bash
git add src/app/admin/personnes/page.tsx src/app/admin/personnes/actions.ts
git commit -m "feat: liste et suppression des personnes dans l'admin"
```

---

## Task 7 : Créer et modifier une personne

Le formulaire couvre tous les champs d'une personne, dont la **filiation** : un menu déroulant `unionParentaleId` (« enfant de quel couple ») et `ordreFratrie`.

**Files:**
- Create: `src/components/admin/FormulairePersonne.tsx`, `src/app/admin/personnes/nouvelle/page.tsx`, `src/app/admin/personnes/[id]/page.tsx`

- [ ] **Step 1 : Créer le composant formulaire**

Create `src/components/admin/FormulairePersonne.tsx` :
```tsx
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
```

- [ ] **Step 2 : Créer la page « nouvelle personne »**

Create `src/app/admin/personnes/nouvelle/page.tsx` :
```tsx
import { prisma } from '@/lib/db'
import { FormulairePersonne } from '@/components/admin/FormulairePersonne'
import { creerPersonne } from '../actions'

export default async function NouvellePersonne() {
  const [unions, personnes] = await Promise.all([
    prisma.union.findMany(),
    prisma.person.findMany({ orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Nouvelle personne
      </h1>
      <FormulairePersonne
        action={creerPersonne}
        unions={unions}
        personnes={personnes}
      />
    </div>
  )
}
```

- [ ] **Step 3 : Créer la page « modifier une personne »**

Create `src/app/admin/personnes/[id]/page.tsx` :
```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FormulairePersonne } from '@/components/admin/FormulairePersonne'
import { modifierPersonne } from '../actions'

export default async function ModifierPersonne({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [personne, unions, personnes] = await Promise.all([
    prisma.person.findUnique({ where: { id } }),
    prisma.union.findMany(),
    prisma.person.findMany({ orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] }),
  ])

  if (!personne) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Modifier une personne
      </h1>
      <FormulairePersonne
        action={modifierPersonne}
        personne={personne}
        unions={unions}
        personnes={personnes}
      />
    </div>
  )
}
```

- [ ] **Step 4 : Vérifier**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 5 : Vérifier le build**

Run : `npx next build`
Expected : compilation réussie ; les pages `/admin/…` apparaissent en rendu dynamique (`ƒ`).

- [ ] **Step 6 : Commit (par l'administrateur)**

```bash
git add src/components/admin/FormulairePersonne.tsx src/app/admin/personnes/nouvelle src/app/admin/personnes/[id]
git commit -m "feat: creation et modification d'une personne (avec filiation)"
```

---

## Task 8 : Gestion des unions

Une union relie deux partenaires (chacun optionnel : parent inconnu) ; sa `nature` et sa `causeFin` déterminent l'affichage du lien.

**Files:**
- Create: `src/app/admin/unions/actions.ts`, `src/app/admin/unions/page.tsx`, `src/components/admin/FormulaireUnion.tsx`, `src/app/admin/unions/nouvelle/page.tsx`, `src/app/admin/unions/[id]/page.tsx`

- [ ] **Step 1 : Créer les Server Actions unions**

Create `src/app/admin/unions/actions.ts` :
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma, UnionNature, UnionCauseFin } from '@prisma/client'
import { prisma } from '@/lib/db'

function lireChamps(formData: FormData): Prisma.UnionUncheckedCreateInput {
  const texte = (cle: string): string | null => {
    const valeur = String(formData.get(cle) ?? '').trim()
    return valeur.length > 0 ? valeur : null
  }
  const causeFin = texte('causeFin')
  return {
    partenaire1Id: texte('partenaire1Id'),
    partenaire2Id: texte('partenaire2Id'),
    nature: (String(formData.get('nature') ?? 'inconnue') as UnionNature),
    dateDebut: texte('dateDebut'),
    lieuDebut: texte('lieuDebut'),
    dateFin: texte('dateFin'),
    causeFin: causeFin ? (causeFin as UnionCauseFin) : null,
    notes: texte('notes'),
  }
}

export async function creerUnion(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await prisma.union.create({ data: lireChamps(formData) })
  revalidatePath('/admin/unions')
  redirect('/admin/unions')
}

export async function modifierUnion(
  _etat: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const id = String(formData.get('id') ?? '')
  if (!id) return 'Identifiant manquant.'
  await prisma.union.update({ where: { id }, data: lireChamps(formData) })
  revalidatePath('/admin/unions')
  redirect('/admin/unions')
}

export async function supprimerUnion(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (id) {
    await prisma.union.delete({ where: { id } })
    revalidatePath('/admin/unions')
  }
}
```

- [ ] **Step 2 : Créer la page liste des unions**

Create `src/app/admin/unions/page.tsx` :
```tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { libelleUnion } from '@/lib/libelles'
import { supprimerUnion } from './actions'

export default async function ListeUnions() {
  const [unions, personnes] = await Promise.all([
    prisma.union.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.person.findMany(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Unions ({unions.length})
        </h1>
        <Link
          href="/admin/unions/nouvelle"
          className="rounded-lg bg-sauge px-4 py-2 text-sm font-medium text-craie"
        >
          Nouvelle union
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-bordure rounded-2xl border border-bordure bg-craie">
        {unions.map((u) => (
          <li key={u.id} className="flex items-center justify-between px-4 py-3">
            <Link
              href={`/admin/unions/${u.id}`}
              className="font-medium text-encre hover:text-sauge"
            >
              {libelleUnion(u, personnes)}
              <span className="ml-2 text-sm text-brume">{u.nature}</span>
            </Link>
            <form action={supprimerUnion}>
              <input type="hidden" name="id" value={u.id} />
              <button type="submit" className="text-sm text-brume hover:text-red-700">
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3 : Créer le composant formulaire d'union**

Create `src/components/admin/FormulaireUnion.tsx` :
```tsx
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
```

- [ ] **Step 4 : Créer les pages « nouvelle » et « modifier » une union**

Create `src/app/admin/unions/nouvelle/page.tsx` :
```tsx
import { prisma } from '@/lib/db'
import { FormulaireUnion } from '@/components/admin/FormulaireUnion'
import { creerUnion } from '../actions'

export default async function NouvelleUnion() {
  const personnes = await prisma.person.findMany({
    orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Nouvelle union
      </h1>
      <FormulaireUnion action={creerUnion} personnes={personnes} />
    </div>
  )
}
```

Create `src/app/admin/unions/[id]/page.tsx` :
```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FormulaireUnion } from '@/components/admin/FormulaireUnion'
import { modifierUnion } from '../actions'

export default async function ModifierUnion({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [union, personnes] = await Promise.all([
    prisma.union.findUnique({ where: { id } }),
    prisma.person.findMany({ orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] }),
  ])

  if (!union) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-encre">
        Modifier une union
      </h1>
      <FormulaireUnion action={modifierUnion} union={union} personnes={personnes} />
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier**

Run : `npx tsc --noEmit`
Expected : aucune erreur.

- [ ] **Step 6 : Commit (par l'administrateur)**

```bash
git add src/app/admin/unions src/components/admin/FormulaireUnion.tsx
git commit -m "feat: gestion des unions (liste, creation, modification, suppression)"
```

---

## Task 9 : Déploiement Vercel et vérification finale

L'espace admin doit être **déployé** pour être utilisable : le réseau local de l'administrateur bloque la base, alors que Vercel la joint sans souci.

**Files:** aucun fichier de code — configuration de déploiement.

- [ ] **Step 1 : Lancer la suite de tests et le build**

Run : `npm test`
Expected : `Tests  25 passed (25)`.

Run : `npx next build`
Expected : compilation réussie ; routes `/login`, `/admin`, `/admin/personnes`, `/admin/personnes/nouvelle`, `/admin/personnes/[id]`, `/admin/unions`, `/admin/unions/nouvelle`, `/admin/unions/[id]` listées ; `ƒ Middleware` présent.

- [ ] **Step 2 : Pousser la branche et fusionner (par l'administrateur)**

Demander à l'administrateur de committer les éventuels restes, puis :
```bash
git push -u origin lot2-espace-admin
```
Fusionner `lot2-espace-admin` dans `main` (Vercel déploie depuis `main`).

- [ ] **Step 3 : Connecter le projet à Vercel (action de l'administrateur)**

Demander à l'administrateur de :
1. Créer un compte gratuit sur `https://vercel.com` (connexion avec le compte GitHub).
2. **Importer le dépôt** du projet — Vercel détecte Next.js automatiquement, aucune configuration de build à toucher.
3. Avant le premier déploiement, dans **Settings → Environment Variables**, ajouter les **quatre** variables (mêmes valeurs que le `.env` local) :
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `ADMIN_PASSWORD_HASH`
   - `AUTH_SECRET`
4. Lancer le déploiement.

- [ ] **Step 4 : Vérifier le site déployé (action de l'administrateur)**

Sur l'URL `…vercel.app` fournie par Vercel :
1. La page d'accueil affiche « 154 personnes importées ».
2. Aller sur `…/admin` → on est redirigé vers `/login`.
3. Se connecter avec le mot de passe choisi → accès au tableau de bord.
4. Créer une personne de test, la voir dans la liste, la modifier, la supprimer.
5. Créer une union de test, vérifier l'affichage, la supprimer.
6. Se déconnecter → `…/admin` redirige de nouveau vers `/login`.

- [ ] **Step 5 : Commit (par l'administrateur)**

Aucun fichier de code modifié ici. Si des ajustements de configuration ont été nécessaires, les committer avec un message `chore: …`.

---

## Critères de fin du Lot 2

- [ ] `npm test` : 25 tests au vert.
- [ ] `npx next build` réussit.
- [ ] `/admin` est inaccessible sans connexion (redirection vers `/login`).
- [ ] Connexion / déconnexion fonctionnelles avec le mot de passe administrateur.
- [ ] Création, modification, suppression de personnes — dont la déclaration de filiation (`unionParentaleId`, `ordreFratrie`).
- [ ] Création, modification, suppression d'unions.
- [ ] Le site est **déployé sur Vercel** et l'admin est utilisable en ligne.
- [ ] Branche `lot2-espace-admin` fusionnée dans `main`.

## Suite

Une fois le Lot 2 en ligne, l'administrateur peut commencer le travail de fond : corriger les fiches et **recréer les liens de parenté**. En parallèle, deux lots restent à planifier :
- **Lot Médias** — Cloudflare R2 + téléversement de photos, documents et témoignages audio.
- **Lot Site public** — vue Explorer, vue d'ensemble (canvas), fiche complète, recherche.
