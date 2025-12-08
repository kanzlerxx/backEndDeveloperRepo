import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedFollow(user, forum) {
  await prisma.follow.create({
    data: {
      user_id: user.id,
      following_forum_id: forum.id
    }
  });
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
