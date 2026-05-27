import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { prisma } from '@/lib/db'
import { Carte } from '@/components/ui/Carte'

export const dynamic = 'force-dynamic'

export default async function PageAdminFamilles() {
  const familles = await prisma.famille.findMany({
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: {
      _count: { select: { personnes: true, medias: true } },
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-encre">Familles</h1>
        <p className="mt-1 text-sm text-brume">
          Les 9 branches importées depuis l&apos;Excel. Modifie le nom, la
          description et les médias collectifs.
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {familles.map((f) => (
          <li key={f.id}>
            <Carte className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-encre">{f.nom}</p>
                <p className="truncate text-xs text-brume">
                  {f.slug} · {f._count.personnes} personnes · {f._count.medias} médias
                </p>
              </div>
              <Link
                href={`/admin/familles/${f.id}`}
                className="inline-flex items-center gap-1 rounded-[var(--radius-douce)] px-3 py-1.5 text-sm text-encre hover:bg-bordure/60"
              >
                <Pencil size={14} aria-hidden /> Modifier
              </Link>
            </Carte>
          </li>
        ))}
      </ul>
    </div>
  )
}
