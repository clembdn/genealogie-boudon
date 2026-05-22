import { describe, it, expect, beforeAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { verifierMotDePasse } from './mot-de-passe'

beforeAll(() => {
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('bonMotDePasse', 10)
})

describe('verifierMotDePasse', () => {
  it('accepte le bon mot de passe', async () => {
    expect(await verifierMotDePasse('bonMotDePasse')).toBe(true)
  })

  it('refuse un mauvais mot de passe', async () => {
    expect(await verifierMotDePasse('mauvais')).toBe(false)
  })
})
