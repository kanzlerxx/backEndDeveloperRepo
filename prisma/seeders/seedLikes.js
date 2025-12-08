import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedLikes(user, threads) {
  for (const t of threads) {
    await prisma.like_threads.create({
      data: {
        user_id: 1,
        threads_id: 20,
      }
    });
  }
}
    

main()
  .then(async () => {
    await prisma.$disconnect();   // WAJIB
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();   // WAJIB
    process.exit(1);
  });
