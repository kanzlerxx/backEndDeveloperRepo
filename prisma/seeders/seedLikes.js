import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedLikes(user, threads) {
  for (const t of threads) {
    await prisma.like_threads.create({
      data: {
        user_id: 1,
        threads_id: 1,
      }
    });
  }
}
    