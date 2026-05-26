import Image from 'next/image'

type Props = {
  url?: string | null
  nom: string
  prenoms?: string
  taille?: number
  className?: string
}

function initiales(prenoms: string | undefined, nom: string) {
  const p = (prenoms ?? '').trim().charAt(0)
  const n = nom.trim().charAt(0)
  return `${p}${n}`.toUpperCase() || '?'
}

export function Avatar({ url, nom, prenoms, taille = 64, className = '' }: Props) {
  const style = { width: taille, height: taille }
  const fontSize = Math.max(12, Math.round(taille * 0.38))

  if (url) {
    return (
      <Image
        src={url}
        alt={`Portrait de ${prenoms ? `${prenoms} ` : ''}${nom}`}
        width={taille}
        height={taille}
        className={`rounded-full object-cover border border-bordure ${className}`}
        style={style}
      />
    )
  }

  return (
    <div
      aria-hidden
      className={`flex items-center justify-center rounded-full bg-papier border border-bordure font-serif text-encre/70 select-none ${className}`}
      style={{ ...style, fontSize }}
    >
      {initiales(prenoms, nom)}
    </div>
  )
}
