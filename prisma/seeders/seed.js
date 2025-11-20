import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder.js';

const prisma = new PrismaClient();

async function seedAll() {
  await seedUsers();

  console.log('✅ Semua seed berhasil.');
}

seedAll()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
