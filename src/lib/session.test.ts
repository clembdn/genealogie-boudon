import { describe, it, expect, beforeAll } from 'vitest'
import { creerJetonSession, verifierJetonSession } from './session'

beforeAll(() => {
  process.env.AUTH_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
})

describe('jeton de session', () => {
  it('valide un jeton fraichement cree', async () => {
    const jeton = await creerJetonSession()
    expect(await verifierJetonSession(jeton)).toBe(true)
  })

  it('refuse une valeur qui n est pas un jeton', async () => {
    expect(await verifierJetonSession('pas.un.jeton')).toBe(false)
  })

  it('refuse un jeton absent', async () => {
    expect(await verifierJetonSession(undefined)).toBe(false)
  })
})
