import type { Person, Union } from '@prisma/client'
import type { CategorieParente } from './categories'

type ProfondeurParAncetre = Map<string, number>

function indexerAncetres(
  personnes: Person[],
  unions: Union[],
): Map<string, ProfondeurParAncetre> {
  const personneParId = new Map(personnes.map((p) => [p.id, p]))
  const unionParId = new Map(unions.map((u) => [u.id, u]))

  const result = new Map<string, ProfondeurParAncetre>()

  for (const p of personnes) {
    const ancetres: ProfondeurParAncetre = new Map()
    ancetres.set(p.id, 0)
    const visited = new Set<string>([p.id])
    const queue: Array<[string, number]> = [[p.id, 0]]

    while (queue.length > 0) {
      const [courantId, prof] = queue.shift()!
      const courant = personneParId.get(courantId)
      if (!courant?.unionParentaleId) continue
      const u = unionParId.get(courant.unionParentaleId)
      if (!u) continue

      for (const parentId of [u.partenaire1Id, u.partenaire2Id]) {
        if (!parentId) continue
        const profondeurCandidate = prof + 1

        if (visited.has(parentId)) {
          const existante = ancetres.get(parentId)
          if (existante === undefined || profondeurCandidate < existante) {
            ancetres.set(parentId, profondeurCandidate)
          }
          continue
        }

        visited.add(parentId)
        ancetres.set(parentId, profondeurCandidate)
        queue.push([parentId, profondeurCandidate])
      }
    }
    result.set(p.id, ancetres)
  }
  return result
}

type PlusProche = {
  dC: number
  dX: number
  nbAncetresCommunsMin: number
}

function plusProchesAncetresCommuns(
  ancetresC: ProfondeurParAncetre,
  ancetresX: ProfondeurParAncetre,
): PlusProche | null {
  let sommeMin = Infinity
  let dCMin = 0
  let dXMin = 0
  let nb = 0

  for (const [aId, dX] of ancetresX) {
    const dC = ancetresC.get(aId)
    if (dC === undefined) continue
    const somme = dC + dX
    if (somme < sommeMin) {
      sommeMin = somme
      dCMin = dC
      dXMin = dX
      nb = 1
    } else if (somme === sommeMin) {
      nb += 1
    }
  }

  if (sommeMin === Infinity) return null
  return { dC: dCMin, dX: dXMin, nbAncetresCommunsMin: nb }
}

function classer(p: PlusProche): CategorieParente | null {
  const { dC, dX, nbAncetresCommunsMin } = p

  if (dC === 0 || dX === 0) return 'LIGNE_DIRECTE'

  if (dC === 2 && dX === 2) {
    return nbAncetresCommunsMin >= 2 ? 'COUSIN_GERMAIN' : 'COUSIN_DEMI_GERMAIN'
  }
  if ((dC === 2 && dX === 3) || (dC === 3 && dX === 2)) return 'PETIT_COUSIN'
  if ((dC === 2 && dX === 4) || (dC === 4 && dX === 2)) {
    return 'ARRIERE_PETIT_COUSIN'
  }
  if (dC === 3 && dX === 3) return 'COUSIN_ISSU_DE_GERMAIN'

  return null
}

export function categoriserDepuisDeCujus(
  deCujusId: string | null,
  personnes: Person[],
  unions: Union[],
): Map<string, CategorieParente> {
  const res = new Map<string, CategorieParente>()
  if (!deCujusId) return res
  if (!personnes.some((p) => p.id === deCujusId)) return res

  const ancetresPar = indexerAncetres(personnes, unions)
  const ancetresC = ancetresPar.get(deCujusId)
  if (!ancetresC) return res

  // Passe 1 : ligne directe + cousins.
  for (const p of personnes) {
    const ancetresP = ancetresPar.get(p.id)
    if (!ancetresP) continue
    const proche = plusProchesAncetresCommuns(ancetresC, ancetresP)
    if (!proche) continue
    const cat = classer(proche)
    if (cat) res.set(p.id, cat)
  }

  // Passe 2 : conjoints de personnes en ligne directe, non classés ailleurs.
  for (const u of unions) {
    const a = u.partenaire1Id
    const b = u.partenaire2Id
    if (!a || !b) continue
    const catA = res.get(a)
    const catB = res.get(b)
    if (catA === 'LIGNE_DIRECTE' && !catB) res.set(b, 'CONTACT_LIGNE')
    if (catB === 'LIGNE_DIRECTE' && !catA) res.set(a, 'CONTACT_LIGNE')
  }

  // Tout le reste = NEUTRE.
  for (const p of personnes) {
    if (!res.has(p.id)) res.set(p.id, 'NEUTRE')
  }

  return res
}
