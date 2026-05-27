const ACCENTS: Record<string, string> = {
  pruniere: 'Prunière',
}

const SPECIAUX: Record<string, string> = {
  arbre: 'Arbre principal',
}

function capitaliser(mot: string): string {
  if (mot.length === 0) return mot
  return mot[0].toUpperCase() + mot.slice(1)
}

export function nomFamilleDepuisSlug(slug: string): string {
  if (SPECIAUX[slug]) return SPECIAUX[slug]
  return slug
    .split('-')
    .map((mot) => ACCENTS[mot] ?? capitaliser(mot))
    .join('-')
}
