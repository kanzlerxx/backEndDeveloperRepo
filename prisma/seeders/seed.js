import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder.js';
import { seedOthers } from './seedOther.js';

const prisma = new PrismaClient();

async function seedAll() {
  console.log('🚀 Memulai proses seeding...');
  await seedOthers();
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
