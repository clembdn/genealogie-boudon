import Link from 'next/link'
import Image from 'next/image'
import { Users, Image as ImageIcon } from 'lucide-react'
import { Carte } from '@/components/ui/Carte'

type Props = {
  slug: string
  nom: string
  description: string | null
  nbPersonnes: number
  nbMedias: number
  vignetteUrl: string | null
  vignetteTitre: string | null
}

export function CarteFamille({
  slug,
  nom,
  description,
  nbPersonnes,
  nbMedias,
  vignetteUrl,
  vignetteTitre,
}: Props) {
  return (
    <Link href={`/familles/${slug}`} className="group">
      <Carte interactive className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[4/3] bg-papier">
          {vignetteUrl ? (
            <Image
              src={vignetteUrl}
              alt={vignetteTitre || nom}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brume">
              <ImageIcon size={40} aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h2 className="font-serif text-xl text-encre">{nom}</h2>
          {description && (
            <p className="line-clamp-3 text-sm text-brume">{description}</p>
          )}
          <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-brume">
            <span className="inline-flex items-center gap-1">
              <Users size={14} aria-hidden /> {nbPersonnes} personne{nbPersonnes > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={14} aria-hidden /> {nbMedias} média{nbMedias > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Carte>
    </Link>
  )
}
