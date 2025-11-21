import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedOthers() {
  // Ambil user yang kamu seed
  const user = await prisma.users.findFirst();
  if (!user) throw new Error("User belum ada, jalankan seedUsers dulu");

  // 1. Categories
  const category = await prisma.categories.upsert({
    where: { categories_name: "General" },
    update: {},
    create: { categories_name: "General" }
  });

  // 2. Forum
  const forum = await prisma.forum.create({
    data: {
      forum_title: "Forum Teknologi",
      forum_description: "Diskusi teknologi",
      user_id: user.id,
      id_categories: category.id,
    }
  });

  // 3. Threads
  const thread = await prisma.threads.create({
    data: {
      user_id: user.id,
      threads_title: "Apa itu Prisma?",
      threads_description: "Mari bahas ORM modern",
      forum_id: forum.id,
    }
  });

  // 4. Hashtags
  const hashtag = await prisma.hashtags.upsert({
    where: { hashtags_name: "programming" },
    update: {},
    create: { hashtags_name: "programming" }
  });

  await prisma.threads_hashtags.create({
    data: {
      threads_id: thread.id,
      hashtags_id: hashtag.id,
    }
  });

  // 5. Comments
  await prisma.comments.create({
    data: {
      user_id: user.id,
      comment_desc: "Penjelasan yang bagus!",
      threads_id: thread.id,
    }
  });

  // 6. Likes
  await prisma.likes.create({
    data: {
      user_id: user.id,
      threads_id: thread.id,
    }
  });

  // 7. Bookmark List
  const bookmarkList = await prisma.bookmark_list.create({
    data: {
      threads_id: thread.id
    }
  });

  // 8. Bookmark Content
  await prisma.bookmark_content.create({
    data: {
      user_id: user.id,
      bookmark_name: "My Prisma Notes",
      color: "blue",
      bookmark_list_id: bookmarkList.id
    }
  });

  // 9. Follow
  await prisma.follow.create({
    data: {
      user_id: user.id,
      following_forum_id: forum.id
    }
  });

  console.log("Seeder selain user berhasil!");
}
