'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { MediaType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { validerCible, type Cible } from './cible'

export type { Cible }
export { validerCible }

export type EtatUpload = { erreur?: string; succesAt?: number } | null

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024

function devinerType(fichier: File): MediaType {
  if (fichier.type.startsWith('image/')) return 'photo'
  if (fichier.type.startsWith('audio/')) return 'audio'
  return 'document'
}

function cheminPourCible(cible: Cible, nomFichier: string): string {
  const prefixe = cible.type === 'personne' ? 'personnes' : 'familles'
  return `${prefixe}/${cible.id}/${Date.now()}-${nomFichier}`
}

function pathARevalider(cible: Cible): string {
  return cible.type === 'personne'
    ? `/admin/personnes/${cible.id}`
    : `/admin/familles/${cible.id}`
}

export async function uploaderMediaAction(
  cible: Cible,
  _prev: EtatUpload,
  formData: FormData,
): Promise<EtatUpload> {
  try {
    validerCible(cible)
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Cible invalide.' }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      erreur:
        "BLOB_READ_WRITE_TOKEN absent. Configure le token Vercel Blob dans le projet.",
    }
  }

  const fichier = formData.get('fichier')
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: 'Aucun fichier sélectionné.' }
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    return { erreur: `Fichier trop volumineux (max 10 Mo).` }
  }

  const titre =
    (formData.get('titre')?.toString().trim() ?? '') || fichier.name
  const description = formData.get('description')?.toString().trim() || null
  const date = formData.get('date')?.toString().trim() || null
  const type = devinerType(fichier)
  const cheminBlob = cheminPourCible(cible, fichier.name)

  try {
    const blob = await put(cheminBlob, fichier, {
      access: 'public',
      addRandomSuffix: false,
    })
    await prisma.media.create({
      data: {
        personId: cible.type === 'personne' ? cible.id : null,
        familleId: cible.type === 'famille' ? cible.id : null,
        type,
        url: blob.url,
        titre,
        description,
        date,
      },
    })
  } catch (e) {
    return {
      erreur:
        e instanceof Error
          ? `Échec du téléversement : ${e.message}`
          : 'Échec du téléversement.',
    }
  }

  revalidatePath(pathARevalider(cible))
  if (cible.type === 'personne') revalidatePath('/')
  else revalidatePath(`/familles/${cible.id}`)
  return { succesAt: Date.now() }
}

export async function supprimerMediaAction(mediaId: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id: mediaId } })
  if (!media) return

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(media.url)
    }
  } catch {
    // non bloquant
  }

  await prisma.media.delete({ where: { id: mediaId } })
  if (media.personId) revalidatePath(`/admin/personnes/${media.personId}`)
  if (media.familleId) revalidatePath(`/admin/familles/${media.familleId}`)
  revalidatePath('/')
}

export async function definirPhotoPrincipaleAction(
  personId: string,
  mediaId: string | null,
): Promise<void> {
  await prisma.person.update({
    where: { id: personId },
    data: { photoPrincipaleId: mediaId },
  })
  revalidatePath(`/admin/personnes/${personId}`)
  revalidatePath('/')
}
