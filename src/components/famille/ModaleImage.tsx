'use client'

import Image from 'next/image'
import type { Media } from '@prisma/client'
import { Modale } from '@/components/ui/Modale'

type Props = {
  media: Media | null
  surFermeture: () => void
}

export function ModaleImage({ media, surFermeture }: Props) {
  if (!media) return null
  return (
    <Modale
      ouverte={true}
      surFermeture={surFermeture}
      titre={media.titre || 'Photo'}
      largeMax="large"
    >
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] w-full bg-papier">
          <Image
            src={media.url}
            alt={media.titre || 'Photo'}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-contain"
          />
        </div>
        {media.description && (
          <p className="text-sm text-encre">{media.description}</p>
        )}
        {media.date && (
          <p className="text-xs text-brume">Date : {media.date}</p>
        )}
      </div>
    </Modale>
  )
}
