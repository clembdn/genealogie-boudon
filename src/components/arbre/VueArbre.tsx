'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Person, Union, Media } from '@prisma/client'
import { NoeudPersonne, NoeudUnion } from './NoeudPersonne'
import { NoeudFamille } from './NoeudFamille'
import { NoeudFondFamille } from './NoeudFondFamille'
import { LegendeCategories } from './LegendeCategories'
import { BoxsFamilles } from './BoxsFamilles'
import type { FamilleCartouche } from '@/lib/arbre/liaisons'
import { ModaleDetailPersonne } from '@/components/personne/ModaleDetailPersonne'
import {
  calculerLayoutArbre,
  LARGEUR_CARTE,
  HAUTEUR_CARTE,
} from '@/lib/arbre/layout'
import { getRelationsPersonne } from '@/lib/genealogy/relations'
import { Bouton } from '@/components/ui/Bouton'
import { useRecherche } from '@/components/recherche/FournisseurRecherche'
import {
  COULEURS_CATEGORIE,
  type CategorieParente,
} from '@/lib/genealogy/categories'
import type { LiaisonFamille } from '@/lib/arbre/liaisons'
import {
  chargerSousArbreFamille,
  type DonneesSousArbre,
} from '@/app/actions/sous-arbre'
import { Focus, Search } from 'lucide-react'

type PersonneAvecPhoto = Person & { photoPrincipale?: { url: string } | null }

type Props = {
  personnes: PersonneAvecPhoto[]
  unions: Union[]
  /** Médias indexés par personne ; chargés à la volée à l'ouverture de la modale en pratique, mais on accepte un map pré-rempli pour les tests. */
  mediasParPersonne?: Record<string, Media[]>
  idInitial?: string | null
  categorieParPersonneId?: Record<string, CategorieParente>
  /** Cartouches des autres familles à afficher en overlay (top-right). Si absent ou vide, l'overlay n'est pas monté. */
  autresFamilles?: FamilleCartouche[]
  /** Liaisons famille ↔ arbre pour afficher les cards famille sur le canevas. */
  liaisonsFamilles?: (LiaisonFamille & { couleur: string })[]
  /** En mode embarqué (dans une modale), on désactive les overlays globaux (recherche, légende, boxs familles) et la hauteur s'adapte au conteneur. */
  embarquee?: boolean
}

const nodeTypes = {
  personne: NoeudPersonne,
  union: NoeudUnion,
  famille: NoeudFamille,
  fondFamille: NoeudFondFamille,
}

/** Nombre de colonnes dans la grille des membres dépliés. */
const COLS_GRILLE = 4
/** Espacement horizontal entre les cartes de la grille. */
const GAP_H = 20
/** Espacement vertical entre les cartes de la grille. */
const GAP_V = 20
/** Padding autour de la grille dans le fond. */
const PADDING_FOND = 24
/** Décalage vertical entre la card famille et la grille des membres. */
const OFFSET_Y_GRILLE = 20

function VueArbreInterne({
  personnes,
  unions,
  mediasParPersonne = {},
  idInitial,
  categorieParPersonneId = {},
  autresFamilles,
  liaisonsFamilles = [],
  embarquee = false,
}: Props) {
  const [idFocalise, setIdFocalise] = useState<string | null>(
    idInitial ?? personnes[0]?.id ?? null,
  )
  const [personneModale, setPersonneModale] = useState<PersonneAvecPhoto | null>(
    null,
  )
  const flow = useReactFlow()

  // ── État d'expansion des familles ─────────────────────────────────────
  const [familleOuverteSlug, setFamilleOuverteSlug] = useState<string | null>(
    null,
  )
  const [donneesExpansion, setDonneesExpansion] =
    useState<DonneesSousArbre | null>(null)
  const [chargementSlug, setChargementSlug] = useState<string | null>(null)
  const cacheSousArbres = useRef<Map<string, DonneesSousArbre>>(new Map())

  // ── Layout statique de l'arbre ────────────────────────────────────────
  const liaisonsAvecEtat = useMemo(
    () =>
      liaisonsFamilles.map((l) => ({
        ...l,
        ouverte: l.famille.slug === familleOuverteSlug,
      })),
    [liaisonsFamilles, familleOuverteSlug],
  )

  const { noeuds, aretes } = useMemo(
    () =>
      calculerLayoutArbre({
        personnes,
        unions,
        idFocalise,
        categorieParPersonneId,
        liaisonsFamilles: liaisonsAvecEtat,
      }),
    [personnes, unions, idFocalise, categorieParPersonneId, liaisonsAvecEtat],
  )

  // ── Nœuds dynamiques (membres dépliés + fond) ────────────────────────
  const noeudsDynamiques = useMemo<Node[]>(() => {
    if (!familleOuverteSlug || !donneesExpansion) return []

    // Trouver la position du nœud famille sur le canevas.
    const noeudFamille = noeuds.find(
      (n) => n.id === `fam:${familleOuverteSlug}`,
    )
    if (!noeudFamille) return []

    const { x: famX, y: famY } = noeudFamille.position
    const liaison = liaisonsFamilles.find(
      (l) => l.famille.slug === familleOuverteSlug,
    )
    const couleur = liaison?.couleur ?? '#5B8C7A'

    const membres = donneesExpansion.personnes
    if (membres.length === 0) return []

    // Calculer la grille de positions des membres.
    const nbLignes = Math.ceil(membres.length / COLS_GRILLE)
    const nbColsEffectives = Math.min(membres.length, COLS_GRILLE)

    // La grille est positionnée sous le nœud famille.
    const grilleStartX = famX - ((nbColsEffectives - 1) * (LARGEUR_CARTE + GAP_H)) / 2
    const grilleStartY = famY + 80 + OFFSET_Y_GRILLE // 80 = hauteur carte famille

    const noeudsGrille: Node[] = membres.map((p, i) => {
      const col = i % COLS_GRILLE
      const ligne = Math.floor(i / COLS_GRILLE)
      return {
        id: `exp:${p.id}`,
        type: 'personne',
        position: {
          x: grilleStartX + col * (LARGEUR_CARTE + GAP_H),
          y: grilleStartY + ligne * (HAUTEUR_CARTE + GAP_V),
        },
        data: {
          personne: p,
          focalisee: false,
          categorie:
            donneesExpansion.categorieParPersonneId[p.id] ?? 'NEUTRE',
        } as unknown as Record<string, unknown>,
        draggable: false,
        selectable: true,
      }
    })

    // Nœud de fond englobant.
    const largeurGrille =
      nbColsEffectives * LARGEUR_CARTE +
      (nbColsEffectives - 1) * GAP_H +
      PADDING_FOND * 2
    const hauteurGrille =
      nbLignes * HAUTEUR_CARTE +
      (nbLignes - 1) * GAP_V +
      PADDING_FOND * 2 +
      32 // 32 = espace pour le titre du fond

    const fondNode: Node = {
      id: `fond:${familleOuverteSlug}`,
      type: 'fondFamille',
      position: {
        x: grilleStartX - PADDING_FOND,
        y: grilleStartY - PADDING_FOND,
      },
      data: {
        nom: donneesExpansion.famille.nom,
        nbPersonnes: donneesExpansion.famille.nbPersonnes,
        couleur,
        largeur: largeurGrille,
        hauteur: hauteurGrille,
      } as unknown as Record<string, unknown>,
      draggable: false,
      selectable: false,
      // Le fond doit être derrière les cartes.
      style: { zIndex: -1 },
    }

    return [fondNode, ...noeudsGrille]
  }, [familleOuverteSlug, donneesExpansion, noeuds, liaisonsFamilles])

  // ── Arêtes dynamiques (entre membres dépliés) ─────────────────────────
  const aretesDynamiques = useMemo<Edge[]>(() => {
    if (!familleOuverteSlug || !donneesExpansion) return []

    const edges: Edge[] = []
    const idsExposes = new Set(donneesExpansion.personnes.map((p) => p.id))

    for (const u of donneesExpansion.unions) {
      const p1Expose = u.partenaire1Id && idsExposes.has(u.partenaire1Id)
      const p2Expose = u.partenaire2Id && idsExposes.has(u.partenaire2Id)

      // Arêtes entre couples (seulement si les deux sont dans la grille).
      if (p1Expose && p2Expose) {
        edges.push({
          id: `exp-c:${u.id}`,
          source: `exp:${u.partenaire1Id}`,
          target: `exp:${u.partenaire2Id}`,
          type: 'straight',
          animated: false,
          style: {
            stroke: 'var(--color-sauge)',
            strokeWidth: 1,
            opacity: 0.3,
          },
        })
      }
    }

    return edges
  }, [familleOuverteSlug, donneesExpansion])

  // ── Assemblage final des nodes/edges ──────────────────────────────────
  const nodes = useMemo<Node[]>(
    () => [
      ...noeuds.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as unknown as Record<string, unknown>,
        draggable: false,
        selectable: n.type === 'personne' || n.type === 'famille',
      })),
      ...noeudsDynamiques,
    ],
    [noeuds, noeudsDynamiques],
  )

  const edges = useMemo<Edge[]>(
    () => [
      ...aretes.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        // « straight » pour les couples (diagonale fine vers la jonction)
        // et « smoothstep » pour la filiation (vertical net du couple à l'enfant).
        type: e.type === 'couple' ? 'straight' : 'smoothstep',
        animated: false,
        style: {
          stroke:
            e.type === 'couple'
              ? 'var(--color-sauge)'
              : 'var(--color-brume)',
          strokeWidth: e.type === 'couple' ? 1.5 : 1,
          opacity: e.type === 'couple' ? 0.75 : 0.5,
        },
      })),
      ...aretesDynamiques,
    ],
    [aretes, aretesDynamiques],
  )

  // ── Gestion du clic sur un nœud ───────────────────────────────────────
  const surClicNoeud: NodeMouseHandler = useCallback(
    async (_event, node) => {
      // Clic sur un nœud personne (arbre ou expansion).
      if (node.type === 'personne') {
        const nodeId = node.id.startsWith('exp:')
          ? node.id.slice(4)
          : node.id
        // Chercher d'abord dans les personnes de l'arbre, puis dans l'expansion.
        const personne =
          personnes.find((p) => p.id === nodeId) ??
          donneesExpansion?.personnes.find((p) => p.id === nodeId) ??
          null
        if (personne) setPersonneModale(personne)
        return
      }

      // Clic sur un nœud famille → toggle expansion.
      if (node.type === 'famille') {
        const slug = node.id.replace('fam:', '')

        // Si cette famille est déjà ouverte → replier.
        if (familleOuverteSlug === slug) {
          setFamilleOuverteSlug(null)
          setDonneesExpansion(null)
          return
        }

        // Charger le sous-arbre (avec cache).
        const enCache = cacheSousArbres.current.get(slug)
        if (enCache) {
          setFamilleOuverteSlug(slug)
          setDonneesExpansion(enCache)
          return
        }

        setChargementSlug(slug)
        try {
          const donnees = await chargerSousArbreFamille(slug)
          if (donnees) {
            cacheSousArbres.current.set(slug, donnees)
            setFamilleOuverteSlug(slug)
            setDonneesExpansion(donnees)
          }
        } finally {
          setChargementSlug(null)
        }
      }
    },
    [personnes, familleOuverteSlug, donneesExpansion],
  )

  const surRecentrer = useCallback(() => {
    if (!personneModale) return
    setIdFocalise(personneModale.id)
    setPersonneModale(null)
    requestAnimationFrame(() => {
      flow.fitView({
        nodes: [{ id: personneModale.id }],
        duration: 600,
        padding: 0.4,
      })
    })
  }, [personneModale, flow])

  const relations = useMemo(() => {
    if (!personneModale) return undefined
    // Combiner les personnes de l'arbre et de l'expansion pour les relations.
    const toutesPersonnesVisibles = [
      ...personnes,
      ...(donneesExpansion?.personnes ?? []),
    ]
    const toutesUnionsVisibles = [
      ...unions,
      ...(donneesExpansion?.unions ?? []),
    ]
    return getRelationsPersonne(
      personneModale,
      toutesUnionsVisibles,
      toutesPersonnesVisibles,
    )
  }, [personneModale, unions, personnes, donneesExpansion])

  const conteneurClass = embarquee
    ? 'relative h-full w-full bg-papier'
    : 'relative h-screen w-full bg-papier'

  return (
    <div className={conteneurClass}>
      {!embarquee && <BarreRechercheFlottante />}
      {!embarquee && <LegendeCategories />}
      {!embarquee && autresFamilles && autresFamilles.length > 0 && (
        <BoxsFamilles familles={autresFamilles} />
      )}

      {/* Indicateur de chargement pour l'expansion d'une famille. */}
      {chargementSlug && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <div className="pointer-events-auto rounded-[var(--radius-pilule)] border border-bordure/70 bg-craie/95 px-4 py-2 text-sm text-brume shadow-[var(--shadow-douce)] backdrop-blur-md">
            Chargement de la famille…
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={surClicNoeud}
        fitView
        fitViewOptions={{
          padding: 0.3,
          nodes: idFocalise ? [{ id: idFocalise }] : undefined,
        }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--color-bordure)" gap={28} size={1} />
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="!shadow-[var(--shadow-douce)]"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(246, 243, 236, 0.6)"
          nodeColor={(n) => {
            if (n.type === 'famille') return 'var(--color-sauge)'
            if (n.type === 'fondFamille') return 'transparent'
            if (n.type !== 'personne') return 'transparent'
            const cat = categorieParPersonneId[n.id] ?? categorieParPersonneId[n.id.replace('exp:', '')]
            const couleur = cat ? COULEURS_CATEGORIE[cat] : null
            return couleur ?? 'var(--color-sauge)'
          }}
          className="!bg-craie/90 !border !border-bordure"
        />
      </ReactFlow>

      <ModaleDetailPersonne
        personne={personneModale}
        relations={relations}
        medias={
          personneModale ? mediasParPersonne[personneModale.id] ?? [] : []
        }
        ouverte={Boolean(personneModale)}
        surFermeture={() => setPersonneModale(null)}
        surSelectionPersonne={(p) => {
          // Chercher dans l'arbre principal ou l'expansion.
          const personne =
            personnes.find((pp) => pp.id === p.id) ??
            donneesExpansion?.personnes.find((pp) => pp.id === p.id) ??
            null
          setPersonneModale(personne)
        }}
      />

      {!embarquee && personneModale && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0">
          <Bouton
            variante="secondaire"
            taille="moyen"
            onClick={surRecentrer}
            className="pointer-events-auto"
          >
            <Focus size={16} aria-hidden /> Recentrer ici
          </Bouton>
        </div>
      )}
    </div>
  )
}

export function VueArbre(props: Props) {
  return (
    <ReactFlowProvider>
      <VueArbreInterne {...props} />
    </ReactFlowProvider>
  )
}

/**
 * Barre de recherche flottante centrée en haut de l'arbre. Cliquer ouvre la
 * palette ⌘K globale. Le conteneur ne capte pas les évènements pour ne pas
 * bloquer le pan/zoom de React Flow, seul le bouton est interactif.
 */
function BarreRechercheFlottante() {
  const { ouvrir } = useRecherche()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4 sm:top-6">
      <button
        type="button"
        onClick={ouvrir}
        aria-label="Rechercher une personne dans l'arbre"
        className="pointer-events-auto group flex h-12 w-full max-w-md items-center gap-3 rounded-[var(--radius-pilule)] border border-bordure/70 bg-craie/95 px-5 text-left shadow-[var(--shadow-douce)] backdrop-blur-md transition-shadow duration-200 hover:shadow-[var(--shadow-elevee)] focus-visible:outline-sauge"
      >
        <Search size={18} aria-hidden className="shrink-0 text-sauge" />
        <span className="flex-1 truncate text-base text-brume group-hover:text-encre">
          Rechercher une personne…
        </span>
        <kbd className="hidden shrink-0 rounded border border-bordure bg-papier px-2 py-1 text-[11px] font-mono text-brume sm:inline">
          ⌘K
        </kbd>
      </button>
    </div>
  )
}
