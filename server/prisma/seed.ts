import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = ['Hardware', 'Software', 'Network'];

  for (const name of categories) {
    await prisma.category.create({
      data: {
        name,
      },
    });
  }
  console.log('Categories seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
