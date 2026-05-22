import bcrypt from 'bcryptjs'

/**
 * Vrai si le mot de passe correspond à l'empreinte ADMIN_PASSWORD_HASH.
 * L'empreinte est stockée encodée en base64 : l'empreinte bcrypt brute
 * contient des « $ » qui seraient interprétés comme des variables au
 * chargement du fichier .env.
 */
export async function verifierMotDePasse(motDePasse: string): Promise<boolean> {
  const encode = process.env.ADMIN_PASSWORD_HASH
  if (!encode) return false
  const empreinte = Buffer.from(encode, 'base64').toString('utf-8')
  if (!empreinte.startsWith('$2')) return false
  return bcrypt.compare(motDePasse, empreinte)
}
