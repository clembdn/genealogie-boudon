import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const COLORS = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(msg, color = 'cyan') {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

const skipDev = process.argv.includes('--no-dev');

// [1/5] Dépendances
if (!existsSync('node_modules')) {
  log('[1/5] Installation des dépendances...');
  run('npm install');
} else {
  log('[1/5] Dépendances déjà installées.');
}

// [2/5] .env
if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  log(
    'Fichier .env créé depuis .env.example. Configure DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_EMAIL et ADMIN_PASSWORD puis relance `npm run setup`.',
    'yellow'
  );
  process.exit(1);
}

// [3/5] Prisma generate
log('[2/5] Génération du client Prisma...');
run('npx prisma generate');

// [4/5] Migrations
const migrationsDir = join('prisma', 'migrations');
const hasMigrations =
  existsSync(migrationsDir) &&
  readdirSync(migrationsDir, { withFileTypes: true }).some((d) =>
    d.isDirectory()
  );

if (!hasMigrations) {
  log('[3/5] Création de la migration initiale...');
  run('npx prisma migrate dev --name init');
} else {
  log('[3/5] Application des migrations...');
  run('npx prisma migrate deploy');
}

// [5/5] Seed admin
log("[4/5] Création de l'administrateur (seed)...");
try {
  run('npm run db:seed');
} catch {
  log(
    'Échec du seed. Vérifie ADMIN_EMAIL / ADMIN_PASSWORD dans .env puis relance.',
    'red'
  );
  process.exit(1);
}

// [6/5] Dev
if (skipDev) {
  log('[5/5] Setup terminé. Lance `npm run dev` pour démarrer.', 'green');
} else {
  log('[5/5] Lancement du serveur de développement...', 'green');
  run('npm run dev');
}
