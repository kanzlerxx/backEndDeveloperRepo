import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedForum(user) {
  const category = await prisma.categories.upsert({
    where: { categories_name: "Max Verstapper" },
    update: {},
    create: { categories_name: "Max Verstapper" }
  });

  const forum = await prisma.forum.create({
    data: {
      forum_title: "The world Champion of F1",
      forum_description: "Dutch Legend Max Verstapper fans club",
      user_id: user.id,
      id_categories: category.id,
    }
  });

  return forum;
}


