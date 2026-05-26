import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const motDePasse = process.argv[2]
if (!motDePasse) {
  console.error(
    'Usage : npx tsx scripts/generer-secrets-admin.ts "<mot de passe choisi>"',
  )
  process.exit(1)
}

const hash = bcrypt.hashSync(motDePasse, 12)
// L'empreinte bcrypt contient des « $ » que le chargement de .env interprète
// comme des variables : on la stocke encodée en base64 (le code la décode).
const hashEncode = Buffer.from(hash, 'utf-8').toString('base64')
const secret = randomBytes(32).toString('base64')

console.log('Ajoute (ou remplace) ces deux lignes dans ton fichier .env :\n')
console.log(`ADMIN_PASSWORD_HASH="${hashEncode}"`)
console.log(`AUTH_SECRET="${secret}"`)
