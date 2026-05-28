'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, Folders, X } from 'lucide-react'
import { Modale } from '@/components/ui/Modale'
import { classesBouton } from '@/components/ui/classes-bouton'
import { VueArbre } from './VueArbre'
import {
  chargerSousArbreFamille,
  type DonneesSousArbre,
} from '@/app/actions/sous-arbre'

export type FamilleCartouche = {
  id: string
  slug: string
  nom: string
  nbPersonnes: number
}

type Props = {
  familles: FamilleCartouche[]
}

const CLE_LOCALSTORAGE = 'boxs-familles-depliee'

function lireEtatInitial(): boolean {
  if (typeof window === 'undefined') return false
  const stocke = window.localStorage.getItem(CLE_LOCALSTORAGE)
  if (stocke === 'true') return true
  if (stocke === 'false') return false
  return window.matchMedia('(min-width: 640px)').matches
}

type EtatChargement =
  | { statut: 'inactif' }
  | { statut: 'chargement'; slug: string }
  | { statut: 'pret'; slug: string; donnees: DonneesSousArbre }
  | { statut: 'vide'; slug: string }
  | { statut: 'erreur'; slug: string; message: string }

export function BoxsFamilles({ familles }: Props) {
  const [depliee, setDepliee] = useState(false)
  const [hydrate, setHydrate] = useState(false)
  const [etat, setEtat] = useState<EtatChargement>({ statut: 'inactif' })
  const [cache, setCache] = useState<Map<string, DonneesSousArbre>>(new Map())

  useEffect(() => {
    setDepliee(lireEtatInitial())
    setHydrate(true)
  }, [])

  useEffect(() => {
    if (!hydrate) return
    window.localStorage.setItem(CLE_LOCALSTORAGE, String(depliee))
  }, [depliee, hydrate])

  const ouvrirFamille = useCallback(
    async (slug: string) => {
      const enCache = cache.get(slug)
      if (enCache) {
        setEtat({ statut: 'pret', slug, donnees: enCache })
        return
      }
      setEtat({ statut: 'chargement', slug })
      try {
        const donnees = await chargerSousArbreFamille(slug)
        if (!donnees) {
          setEtat({ statut: 'vide', slug })
          return
        }
        setCache((prev) => new Map(prev).set(slug, donnees))
        setEtat({ statut: 'pret', slug, donnees })
      } catch (err) {
        setEtat({
          statut: 'erreur',
          slug,
          message: err instanceof Error ? err.message : 'Erreur inconnue',
        })
      }
    },
    [cache],
  )

  const fermerModale = useCallback(() => {
    setEtat({ statut: 'inactif' })
  }, [])

  if (!hydrate) return null

  return (
    <>
      <div className="pointer-events-none absolute right-4 top-4 z-20">
        {depliee ? (
          <div className="pointer-events-auto w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius-moyenne)] border border-bordure/70 bg-craie/95 p-4 shadow-[var(--shadow-douce)] backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-serif text-sm text-encre">Autres branches</h2>
              <button
                type="button"
                onClick={() => setDepliee(false)}
                aria-label="Replier les branches"
                className="rounded p-1 text-brume transition-colors hover:bg-papier hover:text-encre focus-visible:outline-sauge"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
            <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
              {familles.map((f) => {
                const chargementEnCours =
                  etat.statut === 'chargement' && etat.slug === f.slug
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => ouvrirFamille(f.slug)}
                      disabled={chargementEnCours}
                      className="group flex w-full items-center justify-between gap-2 rounded-[var(--radius-douce)] px-2 py-2 text-left text-sm text-encre transition-colors hover:bg-papier focus-visible:outline-sauge disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="min-w-0 flex-1 truncate">{f.nom}</span>
                      <span className="shrink-0 text-xs text-brume">
                        {f.nbPersonnes}
                      </span>
                      <ChevronRight
                        size={14}
                        aria-hidden
                        className="shrink-0 text-brume transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDepliee(true)}
            aria-label="Afficher les autres branches"
            className="pointer-events-auto flex items-center gap-2 rounded-[var(--radius-pilule)] border border-bordure/70 bg-craie/95 px-3 py-2 text-xs text-encre shadow-[var(--shadow-douce)] backdrop-blur-md transition-shadow hover:shadow-[var(--shadow-elevee)] focus-visible:outline-sauge"
          >
            <Folders size={14} aria-hidden className="text-sauge" />
            Branches ({familles.length})
          </button>
        )}
      </div>

      <ModaleSousArbre etat={etat} surFermeture={fermerModale} />
    </>
  )
}

type PropsModale = {
  etat: EtatChargement
  surFermeture: () => void
}

function ModaleSousArbre({ etat, surFermeture }: PropsModale) {
  const ouverte = etat.statut !== 'inactif'
  const titre =
    etat.statut === 'pret' ? etat.donnees.famille.nom : 'Chargement…'

  return (
    <Modale
      ouverte={ouverte}
      surFermeture={surFermeture}
      titre={titre}
      largeMax="large"
    >
      {etat.statut === 'chargement' && (
        <p className="py-12 text-center text-sm text-brume">
          Chargement de la famille…
        </p>
      )}
      {etat.statut === 'erreur' && (
        <p className="py-12 text-center text-sm text-encre">
          Impossible de charger cette famille : {etat.message}
        </p>
      )}
      {etat.statut === 'vide' && (
        <p className="py-12 text-center text-sm text-brume">
          Aucune donnée trouvée pour cette famille.
        </p>
      )}
      {etat.statut === 'pret' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-brume">
            {etat.donnees.famille.nbPersonnes} personnes · {etat.donnees.famille.nbPhotos} photos
          </p>
          <div className="h-[60vh] w-full overflow-hidden rounded-[var(--radius-douce)] border border-bordure">
            <VueArbre
              embarquee
              personnes={etat.donnees.personnes}
              unions={etat.donnees.unions}
              categorieParPersonneId={etat.donnees.categorieParPersonneId}
            />
          </div>
          <div className="flex justify-end">
            <Link
              href={`/familles/${etat.donnees.famille.slug}`}
              className={classesBouton('secondaire', 'moyen')}
            >
              Voir la page complète
            </Link>
          </div>
        </div>
      )}
    </Modale>
  )
}
