export type Pointer = { text: string }

const MIN_SEGMENTS = 2

function motCleDepuisSlug(slug: string): string | null {
  if (slug === 'arbre') return null
  const morceaux = slug.split('-')
  const dernier = morceaux[morceaux.length - 1]
  return dernier.toUpperCase()
}

export function extraireDescriptionInitiale(
  slug: string,
  pointers: ReadonlyArray<Pointer>,
): string | null {
  const motCle = motCleDepuisSlug(slug)
  if (!motCle) return null

  const candidat = pointers.find((p) =>
    p.text.toUpperCase().includes(motCle),
  )
  if (!candidat) return null

  const segments = candidat.text
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (segments.length < MIN_SEGMENTS) return null

  return segments.join('\n')
}
