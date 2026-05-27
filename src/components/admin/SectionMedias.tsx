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
} from '@/app/admin/medias/actions'
import type { Cible } from '@/app/admin/medias/cible'

type Props = {
  cible: Cible
  medias: Media[]
  photoPrincipaleId?: string | null
}

export function SectionMedias({ cible, medias, photoPrincipaleId = null }: Props) {
  const action = uploaderMediaAction.bind(null, cible)
  const [etat, formAction, enCours] = useActionState<EtatUpload, FormData>(
    action,
    null,
  )
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
              <CartePhoto
                key={m.id}
                media={m}
                cible={cible}
                principale={m.id === photoPrincipaleId}
              />
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
