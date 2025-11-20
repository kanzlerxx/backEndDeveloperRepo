import { PrismaClient } from '@prisma/client';
import { hash } from '../../src/helpers/bcrypt.helper.js';

const prisma = new PrismaClient();

export async function seedUsers() {
  const password = await hash('Admin123');

  return await prisma.users.upsert({
    where: { email: "kontol@example.com" },
    update: {},
    create: {
      username: "Admin1",
      email: "kontol@example.com",
      password: password,
      profile_image: "https://example.com/profiles/admin1.jpg",
      bio: "el kontol ajg",
      status: true,
    },
  });
}
