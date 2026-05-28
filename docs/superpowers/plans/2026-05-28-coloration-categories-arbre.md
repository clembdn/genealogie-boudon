# Coloration des cartes par catégorie de parenté — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colorer chaque carte de l'arbre généalogique en fonction du lien de parenté entre la personne et le « De cujus » (la personne `racineParDefaut`), avec une légende interactive flottante.

**Architecture:** Calcul à la volée côté serveur dans `src/app/page.tsx`, fonction pure dans `src/lib/genealogy/categorisation.ts`, propagée jusqu'à `CartePersonne` via `DonneesNoeudPersonne`. Aucune migration de base. Légende = composant client avec persistance `localStorage`.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma 6, `@xyflow/react`, Tailwind 4, Vitest, lucide-react.

**Spec source:** `docs/superpowers/specs/2026-05-28-coloration-categories-arbre-design.md`

---

## Carte des fichiers

**Nouveaux :**
- `src/lib/genealogy/categories.ts` — enum, libellés, couleurs, ordre d'affichage.
- `src/lib/genealogy/categorisation.ts` — fonction pure `categoriserDepuisDeCujus`.
- `src/lib/genealogy/categorisation.test.ts` — tests Vitest sur fixtures d'arbres.
- `src/components/arbre/LegendeCategories.tsx` — overlay flottant client.

**Modifiés :**
- `src/lib/arbre/layout.ts` — ajout `categorie` dans `DonneesNoeudPersonne`, signature de `calculerLayoutArbre`.
- `src/components/arbre/NoeudPersonne.tsx` — propage `data.categorie`.
- `src/components/arbre/VueArbre.tsx` — accepte `categorieParPersonneId`, monte la légende, colore minimap.
- `src/components/personne/CartePersonne.tsx` — prop `categorie`, bande latérale.
- `src/app/page.tsx` — calcule la map et la passe à `VueArbre`.

---

## Task 1 — Module catégories (enum + libellés + couleurs)

**Files:**
- Create: `src/lib/genealogy/categories.ts`

- [ ] **Step 1: Créer le fichier `categories.ts` avec l'enum et les tables**

```ts
export const CATEGORIES_PARENTE = [
  'LIGNE_DIRECTE',
  'COUSIN_GERMAIN',
  'COUSIN_DEMI_GERMAIN',
  'COUSIN_ISSU_DE_GERMAIN',
  'PETIT_COUSIN',
  'ARRIERE_PETIT_COUSIN',
  'CONTACT_LIGNE',
  'NEUTRE',
] as const

export type CategorieParente = (typeof CATEGORIES_PARENTE)[number]

export const LIBELLES_CATEGORIE: Record<CategorieParente, string> = {
  LIGNE_DIRECTE: 'Ligne directe',
  COUSIN_GERMAIN: 'Cousin germain',
  COUSIN_DEMI_GERMAIN: 'Cousin demi-germain',
  COUSIN_ISSU_DE_GERMAIN: 'Cousin issu de germain',
  PETIT_COUSIN: 'Petit-cousin',
  ARRIERE_PETIT_COUSIN: 'Arrière-petit-cousin',
  CONTACT_LIGNE: 'Conjoint de la ligne directe',
  NEUTRE: 'Autre / non rattaché',
}

export const COULEURS_CATEGORIE: Record<CategorieParente, string | null> = {
  LIGNE_DIRECTE: '#FFE600',
  COUSIN_GERMAIN: '#6E3A07',
  COUSIN_DEMI_GERMAIN: '#B45F06',
  COUSIN_ISSU_DE_GERMAIN: '#E67E22',
  PETIT_COUSIN: '#F39C12',
  ARRIERE_PETIT_COUSIN: '#F1C40F',
  CONTACT_LIGNE: '#FFADAD',
  NEUTRE: null,
}

/** Ordre d'affichage dans la légende (ligne directe en premier, neutre en dernier). */
export const ORDRE_AFFICHAGE_LEGENDE: readonly CategorieParente[] = [
  'LIGNE_DIRECTE',
  'CONTACT_LIGNE',
  'COUSIN_GERMAIN',
  'COUSIN_DEMI_GERMAIN',
  'COUSIN_ISSU_DE_GERMAIN',
  'PETIT_COUSIN',
  'ARRIERE_PETIT_COUSIN',
  'NEUTRE',
]
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreur sur `categories.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/genealogy/categories.ts
git commit -m "feat(genealogie): enum et palette des categories de parente"
```

---

## Task 2 — Fonction de catégorisation (TDD)

**Files:**
- Create: `src/lib/genealogy/categorisation.test.ts`
- Create: `src/lib/genealogy/categorisation.ts`

- [ ] **Step 1: Écrire le test (rouge)**

```ts
import { describe, it, expect } from 'vitest'
import type { Person, Union } from '@prisma/client'
import { categoriserDepuisDeCujus } from './categorisation'

// Helpers de fixture --------------------------------------------------

function personne(id: string, unionParentaleId: string | null = null): Person {
  return {
    id,
    nom: id,
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
    racineParDefaut: false,
    notesImport: null,
    unionParentaleId,
    familleId: null,
    photoPrincipaleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Person
}

function union(id: string, p1: string | null, p2: string | null): Union {
  return {
    id,
    partenaire1Id: p1,
    partenaire2Id: p2,
    nature: 'inconnue',
    dateDebut: null,
    lieuDebut: null,
    dateFin: null,
    causeFin: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Union
}

// Cas 1 : ligne directe ----------------------------------------------

describe('categoriserDepuisDeCujus — ligne directe', () => {
  it('classe le De cujus, ses parents, grands-parents, enfants et petits-enfants en LIGNE_DIRECTE', () => {
    // GP_A + GP_B -> Pere ; Mere ; Pere + Mere -> Moi ; Moi + Conj -> Fils ; Fils -> PetitFils
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('mere'),
      personne('moi', 'u-parents'),
      personne('conj'),
      personne('fils', 'u-moi'),
      personne('petitFils', 'u-fils'),
      personne('conjFils'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-moi', 'moi', 'conj'),
      union('u-fils', 'fils', 'conjFils'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('moi')).toBe('LIGNE_DIRECTE')
    expect(res.get('pere')).toBe('LIGNE_DIRECTE')
    expect(res.get('mere')).toBe('LIGNE_DIRECTE')
    expect(res.get('gpA')).toBe('LIGNE_DIRECTE')
    expect(res.get('gpB')).toBe('LIGNE_DIRECTE')
    expect(res.get('fils')).toBe('LIGNE_DIRECTE')
    expect(res.get('petitFils')).toBe('LIGNE_DIRECTE')
  })
})

// Cas 2 : conjoint de ligne directe ----------------------------------

describe('categoriserDepuisDeCujus — contact ligne', () => {
  it('classe les conjoints de personnes en ligne directe en CONTACT_LIGNE', () => {
    const personnes: Person[] = [
      personne('moi'),
      personne('conj'),
      personne('fils', 'u-moi'),
      personne('belleFille'),
    ]
    const unions: Union[] = [
      union('u-moi', 'moi', 'conj'),
      union('u-fils', 'fils', 'belleFille'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('conj')).toBe('CONTACT_LIGNE')
    expect(res.get('belleFille')).toBe('CONTACT_LIGNE')
  })
})

// Cas 3 : cousin germain ---------------------------------------------

describe('categoriserDepuisDeCujus — cousin germain', () => {
  it('classe l enfant d un oncle (frère du père, partage les 2 GP) en COUSIN_GERMAIN', () => {
    // GP_A + GP_B -> Pere, Oncle ; Pere + Mere -> Moi ; Oncle + Tante -> Cousin
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('tante'),
      personne('moi', 'u-parents'),
      personne('cousin', 'u-oncle'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-oncle', 'oncle', 'tante'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('cousin')).toBe('COUSIN_GERMAIN')
  })
})

// Cas 4 : cousin demi-germain ----------------------------------------

describe('categoriserDepuisDeCujus — cousin demi-germain', () => {
  it('classe l enfant d un demi-frère du père (1 seul GP partagé) en COUSIN_DEMI_GERMAIN', () => {
    // GP_A + GP_B -> Pere ; GP_A + GP_C -> DemiOncle (demi-frère du père) ; Pere + Mere -> Moi ; DemiOncle + X -> DemiCousin
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('gpC'),
      personne('pere', 'u-gpAB'),
      personne('demiOncle', 'u-gpAC'),
      personne('mere'),
      personne('autre'),
      personne('moi', 'u-parents'),
      personne('demiCousin', 'u-demiOncle'),
    ]
    const unions: Union[] = [
      union('u-gpAB', 'gpA', 'gpB'),
      union('u-gpAC', 'gpA', 'gpC'),
      union('u-parents', 'pere', 'mere'),
      union('u-demiOncle', 'demiOncle', 'autre'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('demiCousin')).toBe('COUSIN_DEMI_GERMAIN')
  })
})

// Cas 5 : cousin issu de germain --------------------------------------

describe('categoriserDepuisDeCujus — cousin issu de germain', () => {
  it('classe une personne partageant un arrière-grand-parent en COUSIN_ISSU_DE_GERMAIN', () => {
    // AGP_A + AGP_B -> GP_pere, GP_oncle ; GP_pere + X -> Pere ; GP_oncle + Y -> CousinPere ; CousinPere + Z -> Issu ; Pere + Mere -> Moi
    const personnes: Person[] = [
      personne('agpA'),
      personne('agpB'),
      personne('gpPere', 'u-agp'),
      personne('gpOncle', 'u-agp'),
      personne('x'),
      personne('y'),
      personne('pere', 'u-gpPere'),
      personne('cousinPere', 'u-gpOncle'),
      personne('mere'),
      personne('z'),
      personne('moi', 'u-parents'),
      personne('issu', 'u-cousinPere'),
    ]
    const unions: Union[] = [
      union('u-agp', 'agpA', 'agpB'),
      union('u-gpPere', 'gpPere', 'x'),
      union('u-gpOncle', 'gpOncle', 'y'),
      union('u-parents', 'pere', 'mere'),
      union('u-cousinPere', 'cousinPere', 'z'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('issu')).toBe('COUSIN_ISSU_DE_GERMAIN')
  })
})

// Cas 6 : petit-cousin et arrière-petit-cousin -----------------------

describe('categoriserDepuisDeCujus — petit-cousin', () => {
  it('classe l enfant d un cousin germain en PETIT_COUSIN et son enfant en ARRIERE_PETIT_COUSIN', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('tante'),
      personne('moi', 'u-parents'),
      personne('cousin', 'u-oncle'),
      personne('cousinConj'),
      personne('petitCousin', 'u-cousin'),
      personne('petitCousinConj'),
      personne('arrierePetitCousin', 'u-petitCousin'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-oncle', 'oncle', 'tante'),
      union('u-cousin', 'cousin', 'cousinConj'),
      union('u-petitCousin', 'petitCousin', 'petitCousinConj'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('petitCousin')).toBe('PETIT_COUSIN')
    expect(res.get('arrierePetitCousin')).toBe('ARRIERE_PETIT_COUSIN')
  })
})

// Cas 7 : conjoint d'un cousin n'est PAS CONTACT_LIGNE ---------------

describe('categoriserDepuisDeCujus — conjoint de cousin', () => {
  it('classe le conjoint d un cousin germain en NEUTRE', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('tante'),
      personne('moi', 'u-parents'),
      personne('cousin', 'u-oncle'),
      personne('cousinConj'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
      union('u-oncle', 'oncle', 'tante'),
      union('u-cousin', 'cousin', 'cousinConj'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('cousinConj')).toBe('NEUTRE')
  })
})

// Cas 8 : pas de De cujus --------------------------------------------

describe('categoriserDepuisDeCujus — pas de De cujus', () => {
  it('retourne une map vide quand deCujusId est null', () => {
    const personnes: Person[] = [personne('a'), personne('b')]
    const res = categoriserDepuisDeCujus(null, personnes, [])
    expect(res.size).toBe(0)
  })

  it('retourne une map vide quand le De cujus n existe pas dans personnes', () => {
    const personnes: Person[] = [personne('a')]
    const res = categoriserDepuisDeCujus('inconnu', personnes, [])
    expect(res.size).toBe(0)
  })
})

// Cas 9 : terminaison sur cycle --------------------------------------

describe('categoriserDepuisDeCujus — robustesse', () => {
  it('termine sans boucle infinie si la filiation forme un cycle', () => {
    // a parent de b et b parent de a (donnée corrompue)
    const personnes: Person[] = [
      personne('a', 'u-ab'), // parent = b
      personne('b', 'u-ba'), // parent = a
    ]
    const unions: Union[] = [union('u-ab', 'b', null), union('u-ba', 'a', null)]
    // Test : ne plante pas, termine, retourne quelque chose.
    expect(() => categoriserDepuisDeCujus('a', personnes, unions)).not.toThrow()
  })
})

// Cas 10 : oncle classique = NEUTRE (hors taxonomie) -----------------

describe('categoriserDepuisDeCujus — hors taxonomie', () => {
  it('classe un oncle (frère du père) en NEUTRE', () => {
    const personnes: Person[] = [
      personne('gpA'),
      personne('gpB'),
      personne('pere', 'u-gp'),
      personne('oncle', 'u-gp'),
      personne('mere'),
      personne('moi', 'u-parents'),
    ]
    const unions: Union[] = [
      union('u-gp', 'gpA', 'gpB'),
      union('u-parents', 'pere', 'mere'),
    ]
    const res = categoriserDepuisDeCujus('moi', personnes, unions)
    expect(res.get('oncle')).toBe('NEUTRE')
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm test -- categorisation`
Expected: tous les tests FAIL avec un message du type « Cannot find module './categorisation' ».

- [ ] **Step 3: Implémenter `categorisation.ts`**

```ts
import type { Person, Union } from '@prisma/client'
import type { CategorieParente } from './categories'

type ProfondeurParAncetre = Map<string, number>

/**
 * Pour chaque personne, calcule la map { ancetreId → profondeur } incluant
 * la personne elle-même à profondeur 0. BFS itératif borné par un set
 * `visited` pour terminer sur cycles éventuels (donnée corrompue).
 */
function indexerAncetres(
  personnes: Person[],
  unions: Union[],
): Map<string, ProfondeurParAncetre> {
  const personneParId = new Map(personnes.map((p) => [p.id, p]))
  const unionParId = new Map(unions.map((u) => [u.id, u]))

  const result = new Map<string, ProfondeurParAncetre>()

  for (const p of personnes) {
    const ancetres: ProfondeurParAncetre = new Map()
    ancetres.set(p.id, 0)
    const visited = new Set<string>([p.id])
    // File BFS : (idPersonne, profondeur)
    const queue: Array<[string, number]> = [[p.id, 0]]
    while (queue.length > 0) {
      const [courantId, prof] = queue.shift()!
      const courant = personneParId.get(courantId)
      if (!courant?.unionParentaleId) continue
      const u = unionParId.get(courant.unionParentaleId)
      if (!u) continue
      for (const parentId of [u.partenaire1Id, u.partenaire2Id]) {
        if (!parentId) continue
        if (visited.has(parentId)) {
          // Conserve la profondeur minimale.
          const existante = ancetres.get(parentId)
          if (existante === undefined || prof + 1 < existante) {
            ancetres.set(parentId, prof + 1)
          }
          continue
        }
        visited.add(parentId)
        ancetres.set(parentId, prof + 1)
        queue.push([parentId, prof + 1])
      }
    }
    result.set(p.id, ancetres)
  }
  return result
}

/** Couple de profondeurs (dC, dX) + nombre d'ancêtres communs à ce niveau. */
type Plus_proche = { dC: number; dX: number; nbAncetresCommuns: number }

function plusProchesAncetresCommuns(
  ancetresC: ProfondeurParAncetre,
  ancetresX: ProfondeurParAncetre,
): Plus_proche | null {
  let sommeMin = Infinity
  let dCMin = 0
  let dXMin = 0
  let nb = 0
  for (const [aId, dX] of ancetresX) {
    const dC = ancetresC.get(aId)
    if (dC === undefined) continue
    const somme = dC + dX
    if (somme < sommeMin) {
      sommeMin = somme
      dCMin = dC
      dXMin = dX
      nb = 1
    } else if (somme === sommeMin) {
      nb += 1
    }
  }
  if (sommeMin === Infinity) return null
  return { dC: dCMin, dX: dXMin, nbAncetresCommuns: nb }
}

function classer(p: Plus_proche): CategorieParente | null {
  const { dC, dX, nbAncetresCommuns } = p
  if (dC === 0 || dX === 0) return 'LIGNE_DIRECTE'
  if (dC === 2 && dX === 2) {
    return nbAncetresCommuns >= 2 ? 'COUSIN_GERMAIN' : 'COUSIN_DEMI_GERMAIN'
  }
  if ((dC === 2 && dX === 3) || (dC === 3 && dX === 2)) return 'PETIT_COUSIN'
  if ((dC === 2 && dX === 4) || (dC === 4 && dX === 2)) return 'ARRIERE_PETIT_COUSIN'
  if (dC === 3 && dX === 3) return 'COUSIN_ISSU_DE_GERMAIN'
  return null
}

export function categoriserDepuisDeCujus(
  deCujusId: string | null,
  personnes: Person[],
  unions: Union[],
): Map<string, CategorieParente> {
  const res = new Map<string, CategorieParente>()
  if (!deCujusId) return res
  if (!personnes.some((p) => p.id === deCujusId)) return res

  const ancetresPar = indexerAncetres(personnes, unions)
  const ancetresC = ancetresPar.get(deCujusId)
  if (!ancetresC) return res

  // Passe 1 : ligne directe + cousins.
  for (const p of personnes) {
    const ancetresP = ancetresPar.get(p.id)
    if (!ancetresP) continue
    const proche = plusProchesAncetresCommuns(ancetresC, ancetresP)
    if (!proche) continue
    const cat = classer(proche)
    if (cat) res.set(p.id, cat)
  }

  // Passe 2 : conjoints de ligne directe non classés ailleurs.
  for (const u of unions) {
    const [a, b] = [u.partenaire1Id, u.partenaire2Id]
    if (!a || !b) continue
    const catA = res.get(a)
    const catB = res.get(b)
    if (catA === 'LIGNE_DIRECTE' && !catB) res.set(b, 'CONTACT_LIGNE')
    if (catB === 'LIGNE_DIRECTE' && !catA) res.set(a, 'CONTACT_LIGNE')
  }

  // Tout le reste = NEUTRE.
  for (const p of personnes) {
    if (!res.has(p.id)) res.set(p.id, 'NEUTRE')
  }
  return res
}
```

- [ ] **Step 4: Relancer les tests pour vérifier qu'ils passent**

Run: `npm test -- categorisation`
Expected: tous les tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/genealogy/categorisation.ts src/lib/genealogy/categorisation.test.ts
git commit -m "feat(genealogie): fonction de categorisation par rapport au De cujus"
```

---

## Task 3 — Bande latérale sur `CartePersonne`

**Files:**
- Modify: `src/components/personne/CartePersonne.tsx`

- [ ] **Step 1: Ajouter le prop `categorie` et la bande latérale**

Remplacer le contenu de `CartePersonne.tsx` :

```tsx
import type { Person } from '@prisma/client'
import { Avatar } from '@/components/ui/Avatar'
import { Carte } from '@/components/ui/Carte'
import { formatDates, nomComplet } from '@/lib/personne/format'
import {
  COULEURS_CATEGORIE,
  type CategorieParente,
} from '@/lib/genealogy/categories'

type PersonneCarte = Pick<
  Person,
  'nom' | 'prenoms' | 'naissanceDate' | 'decesDate' | 'vivant' | 'surnom'
> & {
  photoPrincipale?: { url: string } | null
}

type Props = {
  personne: PersonneCarte
  variante?: 'compacte' | 'detail'
  focalisee?: boolean
  categorie?: CategorieParente
  className?: string
}

export function CartePersonne({
  personne,
  variante = 'compacte',
  focalisee = false,
  categorie,
  className = '',
}: Props) {
  const dates = formatDates(personne)
  const nom = nomComplet(personne)
  const photoUrl = personne.photoPrincipale?.url ?? null

  const couleurBande = categorie ? COULEURS_CATEGORIE[categorie] : null
  const styleBande = couleurBande
    ? { borderLeft: `4px solid ${couleurBande}` }
    : undefined

  if (variante === 'compacte') {
    return (
      <Carte
        interactive
        style={styleBande}
        className={[
          'flex w-[180px] flex-col items-center gap-2 p-3 text-center',
          focalisee ? 'ring-2 ring-sauge ring-offset-2 ring-offset-papier' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Avatar
          url={photoUrl}
          nom={personne.nom}
          prenoms={personne.prenoms}
          taille={56}
        />
        <div className="min-w-0 w-full">
          <p className="font-serif text-base leading-tight text-encre truncate">
            {nom}
          </p>
          {dates && <p className="mt-0.5 text-xs text-brume">{dates}</p>}
        </div>
      </Carte>
    )
  }

  return (
    <Carte
      interactive
      style={styleBande}
      className={['flex items-center gap-4 p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Avatar
        url={photoUrl}
        nom={personne.nom}
        prenoms={personne.prenoms}
        taille={72}
      />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-xl leading-tight text-encre">{nom}</p>
        {personne.surnom && (
          <p className="text-sm italic text-brume">« {personne.surnom} »</p>
        )}
        {dates && <p className="mt-1 text-sm text-brume">{dates}</p>}
      </div>
    </Carte>
  )
}
```

- [ ] **Step 2: Vérifier que `Carte` accepte un prop `style`**

Run: `grep -n "style" src/components/ui/Carte.tsx`
Si le composant `Carte` ne propage pas `style`, l'ajouter : ouvrir `src/components/ui/Carte.tsx`, vérifier que les props sont étendues par `React.HTMLAttributes<HTMLDivElement>` ou ajouter explicitement `style?: CSSProperties` et le propager au `div` racine.

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 4: Commit**

```bash
git add src/components/personne/CartePersonne.tsx src/components/ui/Carte.tsx
git commit -m "feat(carte-personne): bande laterale coloree selon la categorie"
```

---

## Task 4 — Plomberie dans `layout.ts` et `NoeudPersonne`

**Files:**
- Modify: `src/lib/arbre/layout.ts`
- Modify: `src/components/arbre/NoeudPersonne.tsx`

- [ ] **Step 1: Étendre `DonneesNoeudPersonne` et la signature de `calculerLayoutArbre`**

Dans `src/lib/arbre/layout.ts` :

Ajouter en haut, après les imports :
```ts
import type { CategorieParente } from '@/lib/genealogy/categories'
```

Remplacer la définition de `DonneesNoeudPersonne` :
```ts
export type DonneesNoeudPersonne = {
  personne: Person & { photoPrincipale?: { url: string } | null }
  focalisee: boolean
  categorie: CategorieParente
}
```

Remplacer la signature de `calculerLayoutArbre` :
```ts
export function calculerLayoutArbre({
  personnes,
  unions,
  idFocalise,
  categorieParPersonneId = {},
}: {
  personnes: PersonneAvecPhoto[]
  unions: Union[]
  idFocalise?: string | null
  categorieParPersonneId?: Record<string, CategorieParente>
}): { noeuds: NoeudArbre[]; aretes: ArreteArbre[] } {
```

Dans la boucle qui construit les nœuds personnes, remplacer la création de `data` :
```ts
    noeuds.push({
      id: p.id,
      type: 'personne',
      position: {
        x: pos.x - LARGEUR_CARTE / 2,
        y: pos.y - HAUTEUR_CARTE / 2,
      },
      data: {
        personne: p,
        focalisee: p.id === idFocalise,
        categorie: categorieParPersonneId[p.id] ?? 'NEUTRE',
      },
    })
```

- [ ] **Step 2: Propager `categorie` dans `NoeudPersonne`**

Dans `src/components/arbre/NoeudPersonne.tsx`, modifier le JSX du nœud personne :
```tsx
      <CartePersonne
        personne={d.personne}
        variante="compacte"
        focalisee={d.focalisee}
        categorie={d.categorie}
        className="w-full"
      />
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 4: Commit**

```bash
git add src/lib/arbre/layout.ts src/components/arbre/NoeudPersonne.tsx
git commit -m "feat(arbre): propage la categorie de parente jusqu'au noeud carte"
```

---

## Task 5 — `VueArbre` accepte la map et colore la minimap

**Files:**
- Modify: `src/components/arbre/VueArbre.tsx`

- [ ] **Step 1: Ajouter le prop `categorieParPersonneId` et l'utiliser**

Dans `src/components/arbre/VueArbre.tsx` :

Ajouter l'import :
```tsx
import {
  COULEURS_CATEGORIE,
  type CategorieParente,
} from '@/lib/genealogy/categories'
```

Étendre `Props` :
```tsx
type Props = {
  personnes: PersonneAvecPhoto[]
  unions: Union[]
  mediasParPersonne?: Record<string, Media[]>
  idInitial?: string | null
  categorieParPersonneId?: Record<string, CategorieParente>
}
```

Récupérer le prop dans la signature de `VueArbreInterne` :
```tsx
function VueArbreInterne({
  personnes,
  unions,
  mediasParPersonne = {},
  idInitial,
  categorieParPersonneId = {},
}: Props) {
```

Passer la map à `calculerLayoutArbre` :
```tsx
  const { noeuds, aretes } = useMemo(
    () =>
      calculerLayoutArbre({
        personnes,
        unions,
        idFocalise,
        categorieParPersonneId,
      }),
    [personnes, unions, idFocalise, categorieParPersonneId],
  )
```

Modifier `MiniMap.nodeColor` pour colorer en fonction de la catégorie :
```tsx
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(246, 243, 236, 0.6)"
          nodeColor={(n) => {
            if (n.type !== 'personne') return 'transparent'
            const cat = categorieParPersonneId[n.id]
            const couleur = cat ? COULEURS_CATEGORIE[cat] : null
            return couleur ?? 'var(--color-sauge)'
          }}
          className="!bg-craie/90 !border !border-bordure"
        />
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/arbre/VueArbre.tsx
git commit -m "feat(arbre): VueArbre accepte la map de categorisation et colore la minimap"
```

---

## Task 6 — Composant `LegendeCategories`

**Files:**
- Create: `src/components/arbre/LegendeCategories.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Palette, X } from 'lucide-react'
import {
  COULEURS_CATEGORIE,
  LIBELLES_CATEGORIE,
  ORDRE_AFFICHAGE_LEGENDE,
} from '@/lib/genealogy/categories'

const CLE_LOCALSTORAGE = 'legende-categories-depliee'

function lireEtatInitial(): boolean {
  if (typeof window === 'undefined') return false
  const stocke = window.localStorage.getItem(CLE_LOCALSTORAGE)
  if (stocke === 'true') return true
  if (stocke === 'false') return false
  // Défaut : déplié sur ≥ 640px, replié en dessous.
  return window.matchMedia('(min-width: 640px)').matches
}

export function LegendeCategories() {
  const [depliee, setDepliee] = useState(false)
  const [hydrate, setHydrate] = useState(false)

  // Hydratation côté client uniquement pour éviter le mismatch SSR.
  useEffect(() => {
    setDepliee(lireEtatInitial())
    setHydrate(true)
  }, [])

  useEffect(() => {
    if (!hydrate) return
    window.localStorage.setItem(CLE_LOCALSTORAGE, String(depliee))
  }, [depliee, hydrate])

  if (!hydrate) return null

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20">
      {depliee ? (
        <div className="pointer-events-auto w-64 rounded-[var(--radius-moyenne)] border border-bordure/70 bg-craie/95 p-4 shadow-[var(--shadow-douce)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm text-encre">
              Lien avec le De cujus
            </h2>
            <button
              type="button"
              onClick={() => setDepliee(false)}
              aria-label="Replier la légende"
              className="rounded p-1 text-brume hover:bg-papier hover:text-encre focus-visible:outline-sauge"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {ORDRE_AFFICHAGE_LEGENDE.map((cat) => {
              const couleur = COULEURS_CATEGORIE[cat]
              return (
                <li key={cat} className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-bordure"
                    style={{
                      backgroundColor: couleur ?? 'transparent',
                    }}
                  />
                  <span className="text-encre">{LIBELLES_CATEGORIE[cat]}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDepliee(true)}
          aria-label="Afficher la légende des couleurs"
          className="pointer-events-auto flex items-center gap-2 rounded-[var(--radius-pilule)] border border-bordure/70 bg-craie/95 px-3 py-2 text-xs text-encre shadow-[var(--shadow-douce)] backdrop-blur-md hover:shadow-[var(--shadow-elevee)] focus-visible:outline-sauge"
        >
          <Palette size={14} aria-hidden className="text-sauge" />
          Légende
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/arbre/LegendeCategories.tsx
git commit -m "feat(arbre): composant LegendeCategories flottant avec persistance"
```

---

## Task 7 — Montage de la légende et calcul dans `page.tsx`

**Files:**
- Modify: `src/components/arbre/VueArbre.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Monter la légende dans `VueArbre`**

Dans `src/components/arbre/VueArbre.tsx`, ajouter l'import :
```tsx
import { LegendeCategories } from './LegendeCategories'
```

Dans le JSX retourné par `VueArbreInterne`, juste après `<BarreRechercheFlottante />`, ajouter :
```tsx
      <LegendeCategories />
```

- [ ] **Step 2: Calculer la map dans `page.tsx` et la passer**

Dans `src/app/page.tsx`, ajouter l'import :
```tsx
import { categoriserDepuisDeCujus } from '@/lib/genealogy/categorisation'
import type { CategorieParente } from '@/lib/genealogy/categories'
```

Remplacer le bloc `Promise.all` et la dérivation par :
```tsx
  const [personnes, unions, racine] = await Promise.all([
    prisma.person.findMany({
      include: { photoPrincipale: { select: { url: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.union.findMany(),
    prisma.person.findFirst({
      where: { racineParDefaut: true },
      select: { id: true },
    }),
  ])

  const idInitial = focus ?? racine?.id ?? null

  const mapCategorie = categoriserDepuisDeCujus(
    racine?.id ?? null,
    personnes,
    unions,
  )
  const categorieParPersonneId: Record<string, CategorieParente> = {}
  for (const [id, cat] of mapCategorie) categorieParPersonneId[id] = cat
```

Et passer le prop à `<VueArbre>` :
```tsx
  return (
    <VueArbre
      personnes={personnes}
      unions={unions}
      idInitial={idInitial}
      categorieParPersonneId={categorieParPersonneId}
    />
  )
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 4: Lancer tous les tests**

Run: `npm test`
Expected: tous les tests existants passent toujours, + les nouveaux tests de catégorisation.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/arbre/VueArbre.tsx
git commit -m "feat(accueil): calcule et passe la categorisation, affiche la legende"
```

---

## Task 8 — Vérification manuelle

- [ ] **Step 1: Lancer le serveur de développement**

Run: `npm run dev`
Ouvrir : `http://localhost:3000`

- [ ] **Step 2: Vérifier le rendu visuel**

Cocher chacun de ces points :
- [ ] Le De cujus (la personne marquée `racineParDefaut` en admin) a une bande **jaune vif** à gauche.
- [ ] Ses parents et grands-parents ont aussi la bande jaune.
- [ ] Au moins un cousin germain a la bande **marron foncé**.
- [ ] Le conjoint du De cujus (si présent en base) a la bande **rose**.
- [ ] La majorité des autres cartes restent **sans bande** (NEUTRE).

- [ ] **Step 3: Tester la légende**

- [ ] La pastille / carte de légende apparaît en haut à gauche.
- [ ] Sur desktop, la légende est dépliée par défaut.
- [ ] Cliquer X pour replier → seule la pastille « Légende » reste.
- [ ] Recharger la page → la légende reste repliée (`localStorage` ok).
- [ ] Cliquer la pastille pour déplier → recharger → reste dépliée.
- [ ] Les 8 catégories sont listées avec la bonne couleur en pastille.

- [ ] **Step 4: Tester le viewport mobile**

Ouvrir devtools, mode responsive, 375 px de large.
- [ ] La légende apparaît repliée par défaut (premier chargement, vider `localStorage` au besoin via devtools → Application → Local Storage → Clear).

- [ ] **Step 5: Vérifier la minimap**

- [ ] Les points dans la minimap (bottom-right) prennent la couleur de la catégorie (jaune au centre pour la ligne directe).

Si tout est OK : la feature est terminée. Aucun commit supplémentaire à faire à ce stade.

---

## Couverture du spec

| Section spec | Tâche(s) |
|---|---|
| Taxonomie 7 catégories + neutre | Task 1 |
| Calcul à la volée (algorithme + 2 passes) | Task 2 |
| `CartePersonne` + bande latérale | Task 3 |
| `layout.ts` + `NoeudPersonne` propagation | Task 4 |
| `VueArbre` + minimap colorée | Task 5, 7 |
| Composant `LegendeCategories` (collapse + localStorage + mobile) | Task 6 |
| Page accueil branche tout | Task 7 |
| Tests (10 cas dont cycle, null, conjoint cousin = NEUTRE) | Task 2 |
| Vérification manuelle | Task 8 |
