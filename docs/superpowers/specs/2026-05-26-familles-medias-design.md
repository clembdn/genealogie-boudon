# Familles, médias famille et import complet — Document de conception

**Date :** 26 mai 2026
**Statut :** validé en brainstorming, prêt pour le plan de développement
**Spec précédent :** [`2026-05-20-arbre-genealogique-design.md`](./2026-05-20-arbre-genealogique-design.md)

---

## 1. Contexte & objectif

L'étape 1 a livré un site fonctionnel avec **154 personnes** de la feuille
« Arbre » et un espace admin permettant de saisir personnes, unions et médias
liés à une personne.

Le porteur a apporté de nouvelles données extraites du fichier Excel :
`data/extracted/` contient désormais **9 fichiers JSON** (un par feuille) +
**60 images** réparties dans `data/extracted/images/<slug>/`. Les sous-arbres
familiaux (Hurgon, Veylet, Prunière, Trocellier, Malafosse, Maurin, Gotty,
Doulcier) totalisent **968 personnes**, **33 unions textuelles** et
**244 relations parent-enfant** détectées automatiquement.

Beaucoup de photos et de documents ne représentent pas une personne précise
mais une famille entière (souvenir collectif, lieu, document administratif).
Le modèle actuel `Media.personId` obligatoire ne permet pas de les rattacher.

Objectif : **rendre exploitables toutes les données extraites** en introduisant
la notion de **Famille** comme conteneur de personnes, d'unions et de médias
collectifs, sans casser ce qui existe déjà.

Principes directeurs (inchangés depuis l'étape 1) :

- Importer **une seule fois**, sans retaper.
- Interface lisible, sobre, accessible.
- Lecture seule pour la famille ; admin pour le porteur.
- Site maintenable plusieurs années sans intervention.

## 2. Utilisateurs & accès

Inchangé par rapport au spec précédent :

- **Visiteurs** — public, lecture seule, sans compte.
- **Administrateur** — `/admin` protégé par mot de passe.

Les nouvelles pages publiques `/familles` et `/familles/[slug]` sont accessibles
à tous, sans authentification. Toutes les sections `/admin/familles/*` sont
protégées par le middleware existant.

## 3. Périmètre

Ce spec couvre :

1. **Importer** les ~800 personnes supplémentaires des 8 autres feuilles.
2. **Reconstruire** les unions depuis les relations parent-enfant détectées.
3. **Introduire** une entité `Famille` (table dédiée) avec description éditable.
4. **Importer** les 60 images comme médias famille, via Vercel Blob.
5. **Présenter** les familles côté public : page index `/familles` et page
   détaillée `/familles/[slug]`.
6. **Gérer** les familles dans l'admin : édition de la description et des
   médias famille.

Hors périmètre :

- Reconstruction visuelle des arbres par famille (un mini-arbre est mentionné
  côté UI mais s'appuie sur la `VueArbre` existante filtrée, pas une refonte).
- OCR / parsing intelligent des unions textuelles (`"BOUDON / VEYLET | Aldy"`)
  pour en déduire les conjoints. Ces textes restent en notes éventuelles.
- Reconnaissance automatique du contenu des images.

## 4. Modèle de données

### 4.1. Nouvelle table `Famille`

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

- `slug` : identique à celui des JSON (`arbre`, `boudon-hurgon`, etc.).
- `nom` : libellé d'affichage dérivé du slug (`Arbre principal`,
  `Boudon-Hurgon`, …). Éditable.
- `description` : texte (markdown léger autorisé). Amorcée à l'import depuis
  les pointers de `arbre.json` quand un texte descriptif existe pour cette
  famille, sinon vide.
- `ordre` : entier pour trier dans l'index. Initialisé selon l'ordre du
  `_summary.json`.

### 4.2. Changements sur `Person`

```prisma
model Person {
  // … champs existants inchangés …
  familleId String?
  famille   Famille? @relation(fields: [familleId], references: [id], onDelete: SetNull)

  @@index([familleId])
}
```

- `branche` (String existant) **conservé** pour compatibilité ascendante, sera
  rempli en miroir du `nom` de la famille à l'import.
- `familleId` rempli à l'import depuis la feuille d'origine de chaque personne.

### 4.3. Changements sur `Media`

```prisma
model Media {
  // … champs existants inchangés sauf personId …
  personId   String?
  person     Person?  @relation("MediasPersonne", fields: [personId], references: [id], onDelete: Cascade)

  familleId  String?
  famille    Famille? @relation(fields: [familleId], references: [id], onDelete: Cascade)

  @@index([familleId])
}
```

- `personId` devient **nullable**.
- `familleId` nullable.
- **Invariant applicatif** : exactement un des deux est non-null. Vérifié dans
  les actions `creerMedia` / `mettreAJourMedia` (Zod ou check manuel). Pas de
  contrainte SQL (Prisma ne le supporte pas proprement) — un test couvre la
  règle.

### 4.4. Union — inchangé

Le modèle `Union` reste tel quel. Les unions reconstruites à l'import sont
créées normalement avec `partenaire1Id`/`partenaire2Id` ; les enfants
rattachés via `unionParentaleId`.

## 5. Import des données

### 5.1. Script `scripts/import-extracted.ts`

Un script unique, idempotent (relançable sans dégât). Le `package.json` reçoit
une nouvelle commande `import:complet`. L'ancien script `scripts/import-arbre.ts`
est supprimé : il ne traite que la feuille « Arbre » et ses données sont
intégralement remplacées par celles de `data/extracted/arbre.json`.

Flags :

- `--dry-run` : log seulement, n'écrit rien.
- `--familles=<slug1,slug2>` : restreindre à certaines feuilles.

### 5.2. Étapes

**1. Charger `_summary.json`** → liste des 9 entrées avec slug, nom, drawing.

**2. Upsert `Famille`** pour chaque entrée :

- Recherche par `slug`.
- Si absente : créer avec `nom` calculé depuis le slug, `description` amorcée
  (cf. §5.3), `ordre` selon position dans `_summary.json`.
- Si présente : ne **pas** écraser `nom`/`description`/`ordre` (préserve les
  édits admin).

**3. Upsert `Person`** pour chaque personne de chaque JSON :

- `id` du JSON conservé (ex. `boudon-hurgon-12`).
- `transformPerson` existant réutilisé, étendu pour remplir `familleId` et
  `branche` depuis la feuille.
- Merge intelligent **si la personne existe déjà** :
  - Champs `String?` : on remplace **uniquement si la valeur en base est
    `null` ou vide**.
  - Champs booléens / enums avec défaut (`sexe = inconnu`, `vivant = false`,
    `racineParDefaut = false`) : on ne touche pas (l'admin a pu modifier).
  - `notesImport` : on régénère systématiquement à partir du JSON courant
    (c'est un champ purement informatif).
  - `familleId` : on remplit si null, sinon on log un warning si différent
    (cas d'une personne qui change de feuille — improbable).
- Les personnes `multiPerson` (rectangle qui contient plusieurs personnes
  agrégées) restent importées telles quelles avec mention dans `notesImport`.

**4. Construire les unions** :

- Pour chaque feuille, regrouper les relations `parent-child` par `toId` (enfant).
- Pour chaque enfant ayant 2 parents distincts, identifier la paire ordonnée
  (homme/femme si déductible du sexe, sinon ordre alphabétique du nom).
- Pour chaque paire unique de parents, chercher une `Union` existante (deux
  partenaires identiques dans n'importe quel sens) :
  - Si absente : créer (`nature = inconnue`).
  - Si présente : ne pas dupliquer.
- Pour chaque enfant, rattacher via `unionParentaleId` s'il n'a pas déjà une
  union parentale différente.
- Les relations à un seul parent (enfant avec un seul `fromId`) sont logguées
  comme « à compléter manuellement » dans le rapport final, pas de demi-union
  créée.

**5. Upload des images** :

- Pour chaque entrée `images[]` de chaque JSON :
  - Calculer la clé blob : `familles/<slug>/<basename>` (déterministe).
  - Vérifier si un `Media` avec cette URL existe déjà :
    - Oui → skip (idempotent).
    - Non → upload du fichier local vers Vercel Blob, puis créer le `Media`.
  - Type : `photo` si extension `.png/.jpg/.jpeg`, `document` sinon.
  - `titre` : nom de fichier sans extension (ex. `image18`). À renommer
    ensuite côté admin.
  - `description` : `null` (à compléter à la main par l'admin).
  - `familleId` = id de la famille, `personId = null`.
  - `ordre` : index incrémental dans la galerie de la famille.
- Variable d'env `BLOB_READ_WRITE_TOKEN` requise ; sans elle, échec contrôlé
  avec message explicite.

**6. Rapport final** : tableau récap par feuille (personnes nouvelles / mises à
jour / ignorées, unions créées, médias uploadés, warnings). Stdout, lisible.

### 5.3. Amorçage de la description famille

Le fichier `data/extracted/arbre.json` contient un tableau `pointers` (10
entrées) avec des textes du type :

> *Arbre BOUDON HURGON | 12 enfants | (8 Grandviala cne F.M. et 4 Mornac
> cne Espinasse)*

À l'import, pour chaque famille (sauf `arbre`), on cherche dans ces pointers
celui qui correspond au slug (matching insensible à la casse sur le mot-clé,
ex. `HURGON`), on prend le texte nettoyé (séparateurs `|` → retours ligne),
et on l'utilise comme description initiale. Si rien trouvé : description
laissée vide.

## 6. UI publique

### 6.1. `/familles`

Page index, server component lisant `prisma.famille.findMany({ include:
{ _count: { select: { personnes: true, medias: true } } } })`.

- Hero court : *« Les neuf branches de la famille Boudon »*.
- Grille responsive de 9 cartes triées par `ordre`. Chaque carte :
  - Vignette : première image famille `type = photo` (ou placeholder sobre si
    la famille n'a pas encore d'image).
  - Nom + nombre de personnes + nombre de médias.
  - Extrait de description (3 lignes max, ellipse).
  - Clic → `/familles/[slug]`.
- Ton sobre, polices Fraunces/Hanken existantes.

### 6.2. `/familles/[slug]`

Page détaillée, server component.

Sections :

1. **En-tête** : nom + comptages (personnes, unions, médias).
2. **Description** : description en markdown léger rendu côté serveur.
3. **Galerie photo** : grille de toutes les photos (`type = photo`,
   `familleId = id`). Clic ouvre une modale (réutiliser `Modale.tsx`) avec
   image agrandie, titre, description.
4. **Documents** : liste des médias `type = document` avec lien de
   téléchargement, titre, description.
5. **Personnes** : liste compacte des `Person` de cette famille (lien vers
   la fiche via la modale existante `ModaleDetailPersonne`).
6. **Lien « Voir dans l'arbre »** vers `/?focus=<id>` où `<id>` est la
   première personne `racineParDefaut` de la famille, ou à défaut la
   première personne par `ordreFratrie`.

Si la famille n'existe pas ou est vide : page 404 simple.

### 6.3. Navigation

Ajout d'un **header** dans `src/app/layout.tsx` :

- Logo / titre cliquable → `/`
- Liens : `Arbre` (`/`), `Familles` (`/familles`)
- Lien `Admin` visible uniquement si la session admin est active

Composant `Entete.tsx` côté serveur, simple et accessible (skip link déjà en
place).

## 7. Espace admin

### 7.1. `/admin/familles`

Liste tabulaire :

| Famille | Slug | Personnes | Médias | Ordre | Actions |
|---|---|---|---|---|---|

Action `Modifier` → `/admin/familles/[id]`. Pas de création / suppression (les
familles sont fixes, gérées par l'import).

### 7.2. `/admin/familles/[id]`

Formulaire d'édition :

- Champ `nom`
- Champ `description` (textarea ample, hint markdown)
- Champ `ordre` (number)
- Section **Médias famille** : composant `SectionMedias` réutilisé, en mode
  `cible = { type: 'famille', id }`.

### 7.3. Refactor `SectionMedias` et `actions.ts`

- `SectionMedias` accepte une prop `cible: { type: 'personne' | 'famille', id: string }`.
- Les server actions `creerMedia`, `mettreAJourMedia`, `definirPhotoPrincipale`
  acceptent un discriminant `{ type, id }` au lieu de `personneId`.
- `definirPhotoPrincipale` reste **personne uniquement** (pas de notion de
  photo principale famille).
- L'invariant XOR `personId` / `familleId` est vérifié dans `creerMedia` :
  rejet si les deux sont remplis ou les deux nuls.

## 8. Tests

Tests unitaires (vitest) à ajouter :

- `transform-person.test.ts` : étendre pour couvrir le rattachement `familleId`.
- `construire-unions.test.ts` (nouveau) : à partir d'un set de relations
  parent-enfant en fixture, vérifier les unions créées et l'absence de
  doublon.
- `import-extracted.test.ts` (nouveau) : test d'idempotence — exécuter
  l'import deux fois sur une base mémoire (sqlite ou mock Prisma), vérifier
  qu'aucune donnée n'est dupliquée et que les édits admin sont préservés.
- `media-invariant.test.ts` (nouveau) : `creerMedia` rejette si `personId` et
  `familleId` tous les deux fournis ou tous les deux absents.

Tests manuels :

- Charger `/familles` → 9 cartes affichées correctement.
- Charger `/familles/boudon-hurgon` → galerie de 7 images visible, modale ok.
- Admin : modifier la description d'une famille, recharger, vérifier
  persistance.
- Admin : uploader une nouvelle photo via une famille, vérifier qu'elle
  apparaît côté public.

## 9. Migration et déploiement

1. Migration Prisma : `db:migrate` (le porteur exécute la commande).
2. Génération du client : `db:generate`.
3. Variable d'env vérifiée localement : `BLOB_READ_WRITE_TOKEN` doit être
   présente pour l'import.
4. Le réseau habituel bloquant le port 5432, l'import sera lancé depuis le
   hotspot 4G du porteur (mémo : `network-db-access`).
5. Build et déploiement Vercel comme d'habitude.

## 10. Récapitulatif des décisions

| Sujet | Décision |
|---|---|
| Modèle Famille | Table dédiée Prisma |
| Lien médias / famille | `Media.personId` nullable + `Media.familleId` nullable, XOR applicatif |
| Stockage images | Vercel Blob, clé `familles/<slug>/<basename>` |
| Import unions | Reconstruites depuis les relations parent-enfant (paires de parents) |
| Re-import personnes | Upsert intelligent (préserve les champs non vides en base) |
| UI publique | `/familles` (index) + `/familles/[slug]` (détail) |
| Description famille | Édit admin, amorcée depuis les pointers de `arbre.json` |
| Script d'import | `scripts/import-extracted.ts` remplace `scripts/import-arbre.ts` |
| Nav globale | Header ajouté dans `layout.tsx` |
| `SectionMedias` | Généralisé `cible = { type, id }` |
