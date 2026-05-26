'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { MediaType } from '@prisma/client'
import { prisma } from '@/lib/db'

export type EtatUpload = { erreur?: string; succesAt?: number } | null

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024 // 10 Mo

function deviner(fichier: File): MediaType {
  if (fichier.type.startsWith('image/')) return 'photo'
  if (fichier.type.startsWith('audio/')) return 'audio'
  return 'document'
}

export async function uploaderMediaAction(
  personId: string,
  _prev: EtatUpload,
  formData: FormData,
): Promise<EtatUpload> {
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
  const description =
    formData.get('description')?.toString().trim() || null
  const date = formData.get('date')?.toString().trim() || null
  const type = deviner(fichier)

  const cheminBlob = `personnes/${personId}/${Date.now()}-${fichier.name}`

  try {
    const blob = await put(cheminBlob, fichier, {
      access: 'public',
      addRandomSuffix: false,
    })
    await prisma.media.create({
      data: {
        personId,
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

  revalidatePath(`/admin/personnes/${personId}`)
  revalidatePath('/')
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
    // Échec de suppression Blob non bloquant : on supprime la métadonnée
    // (sinon l'admin reste bloqué sur un fichier orphelin côté Blob).
  }

  await prisma.media.delete({ where: { id: mediaId } })
  revalidatePath(`/admin/personnes/${media.personId}`)
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
