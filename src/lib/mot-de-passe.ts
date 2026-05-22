import bcrypt from 'bcryptjs'

/** Vrai si le mot de passe correspond à l'empreinte ADMIN_PASSWORD_HASH. */
export async function verifierMotDePasse(motDePasse: string): Promise<boolean> {
  const empreinte = process.env.ADMIN_PASSWORD_HASH
  if (!empreinte) return false
  return bcrypt.compare(motDePasse, empreinte)
}
