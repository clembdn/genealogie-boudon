import Image from 'next/image'
import Link from 'next/link'
import type { Person, Media, UnionNature } from '@prisma/client'
import { MapPin, Briefcase, Heart } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Etiquette } from '@/components/ui/Etiquette'
import { Carte } from '@/components/ui/Carte'
import { formatDates, nomComplet, slugPersonne } from '@/lib/personne/format'
import type { RelationsPersonne } from '@/lib/genealogy/relations'

type PersonneDetail = Person & {
  photoPrincipale?: { url: string } | null
}

type Props = {
  personne: PersonneDetail
  relations?: RelationsPersonne
  medias?: Media[]
  /** Si défini, clic sur un membre de famille appelle ce callback. Sinon Link. */
  surSelectionPersonne?: (personne: Person) => void
}

const libellesNature: Record<UnionNature, string> = {
  mariage: 'Mariage',
  union_libre: 'Union libre',
  inconnue: 'Union',
}

export function ContenuDetailPersonne({
  personne,
  relations,
  medias = [],
  surSelectionPersonne,
}: Props) {
  const photos = medias.filter((m) => m.type === 'photo')
  const documents = medias.filter((m) => m.type === 'document')
  const photoUrl = personne.photoPrincipale?.url ?? null

  return (
    <div className="flex flex-col gap-8">
      <EnTetePersonne personne={personne} photoUrl={photoUrl} />

      {personne.recit && (
        <Section titre="Récit">
          <p className="whitespace-pre-line text-base leading-relaxed text-encre/90">
            {personne.recit}
          </p>
        </Section>
      )}

      {relations && (
        <SectionFamille
          relations={relations}
          surSelectionPersonne={surSelectionPersonne}
        />
      )}

      {photos.length > 0 && (
        <Section titre="Photos">
          <GaleriePhotos photos={photos} />
        </Section>
      )}

      {documents.length > 0 && (
        <Section titre="Documents">
          <ListeDocuments documents={documents} />
        </Section>
      )}
    </div>
  )
}

function EnTetePersonne({
  personne,
  photoUrl,
}: {
  personne: PersonneDetail
  photoUrl: string | null
}) {
  const dates = formatDates(personne)
  return (
    <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
      <Avatar
        url={photoUrl}
        nom={personne.nom}
        prenoms={personne.prenoms}
        taille={120}
        className="shrink-0"
      />
      <div className="flex flex-col gap-2">
        <p className="font-serif text-3xl leading-tight text-encre">
          {nomComplet(personne)}
        </p>
        {personne.surnom && (
          <p className="text-base italic text-brume">« {personne.surnom} »</p>
        )}
        {dates && <p className="text-base text-brume">{dates}</p>}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {personne.branche && (
            <Etiquette ton="sauge">Branche {personne.branche}</Etiquette>
          )}
          {personne.vivant && <Etiquette ton="sauge">Vivant·e</Etiquette>}
          {personne.profession && (
            <Etiquette ton="neutre">
              <Briefcase size={12} aria-hidden /> {personne.profession}
            </Etiquette>
          )}
          {personne.naissanceLieu && (
            <Etiquette ton="discret">
              <MapPin size={12} aria-hidden /> Né·e à {personne.naissanceLieu}
            </Etiquette>
          )}
        </div>
      </div>
    </header>
  )
}

function Section({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-serif text-sm uppercase tracking-[0.16em] text-brume">
        {titre}
      </h3>
      {children}
    </section>
  )
}

function SectionFamille({
  relations,
  surSelectionPersonne,
}: {
  relations: RelationsPersonne
  surSelectionPersonne?: (personne: Person) => void
}) {
  const aQuelqueChose =
    relations.parents.length > 0 || relations.unions.length > 0
  if (!aQuelqueChose) return null

  return (
    <Section titre="Famille">
      <div className="flex flex-col gap-5">
        {relations.parents.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-encre/80">
              {relations.parents.length === 1 ? 'Parent' : 'Parents'}
            </p>
            <div className="flex flex-wrap gap-2">
              {relations.parents.map((p) => (
                <LienPersonne
                  key={p.id}
                  personne={p}
                  surSelection={surSelectionPersonne}
                />
              ))}
            </div>
          </div>
        )}
        {relations.unions.map(({ union, conjoint, enfants }) => (
          <div key={union.id}>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-encre/80">
              <Heart size={14} aria-hidden className="text-sauge" />
              {libellesNature[union.nature]}
              {union.dateDebut && (
                <span className="text-brume font-normal">
                  · {union.dateDebut}
                </span>
              )}
            </p>
            {conjoint && (
              <div className="mb-3 flex flex-wrap gap-2">
                <LienPersonne
                  personne={conjoint}
                  surSelection={surSelectionPersonne}
                />
              </div>
            )}
            {enfants.length > 0 && (
              <div className="ml-4 border-l-2 border-bordure pl-4">
                <p className="mb-2 text-xs text-brume">
                  Enfant{enfants.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {enfants.map((e) => (
                    <LienPersonne
                      key={e.id}
                      personne={e}
                      surSelection={surSelectionPersonne}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

function LienPersonne({
  personne,
  surSelection,
}: {
  personne: Person
  surSelection?: (personne: Person) => void
}) {
  const contenu = (
    <span className="font-serif">
      {nomComplet(personne)}
      {formatDates(personne) && (
        <span className="ml-2 text-xs text-brume">
          {formatDates(personne)}
        </span>
      )}
    </span>
  )
  const classes =
    'inline-flex min-h-[44px] items-center rounded-[var(--radius-douce)] border border-bordure bg-craie px-3 py-2 text-sm hover:border-sauge hover:text-sauge'

  if (surSelection) {
    return (
      <button
        type="button"
        onClick={() => surSelection(personne)}
        className={classes}
      >
        {contenu}
      </button>
    )
  }
  return (
    <Link href={`/personne/${slugPersonne(personne)}`} className={classes}>
      {contenu}
    </Link>
  )
}

function GaleriePhotos({ photos }: { photos: Media[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.id}>
          <figure className="flex flex-col gap-1">
            <div className="relative aspect-square overflow-hidden rounded-[var(--radius-douce)] border border-bordure bg-papier">
              <Image
                src={photo.url}
                alt={photo.titre || 'Photo de famille'}
                fill
                sizes="(min-width: 640px) 240px, 50vw"
                className="object-cover"
              />
            </div>
            {photo.titre && (
              <figcaption className="text-xs text-brume">
                {photo.titre}
              </figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  )
}

function ListeDocuments({ documents }: { documents: Media[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Carte interactive className="px-4 py-3">
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3"
            >
              <span className="font-medium text-encre">{doc.titre}</span>
              {doc.date && (
                <span className="text-xs text-brume">{doc.date}</span>
              )}
            </a>
          </Carte>
        </li>
      ))}
    </ul>
  )
}
