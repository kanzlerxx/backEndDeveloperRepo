import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedForum(user) {
  const category = await prisma.categories.upsert({
    where: { categories_name: "General" },
    update: {},
    create: { categories_name: "General" }
  });

  const forum = await prisma.forum.create({
    data: {
      forum_title: "Forum Teknologi",
      forum_description: "Diskusi teknologi",
      user_id: user.id,
      id_categories: category.id,
    }
  });

  return forum;
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
