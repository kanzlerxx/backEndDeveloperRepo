import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedThreads(user, forum) {
  const threads = [];

  for (let i = 0; i < 15; i++) {
    const t = await prisma.threads.create({
      data: {
        user_id: user.id,
        threads_title: `Thread ke-${i+1}`,
        threads_description: `Deskripsi thread nomor ${i+1}`,
        forum_id: forum.id,
      }
    });

    threads.push(t);
  }

  return threads;
}


