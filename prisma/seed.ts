import { auth } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Administrateur';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env'
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      console.log(`Utilisateur ${email} promu administrateur.`);
    } else {
      console.log(`Administrateur ${email} déjà présent.`);
    }
    return;
  }

  console.log(`Création de l'administrateur ${email}…`);
  await auth.api.signUpEmail({ body: { email, password, name } });
  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });
  console.log(`Administrateur créé : ${email}`);
}

main()
  .catch((err) => {
    console.error('Erreur lors du seed :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
