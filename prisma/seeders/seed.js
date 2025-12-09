import { PrismaClient } from '@prisma/client';

import { seedUsers } from './userSeeder.js';
import { seedForum } from './seedForum.js';
import { seedThreads } from './seedThreads.js';
import { seedHashtags } from './seedHashtags.js';
import { seedComments } from './seedComments.js';
import { seedLikes } from './seedLikes.js';
import { seedBookmarks } from './seedBookmarks.js';
import { seedFollow } from './seedFollow.js';

const prisma = new PrismaClient();

async function seedAll() {
  console.log("🚀 Mulai seeding...");

  // 1. Seed user dulu
  const user = await seedUsers();
  console.log("✔ User seeded:", user.email);

  // 2. Seed forum
  const forum = await seedForum(user);
  console.log("✔ Forum seeded");

  // 3. Seed threads
  const threads = await seedThreads(user, forum);
  console.log("✔ Threads seeded");

  // 4. Seed hashtags
  const hashtag = await seedHashtags(threads);
  console.log("✔ Hashtags seeded");

  // 5. Seed comments
  await seedComments(user, threads);
  console.log("✔ Comments seeded");

  // 6. Seed likes
  await seedLikes(user, threads);
  console.log("✔ Likes seeded");

  // 7. Seed bookmarks
  await seedBookmarks(user, threads);
  console.log("✔ Bookmarks seeded");

  // 8. Seed follow
  await seedFollow(user, forum);
  console.log("✔ Follow seeded");

  console.log("🎉 Semua seeder selesai!");
}

seedAll()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  