'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Media } from '@prisma/client'
import { ModaleImage } from './ModaleImage'

type Props = {
  photos: Media[]
}

export function GalerieFamille({ photos }: Props) {
  const [selection, setSelection] = useState<Media | null>(null)

  if (photos.length === 0) {
    return <p className="text-sm text-brume">Aucune photo pour l&apos;instant.</p>
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelection(m)}
              className="group relative block aspect-square w-full overflow-hidden rounded-[var(--radius-moyenne)] bg-papier focus-visible:outline-2 focus-visible:outline-sauge"
            >
              <Image
                src={m.url}
                alt={m.titre || 'Photo de famille'}
                fill
                sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      <ModaleImage media={selection} surFermeture={() => setSelection(null)} />
    </>
  )
}
