# Coloration des cartes par catégorie de parenté

**Date :** 2026-05-28
**Statut :** validé, prêt pour plan d'implémentation

## Contexte

L'arbre actuel (`@xyflow/react`) affiche les personnes via `CartePersonne` enveloppée dans `NoeudPersonne`, sans distinction visuelle entre branches. Le tableur Excel source utilisait un code couleur pour situer chaque personne par rapport au « De cujus » (la personne racine, en pratique l'utilisateur lui-même). On veut reproduire ce repère visuel dans l'arbre web.

## Objectif

Colorer chaque carte de l'arbre en fonction du lien de parenté avec le De cujus, et afficher une légende interactive pour décoder les couleurs.

## Décisions clés

- **De cujus = `Person.racineParDefaut`.** Une seule personne racine, fixe, définie en admin. Pas de sélecteur utilisateur dans cette itération.
- **Calcul à la volée**, pas de champ stocké en base. Pas de migration. Une fonction pure exécutée côté serveur dans `src/app/page.tsx`, résultat passé en prop à `VueArbre`.
- **7 catégories** + neutre. Pas de coloration spécifique pour frères/sœurs, oncles, tantes, neveux, nièces (volontairement reporté).
- **`CONTACT_LIGNE` rose = conjoints de la ligne directe uniquement.** Pas les conjoints des cousins.
- **Légende** : overlay flottant top-left, dépliée par défaut sur desktop, repliée sur mobile, état persisté en `localStorage`.

## Taxonomie des catégories

| Catégorie | Définition | Couleur |
|---|---|---|
| `LIGNE_DIRECTE` | Le De cujus, ses ancêtres directs, ses descendants directs | `#FFFF00` jaune vif |
| `COUSIN_GERMAIN` | Partage les deux grands-parents avec le De cujus (1er cousin) | `#6E3A07` marron foncé |
| `COUSIN_DEMI_GERMAIN` | Partage un seul grand-parent | `#B45F06` marron clair |
| `COUSIN_ISSU_DE_GERMAIN` | Partage un arrière-grand-parent (2e cousin) | `#E67E22` orange |
| `PETIT_COUSIN` | Enfant d'un cousin germain | `#F39C12` orange clair |
| `ARRIERE_PETIT_COUSIN` | Petit-enfant d'un cousin germain | `#F1C40F` jaune moutarde |
| `CONTACT_LIGNE` | Conjoint d'une personne de la ligne directe | `#FFADAD` rose |
| `NEUTRE` (défaut) | Tout le reste | aucune (carte par défaut) |

## Architecture

### Nouveaux fichiers

- `src/lib/genealogy/categories.ts`
  - Enum `CategorieParente`.
  - `LIBELLES_CATEGORIE: Record<CategorieParente, string>`.
  - `COULEURS_CATEGORIE: Record<CategorieParente, string>` (hex).
  - Ordre d'affichage pour la légende.
- `src/lib/genealogy/categorisation.ts`
  - Signature : `categoriserDepuisDeCujus(deCujusId: string | null, personnes: Person[], unions: Union[]): Map<string, CategorieParente>`.
  - Fonction pure, aucune dépendance Prisma.
  - Si `deCujusId` est `null` → retourne une map vide (toutes les personnes seront `NEUTRE` en aval).
- `src/lib/genealogy/categorisation.test.ts` — voir section Tests.
- `src/components/arbre/LegendeCategories.tsx` — overlay flottant client.

### Fichiers modifiés

- `src/app/page.tsx`
  - Charge la racine (déjà fait), récupère son id, appelle `categoriserDepuisDeCujus`.
  - Passe `categorieParPersonneId: Record<string, CategorieParente>` à `VueArbre`.
- `src/lib/arbre/layout.ts`
  - Ajoute `categorie: CategorieParente` dans `DonneesNoeudPersonne`.
  - `calculerLayoutArbre` accepte un nouveau paramètre `categorieParPersonneId` et propage la catégorie sur chaque nœud personne (défaut `NEUTRE`).
- `src/components/arbre/NoeudPersonne.tsx` — propage `data.categorie` à `CartePersonne`.
- `src/components/personne/CartePersonne.tsx`
  - Nouveau prop optionnel `categorie?: CategorieParente`.
  - Style : bande latérale gauche de 4 px de la couleur correspondante, via `style` inline (les hex sont dynamiques, Tailwind purgé ne les supportera pas en classe).
  - `NEUTRE` ou absent → pas de bande.
- `src/components/arbre/VueArbre.tsx`
  - Accepte `categorieParPersonneId: Record<string, CategorieParente>` dans `Props`.
  - Le transmet à `calculerLayoutArbre`.
  - Monte `<LegendeCategories />`.
  - `MiniMap.nodeColor` : utilise la couleur de la catégorie de la personne si disponible (tombe sur la couleur sauge actuelle pour `NEUTRE`).

## Algorithme de catégorisation

### Étape 1 — Indexer les ancêtres de chaque personne

Pour chaque personne, BFS itératif en remontant `unionParentale → partenaire1Id / partenaire2Id`.

```
ancetresParPersonne: Map<personId, Map<ancetreId, profondeur>>
```

- Profondeur 0 = la personne elle-même.
- Profondeur 1 = ses parents.
- Profondeur 2 = ses grands-parents.
- BFS itératif avec `visited` set pour terminer sur cycles (donnée corrompue).
- Si un ancêtre est atteint par plusieurs chemins (implexe, consanguinité), on garde la profondeur minimale.

### Étape 2 — Calculer les couples de distances De cujus ↔ personne

Pour chaque personne X et le De cujus C :
- Soit `A_C = ancetresParPersonne.get(C)` (inclut C lui-même à profondeur 0).
- Soit `A_X = ancetresParPersonne.get(X)`.
- Intersection des clés → ensemble d'ancêtres communs avec leurs couples `(dC, dX)`.
- On extrait l'ensemble des couples avec la **somme minimale** `dC + dX` (les ancêtres communs les plus récents), et on compte combien d'ancêtres communs partagent cette somme minimale.

### Étape 3 — Classifier

Appliquer les règles dans cet ordre, première règle qui matche gagne :

| Condition | Catégorie |
|---|---|
| X = C, ou `dC = 0` (X ancêtre de C), ou `dX = 0` (X descendant de C) | `LIGNE_DIRECTE` |
| Plus petit couple = `(2, 2)` avec **2 ancêtres communs** à ce niveau | `COUSIN_GERMAIN` |
| Plus petit couple = `(2, 2)` avec **1 ancêtre commun** à ce niveau | `COUSIN_DEMI_GERMAIN` |
| Plus petit couple ∈ `{(2, 3), (3, 2)}` | `PETIT_COUSIN` |
| Plus petit couple ∈ `{(2, 4), (4, 2)}` | `ARRIERE_PETIT_COUSIN` |
| Plus petit couple = `(3, 3)` | `COUSIN_ISSU_DE_GERMAIN` |
| Aucun ancêtre commun, mais X est conjoint (via `Union.partenaire1Id/partenaire2Id`) d'une personne déjà classée `LIGNE_DIRECTE` | `CONTACT_LIGNE` |
| Sinon | `NEUTRE` |

### Étape 4 — Passes successives

- **Passe 1** : on calcule via les étapes 1–3 sans `CONTACT_LIGNE`, ce qui peuple `LIGNE_DIRECTE` et toutes les catégories cousins.
- **Passe 2** : on parcourt les unions ; pour chaque union dont un partenaire est `LIGNE_DIRECTE` et l'autre n'a aucune catégorie attribuée (= aurait été `NEUTRE`), on classe ce dernier `CONTACT_LIGNE`.

Cette séparation évite que `CONTACT_LIGNE` ne masque une classification cousin (si un conjoint d'une personne en ligne directe est aussi un cousin germain par ailleurs, il garde `COUSIN_GERMAIN`).

## Rendu visuel

### Carte (`CartePersonne`)

- Bande latérale gauche de 4 px, couleur = `COULEURS_CATEGORIE[categorie]`.
- Appliquée via `style={{ borderLeft: \`4px solid \${couleur}\` }}`.
- `NEUTRE` ou prop absent → pas de bande, carte rendue à l'identique de l'existant.
- Pas de fond plein (préservation de l'esthétique papier).
- Variantes `compacte` et `detail` reçoivent toutes deux la bande.

### Composant `LegendeCategories`

- Position : `absolute top-4 left-4 z-20` dans `VueArbre`.
- Container : `pointer-events-none` ; bouton et carte intérieurs : `pointer-events-auto` (même pattern que `BarreRechercheFlottante`).
- État `dépliée: boolean`, hydraté côté client depuis `localStorage` clef `legende-categories-depliee`. Défaut si absent : `window.matchMedia('(min-width: 640px)').matches`.
- **Replié** : pastille ronde avec icône `Palette` (lucide) + label « Légende ». Click → déplie.
- **Déplié** : carte (style équivalent à `Carte`) contenant :
  - Titre « Lien avec le De cujus » (font-serif, encre).
  - 8 lignes : pastille couleur 12 px + libellé français.
  - Bouton X en haut à droite pour replier.
- Mémorisation : à chaque changement d'état, persiste dans `localStorage`.

## Tests

`src/lib/genealogy/categorisation.test.ts`, fixture d'arbre couvrant chaque cas :

- De cujus seul → `LIGNE_DIRECTE`.
- Père, grand-père → `LIGNE_DIRECTE`.
- Fils, petit-fils → `LIGNE_DIRECTE`.
- Oncle (frère du père) → `NEUTRE` (hors taxonomie).
- Cousin germain (enfant de l'oncle, deux grands-parents partagés) → `COUSIN_GERMAIN`.
- Cousin demi-germain (enfant d'un demi-frère du père) → `COUSIN_DEMI_GERMAIN`.
- Cousin issu de germain (partage un arrière-grand-parent) → `COUSIN_ISSU_DE_GERMAIN`.
- Petit-cousin (enfant d'un cousin germain) → `PETIT_COUSIN`.
- Arrière-petit-cousin (petit-enfant d'un cousin germain) → `ARRIERE_PETIT_COUSIN`.
- Conjoint du De cujus → `CONTACT_LIGNE`.
- Conjoint du père → `CONTACT_LIGNE` (à moins qu'il soit la mère, donc ligne directe ; le test couvre un beau-parent).
- Conjoint d'un cousin germain → `NEUTRE`.
- Cas `deCujusId = null` → map vide, pas de crash.
- Cas cycle de filiation (A parent de B, B parent de A) → terminaison garantie, pas d'infinite loop.

## Vérification manuelle

- `npm run dev`, ouvrir `/`.
- Vérifier visuellement les bandes colorées sur le De cujus, ses parents, un oncle, un cousin germain, un conjoint de ligne directe.
- Ouvrir la légende, replier, recharger → l'état est restauré.
- Toggle viewport mobile (devtools 375 px) → légende repliée par défaut.

## Hors périmètre (volontaire)

- Migration Prisma / champ stocké.
- Filtrage par catégorie (cacher / afficher uniquement les cousins X).
- Application de la couleur sur `/personne/[slug]` ou `/familles/[slug]`.
- Sélecteur de De cujus dans l'UI.
- Coloration des relations frère / sœur / oncle / tante / neveu / nièce.
