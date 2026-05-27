import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { put } from '@vercel/blob'
import { MediaType } from '@prisma/client'

const EXTENSIONS_IMAGE = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

export interface ResultatUpload {
  url: string
  contentType: string
  type: MediaType
  cleBlob: string
}

export function devinerTypeMedia(cheminFichier: string): MediaType {
  const ext = extname(cheminFichier).toLowerCase()
  if (EXTENSIONS_IMAGE.has(ext)) return 'photo'
  return 'document'
}

function devinerContentType(cheminFichier: string): string {
  const ext = extname(cheminFichier).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

export function cleBlobPourImage(slugFamille: string, cheminFichier: string): string {
  return `familles/${slugFamille}/${basename(cheminFichier)}`
}

export async function uploaderImage(
  cheminFichier: string,
  cleBlob: string,
): Promise<ResultatUpload> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN absent. Configure le token Vercel Blob avant de lancer l'import.",
    )
  }
  const contenu = await readFile(cheminFichier)
  const contentType = devinerContentType(cheminFichier)
  const blob = await put(cleBlob, contenu, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
  })
  return {
    url: blob.url,
    contentType,
    type: devinerTypeMedia(cheminFichier),
    cleBlob,
  }
}
