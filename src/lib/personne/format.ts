import type { Person } from '@prisma/client'

/**
 * Extrait une année 3-4 chiffres d'une chaîne potentiellement bruitée.
 * Ex : "01 juin 1695" → 1695, "vers 1820" → 1820, "Testament 1702 ?" → 1702,
 *      "Rimeizenc" → null.
 * Si plusieurs années présentes, prend la première trouvée.
 */
export function extraireAnnee(date: string | null | undefined): number | null {
  if (!date) return null
  const m = date.match(/\b(\d{3,4})\b/)
  if (!m) return null
  const annee = parseInt(m[1], 10)
  if (annee < 800 || annee > 2200) return null
  return annee
}

/**
 * Formate une plage de dates de vie d'une personne pour affichage compact.
 * - 1600 – 1695          : deux dates connues
 * - 1952 –               : naissance connue, vivant=true
 * - 1600 – ?             : naissance connue, vivant=false, décès inconnu
 * - – 1695               : naissance inconnue, décès connu
 * - (chaîne vide)        : aucune date interprétable
 */
export function formatDates(
  p: Pick<Person, 'naissanceDate' | 'decesDate' | 'vivant'>,
): string {
  const an = extraireAnnee(p.naissanceDate)
  const ad = extraireAnnee(p.decesDate)

  if (an && ad) return `${an} – ${ad}`
  if (an && !ad) return p.vivant ? `${an} –` : `${an} – ?`
  if (!an && ad) return `– ${ad}`
  return ''
}

/** "Prénoms NOM" ou ce qui est disponible, sans espace parasite. */
export function nomComplet(
  p: Pick<Person, 'nom' | 'prenoms'>,
): string {
  const prenoms = (p.prenoms ?? '').trim()
  const nom = (p.nom ?? '').trim()
  return [prenoms, nom].filter(Boolean).join(' ') || 'Personne sans nom'
}

const accents: Record<string, string> = {
  à: 'a', â: 'a', ä: 'a', á: 'a', ã: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', î: 'i', ï: 'i', í: 'i',
  ò: 'o', ô: 'o', ö: 'o', ó: 'o', õ: 'o',
  ù: 'u', û: 'u', ü: 'u', ú: 'u',
  ç: 'c', ñ: 'n', ÿ: 'y',
}

function deAccentuer(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map((c) => accents[c] ?? c)
    .join('')
}

/**
 * Normalise une chaîne pour comparaison « tolérante » : minuscules + suppression
 * d'accents + suppression de la ponctuation. Utilisé pour la recherche textuelle
 * dans les filtres admin.
 */
export function normaliserPourRecherche(s: string | null | undefined): string {
  if (!s) return ''
  return deAccentuer(s).replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Slug stable pour les URLs : "prenoms-nom-annee" ou fallback "personne-<id6>".
 * Note : non garanti unique au niveau base, à compléter avec un suffixe si
 * collision dans la couche admin lors de l'enregistrement.
 */
export function slugPersonne(
  p: Pick<Person, 'id' | 'nom' | 'prenoms' | 'naissanceDate'>,
): string {
  const parts = [
    deAccentuer(p.prenoms ?? ''),
    deAccentuer(p.nom ?? ''),
    String(extraireAnnee(p.naissanceDate) ?? ''),
  ]
    .map((s) => s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean)

  if (parts.length === 0) return `personne-${p.id.slice(0, 6)}`
  return parts.join('-')
}
