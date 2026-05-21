# Arbre généalogique de la famille Boudon — Document de conception

**Date :** 20 mai 2026
**Statut :** validé en brainstorming, prêt pour le plan de développement

---

## 1. Contexte & objectif

Cinq ans de recherches généalogiques sont aujourd'hui piégées dans un fichier
Excel illisible : les personnes et les dates sont dans des rectangles (formes),
les liens de parenté dans des lignes non rattachées aux cellules.

Objectif : transformer ce travail en un **site web clair, moderne et durable**,
consultable par toute la famille.

Principes directeurs :

- Importer les données existantes **une seule fois**, sans tout retaper.
- Une interface **lisible, premium, ultra-simple**, accessible aux personnes âgées.
- La famille **explore** en lecture seule ; **seul l'administrateur** modifie.
- Un site **maintenable plusieurs années sans aucune action** de l'administrateur.

## 2. Utilisateurs & accès

- **Visiteurs (toute la famille)** — accès public, en lecture seule, **sans compte**.
  Consultation de l'arbre, des fiches et des médias.
- **Administrateur (une seule personne)** — espace `/admin` protégé par mot de
  passe. Crée et modifie personnes, unions, filiations et médias.

Les informations des personnes vivantes sont affichées comme les autres (choix
assumé du porteur du projet). Le site est configuré en `noindex` : non référencé
par les moteurs de recherche, accessible uniquement via son adresse.

## 3. Périmètre — construction en 3 étapes

Le projet est découpé en étapes pour mettre un site **utilisable en ligne
rapidement**, puis l'enrichir. **Ce document et le plan de développement portent
sur l'Étape 1.**

### Étape 1 — V1 mise en ligne

- Import des **154 personnes** de la feuille « Arbre ».
- **Espace administrateur** : gestion des personnes, unions, filiations, médias.
- **Liens automatiques** : l'administrateur déclare les relations, les traits se
  dessinent seuls.
- **Vue Explorer** (vue par défaut) + **Vue d'ensemble** (canvas infini).
- **Fiche complète** par personne + **recherche**.
- Gestion **mariage / union libre / divorce**.
- Site **responsive**, **accessible**, hébergement **gratuit**.

### Étape 2 — Famille élargie & participation (hors périmètre V1)

- Import des 8 autres branches (Hurgon, Veylet, Prunière, Trocellier, Malafosse,
  Maurin, Gotty, Doulcier).
- **Mode suggestion** : la famille propose corrections / photos / anecdotes,
  l'administrateur valide avant publication.
- Fil **« Quoi de neuf »** des derniers ajouts.

### Étape 3 — Enrichissements (hors périmètre V1)

Carte des lieux familiaux · frise chronologique · vue éventail imprimable ·
calculateur de lien de parenté · statistiques familiales · anniversaires ·
export PDF · import/export GEDCOM.

## 4. Les vues (Étape 1)

### 4.1 Vue Explorer — vue par défaut

Une personne au centre, sa famille immédiate autour :

- **Parents** au-dessus, reliés par leur lien d'union.
- **Conjoint(s)** à côté, reliés par le lien d'union (mariage / union libre /
  divorce).
- **Enfants** en dessous, reliés au couple par un trait de filiation.
- **Fratrie** accessible sur le côté.

Un clic sur **n'importe quelle personne** la place au centre : on explore l'arbre
de proche en proche, sans jamais être noyé. Un clic sur la carte centrale ouvre
la **fiche complète**.

La vue Explorer est l'entrée par défaut ; elle s'ouvre sur une **personne de
référence** configurée par l'administrateur.

### 4.2 Vue d'ensemble — canvas infini

Tableau blanc infini façon n8n, accessible depuis un bouton « Vue d'ensemble » :

- Toutes les personnes en nœuds, **mise en page automatique par génération**.
- Chaque union et ses enfants forment une **boîte famille**.
- Les boîtes situées **hors du cadre visible sont repliées par défaut** ; un clic
  les déploie.
- Déplacement et zoom libres.

### 4.3 Fiche complète d'une personne

Ouverte au clic sur une carte. Sections (celles qui sont vides ne s'affichent
pas) :

- **Identité** — portrait, nom, dates, lieux, branche / génération.
- **État civil** — naissance, décès, parrain, marraine, profession.
- **Récit de vie** — texte libre.
- **Photos**, **Documents / actes**, **Témoignages audio**.
- **Famille** — proches cliquables pour rebondir dans l'arbre.

### 4.4 Recherche

Recherche d'une personne par nom / prénom, avec accès direct à sa fiche ou à sa
position dans l'Explorer.

### 4.5 Espace administrateur

Derrière `/admin`, protégé par mot de passe :

- Créer / modifier / supprimer des personnes, des unions, des filiations.
- Téléverser des médias (photos, documents, audios).
- **Liens automatiques** : l'administrateur déclare une relation (« telle
  personne est enfant de tel couple », « ajouter un conjoint ») et le trait
  correspondant apparaît automatiquement. Aucune ligne n'est tracée à la main.
- Les modifications sont visibles **immédiatement** dans l'espace admin ; la
  version publique se met à jour après reconstruction (voir §6).

## 5. Modèle de données

Quatre entités.

### Person

| Champ | Type | Notes |
|---|---|---|
| id | identifiant | |
| nom | texte | |
| prenoms | texte | |
| surnom | texte | optionnel (« dit ») |
| sexe | énum | `homme` / `femme` / `inconnu` |
| naissanceDate | texte | libre : « v. 1600 », « 13 mai 1671 » |
| naissanceLieu | texte | optionnel |
| decesDate | texte | optionnel |
| decesLieu | texte | optionnel |
| parrain | texte | optionnel |
| marraine | texte | optionnel |
| profession | texte | optionnel |
| recit | texte riche | récit de vie, optionnel |
| photoPrincipaleId | réf. Media | optionnel |
| branche | texte | ex. « Boudon » |
| vivant | booléen | |
| ordreFratrie | entier | tri des frères et sœurs |
| unionParentaleId | réf. Union | union dont la personne est issue ; nullable |
| notesImport | texte | indices d'import (texte Excel d'origine, notes, regroupements) — visible côté admin uniquement ; nullable |

Les dates sont du **texte libre** : la généalogie ancienne est imprécise.

Le champ `notesImport` n'est jamais affiché sur les pages publiques : il sert
uniquement à l'administrateur pour recréer les liens, et peut être vidé une fois
le travail fait.

### Union

| Champ | Type | Notes |
|---|---|---|
| id | identifiant | |
| partenaire1Id | réf. Person | nullable (parent inconnu) |
| partenaire2Id | réf. Person | nullable |
| nature | énum | `mariage` / `union_libre` / `inconnue` |
| dateDebut | texte | optionnel |
| lieuDebut | texte | optionnel |
| dateFin | texte | optionnel |
| causeFin | énum | `divorce` / `deces` / `separation` / null |
| notes | texte | optionnel |

### Filiation

Chaque enfant est rattaché à **l'union de ses parents** via `Person.unionParentaleId`.
À partir de ce seul lien, l'application déduit et dessine automatiquement parents,
fratrie et descendance.

### Media

| Champ | Type | Notes |
|---|---|---|
| id | identifiant | |
| personId | réf. Person | |
| type | énum | `photo` / `document` / `audio` |
| url | texte | fichier sur Cloudflare R2 |
| titre | texte | |
| description | texte | optionnel |
| date | texte | optionnel |
| ordre | entier | tri d'affichage |

### Règles d'affichage des liens d'union

- `nature = union_libre` → trait **pointillé**.
- `nature = mariage` et `causeFin = divorce` → trait **barré**, anneaux estompés.
- sinon → trait **plein** avec deux anneaux.

## 6. Architecture technique

- **Next.js (App Router) + TypeScript.**
- **Pages publiques pré-rendues** (génération statique / ISR) : affichage
  instantané ; elles ne dépendent pas de la base à chaque visite. Elles sont
  régénérées lorsque l'administrateur publie une modification.
- **Espace admin** : Server Actions / routes API (fonctions serverless Vercel),
  protégées par un middleware d'authentification.
- **Base de données** : PostgreSQL sur **Neon** (offre gratuite), via l'ORM
  **Prisma**.
- **Médias** : **Cloudflare R2** (offre gratuite : 10 Go, sans frais de
  téléchargement).
- **Canvas** : **React Flow** (`@xyflow/react`) — nœuds, liens, zoom et
  déplacement infinis.
- **Style** : Tailwind CSS ; polices **Fraunces** (noms) et **Hanken Grotesk**
  (interface) chargées via `next/font`.
- **Authentification admin** : un seul administrateur ; empreinte du mot de passe
  en variable d'environnement ; la connexion pose un cookie de session signé
  (httpOnly) ; un middleware protège `/admin` et les routes admin.
- **Hébergement** : Vercel (offre gratuite).
- **Versions des dépendances verrouillées** (lockfile versionné) pour des
  reconstructions identiques à long terme.

### Flux de données

1. Visiteur → page publique pré-rendue (rapide, sans accès base).
2. Administrateur → `/admin` → Server Action → écriture en base (Neon) +
   téléversement médias (R2).
3. À la publication → régénération des pages publiques concernées.

### Gestion des erreurs

- Formulaires admin : validation des champs, messages clairs, rien n'est perdu
  en cas d'erreur.
- Téléversement de média en échec : message explicite, nouvel essai possible.
- Personne ou média introuvable côté public : page « introuvable » soignée.
- Réveil de la base après veille : transparent ; les pages publiques restant
  pré-rendues, le site demeure consultable.

## 7. Pérennité — « zéro maintenance »

Exigence forte : le site doit vivre des années **sans aucune action** de
l'administrateur.

- **Aucune relance manuelle** : l'offre gratuite Neon se met en veille seule et
  **se réveille seule** à la visite suivante — pas de bouton à cliquer, pas de
  « dé-pause » à effectuer.
- **Sauvegardes automatiques** de la base (gérées par Neon).
- **Pages publiques pré-rendues** : le site reste en ligne et instantané même
  pendant le réveil de la base.
- **Dépendances verrouillées** : le site reste reconstructible à l'identique.
- **Portabilité des données** : PostgreSQL standard ; un export GEDCOM/JSON
  (Étape 3) garantit que les données ne sont jamais prisonnières.
- **Risque résiduel assumé** : les conditions des offres gratuites peuvent
  évoluer sur plusieurs années. Les points ci-dessus rendent une migration
  simple si cela devait arriver.

## 8. Import des données existantes

- Un **script lancé une seule fois** transforme `data/arbre-persons.json`
  (154 personnes de la feuille « Arbre ») en enregistrements `Person`.
- Le fichier source contient déjà les **154 personnes en enregistrements
  individuels** ; les 21 issues de rectangles « multi-personnes » (fratries ou
  couples regroupés dans une même forme Excel) sont signalées, et cette
  provenance est conservée dans `notesImport` pour aider à recréer les liens.
- La branche est initialisée à « Boudon » (feuille « Arbre ») ; la génération
  n'est pas stockée — elle se déduit du graphe de filiation une fois les liens
  recréés, et sert alors à la mise en page du canvas.
- Les **liens de parenté ne sont pas dans la source** (lignes non récupérables) :
  l'administrateur les recrée via l'espace admin. C'est attendu et accepté.

## 9. Identité visuelle

- **Polices** : Fraunces (noms, esprit patrimonial moderne), Hanken Grotesk
  (interface).
- **Palette** : papier crème, vert sauge profond en accent, encre sombre.
- **Icônes** : vectorielles (SVG), **aucun emoji**.
- **Carte personne** : épurée — photo (ou silhouette si absente), nom, dates au
  format « naissance – décès », sans symbole. La carte entière est cliquable.
- **Liens d'union** : plein / pointillé / barré (voir §5).

## 10. Accessibilité

Pensée pour les personnes âgées et la simplicité d'usage :

- Grandes zones cliquables, texte généreux, contrastes suffisants.
- Navigation simple : un clic = se déplacer ; jamais d'écran surchargé.
- Réglage **grand texte / contraste renforcé**.
- **Responsive** : confortable sur ordinateur, pleinement utilisable au doigt sur
  tablette et téléphone.

## 11. Tests

- **Tests unitaires** : déduction des liens (parents, fratrie, descendance) à
  partir des filiations ; règles d'affichage mariage / union libre / divorce ;
  mise en page par génération du canvas.
- **Tests du script d'import** : découpage des rectangles multi-personnes,
  correspondance des champs.
- **Tests de bout en bout légers** : navigation dans l'Explorer, ouverture d'une
  fiche, connexion admin, création d'une personne puis d'un lien.

## 12. Hors périmètre V1

Tout le contenu des Étapes 2 et 3 (voir §3) : autres branches, mode suggestion,
fil d'actualité, carte, frise, vue éventail, calculateur de parenté,
statistiques, anniversaires, exports.

## 13. Points ouverts & risques

- **Liens de parenté à ressaisir manuellement** par l'administrateur (données
  sources incomplètes) — travail de saisie, hors développement.
- **Conditions des offres gratuites** susceptibles d'évoluer sur plusieurs années
  — atténué au §7.
- **Nom de domaine** : adresse en `.vercel.app` par défaut ; un domaine
  personnalisé (~12 €/an) reste optionnel.
- **Volume des médias** : l'offre R2 gratuite (10 Go) est large ; au-delà, une
  offre payante modique prend le relais.
