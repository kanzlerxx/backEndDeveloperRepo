import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedBookmarks(user, threads) {
  for (const t of threads) {
    const list = await prisma.bookmark_list.create({
      data: { threads_id: t.id }
    });

    await prisma.bookmark_content.create({
      data: {
        user_id: user.id,
        bookmark_name: `Bookmark thread ${t.id}`,
        color: "blue",
        bookmark_list_id: list.id
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

