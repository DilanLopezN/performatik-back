import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Add your seed data here
  // Example:
  // const user = await prisma.user.upsert({
  //   where: { email: 'admin@example.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@example.com',
  //     name: 'Admin',
  //     password: 'hashedPassword',
  //     role: 'ADMIN',
  //   },
  // });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
