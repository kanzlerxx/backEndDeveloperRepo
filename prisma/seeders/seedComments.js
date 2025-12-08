import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedComments(user, threads) {
  for (const t of threads) {
    await prisma.comments.create({
      data: {
        user_id: user.id,
        comment_desc: "Komentar default",
        threads_id: t.id,
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
