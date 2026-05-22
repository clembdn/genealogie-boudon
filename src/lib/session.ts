import { SignJWT, jwtVerify } from 'jose'

/** Nom du cookie httpOnly portant la session administrateur. */
export const NOM_COOKIE_SESSION = 'session_admin'

function cle(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET manquant.')
  return new TextEncoder().encode(secret)
}

/** Crée un jeton de session signé, valable 30 jours. */
export async function creerJetonSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(cle())
}

/** Vrai si le jeton est présent, bien signé et non expiré. */
export async function verifierJetonSession(
  jeton: string | undefined,
): Promise<boolean> {
  if (!jeton) return false
  try {
    await jwtVerify(jeton, cle())
    return true
  } catch {
    return false
  }
}
