import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedHashtags(threads) {
  const hashtag = await prisma.hashtags.upsert({
    where: { hashtags_name: "programming" },
    update: {},
    create: { hashtags_name: "programming" }
  });

  for (const t of threads) {
    await prisma.threads_hashtags.create({
      data: {
        threads: { connect: { id: t.id } },
        hashtags: { connect: { id: hashtag.id } }
      }
    });
  }

  return hashtag;
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
