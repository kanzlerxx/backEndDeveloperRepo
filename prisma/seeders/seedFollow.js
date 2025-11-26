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
