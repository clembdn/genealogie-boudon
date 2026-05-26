'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { ModaleDetailPersonne } from '@/components/personne/ModaleDetailPersonne'
import { calculerLayoutArbre } from '@/lib/arbre/layout'
import { getRelationsPersonne } from '@/lib/genealogy/relations'
import { Bouton } from '@/components/ui/Bouton'
import { useRecherche } from '@/components/recherche/FournisseurRecherche'
import { Focus, Search } from 'lucide-react'

type PersonneAvecPhoto = Person & { photoPrincipale?: { url: string } | null }

type Props = {
  personnes: PersonneAvecPhoto[]
  unions: Union[]
  /** Médias indexés par personne ; chargés à la volée à l'ouverture de la modale en pratique, mais on accepte un map pré-rempli pour les tests. */
  mediasParPersonne?: Record<string, Media[]>
  idInitial?: string | null
}

const nodeTypes = {
  personne: NoeudPersonne,
  union: NoeudUnion,
}

function VueArbreInterne({
  personnes,
  unions,
  mediasParPersonne = {},
  idInitial,
}: Props) {
  const [idFocalise, setIdFocalise] = useState<string | null>(
    idInitial ?? personnes[0]?.id ?? null,
  )
  const [personneModale, setPersonneModale] = useState<PersonneAvecPhoto | null>(
    null,
  )
  const flow = useReactFlow()

  const { noeuds, aretes } = useMemo(
    () =>
      calculerLayoutArbre({
        personnes,
        unions,
        idFocalise,
      }),
    [personnes, unions, idFocalise],
  )

  const nodes = useMemo<Node[]>(
    () =>
      noeuds.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as unknown as Record<string, unknown>,
        draggable: false,
        selectable: n.type === 'personne',
      })),
    [noeuds],
  )

  const edges = useMemo<Edge[]>(
    () =>
      aretes.map((e) => ({
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
    [aretes],
  )

  const surClicNoeud: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type !== 'personne') return
      const personne = personnes.find((p) => p.id === node.id)
      if (personne) setPersonneModale(personne)
    },
    [personnes],
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
    return getRelationsPersonne(personneModale, unions, personnes)
  }, [personneModale, unions, personnes])

  return (
    <div className="relative h-screen w-full bg-papier">
      <BarreRechercheFlottante />

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
          nodeColor={(n) =>
            n.type === 'personne' ? 'var(--color-sauge)' : 'transparent'
          }
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
          const personne = personnes.find((pp) => pp.id === p.id) ?? null
          setPersonneModale(personne)
        }}
      />

      {personneModale && (
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
