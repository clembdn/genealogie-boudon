'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import type { Person } from '@prisma/client'
import { formatDates, nomComplet } from '@/lib/personne/format'

type ResultatPersonne = Pick<
  Person,
  'id' | 'nom' | 'prenoms' | 'surnom' | 'naissanceDate' | 'decesDate' | 'vivant' | 'branche'
> & { slug: string }

type Props = {
  ouverte: boolean
  surFermeture: () => void
}

export function PaletteRecherche({ ouverte, surFermeture }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const [personnes, setPersonnes] = useState<ResultatPersonne[] | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [valeur, setValeur] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (ouverte && !dialog.open) dialog.showModal()
    if (!ouverte && dialog.open) dialog.close()
  }, [ouverte])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handler = () => surFermeture()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [surFermeture])

  useEffect(() => {
    if (!ouverte || personnes !== null || chargement) return
    setChargement(true)
    fetch('/api/recherche')
      .then((r) => {
        if (!r.ok) throw new Error('réponse ' + r.status)
        return r.json()
      })
      .then((data: { personnes: ResultatPersonne[] }) => {
        setPersonnes(data.personnes)
        setErreur(null)
      })
      .catch(() => setErreur('Impossible de charger la liste des personnes.'))
      .finally(() => setChargement(false))
  }, [ouverte, personnes, chargement])

  const surSelection = (slug: string) => {
    router.push(`/personne/${slug}`)
    surFermeture()
    setValeur('')
  }

  const surClicFond: React.MouseEventHandler<HTMLDialogElement> = (e) => {
    if (e.target === ref.current) ref.current?.close()
  }

  return (
    <dialog
      ref={ref}
      onClick={surClicFond}
      aria-label="Recherche"
      className="mx-auto mt-[12vh] w-[calc(100%-1.5rem)] max-w-xl rounded-[var(--radius-moyenne)] border border-bordure bg-craie p-0 text-encre shadow-[var(--shadow-flottante)]"
    >
      <Command
        shouldFilter
        loop
        label="Rechercher une personne"
        className="flex flex-col"
      >
        <div className="flex items-center gap-3 border-b border-bordure px-4">
          <Search size={18} aria-hidden className="text-brume" />
          <Command.Input
            autoFocus
            value={valeur}
            onValueChange={setValeur}
            placeholder="Rechercher un nom, un prénom…"
            className="h-12 flex-1 bg-transparent text-base text-encre outline-none placeholder:text-brume"
          />
          <kbd className="rounded border border-bordure bg-papier px-1.5 py-0.5 text-[10px] font-mono text-brume">
            Esc
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {chargement && (
            <p className="px-3 py-6 text-center text-sm text-brume">
              Chargement…
            </p>
          )}
          {erreur && (
            <p className="px-3 py-6 text-center text-sm text-red-700">
              {erreur}
            </p>
          )}
          {!chargement && !erreur && (
            <Command.Empty className="px-3 py-6 text-center text-sm text-brume">
              Aucun résultat.
            </Command.Empty>
          )}
          {personnes?.map((p) => (
            <Command.Item
              key={p.id}
              // value doit être unique : sans cela cmdk fusionne les homonymes.
              value={p.id}
              keywords={[
                nomComplet(p),
                p.surnom ?? '',
                p.branche ?? '',
                formatDates(p),
              ].filter(Boolean)}
              onSelect={() => surSelection(p.slug)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-douce)] px-3 py-2.5 text-sm aria-selected:bg-papier aria-selected:text-encre"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base text-encre">
                  {nomComplet(p)}
                  {p.surnom && (
                    <span className="ml-2 text-sm italic text-brume">
                      « {p.surnom} »
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-brume">
                  {formatDates(p)}
                  {p.branche && (
                    <span className="ml-2">· branche {p.branche}</span>
                  )}
                </p>
              </div>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </dialog>
  )
}
