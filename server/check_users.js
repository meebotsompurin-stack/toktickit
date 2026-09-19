const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log("Users in DB:");
  console.table(users);
}

check().catch(console.error).finally(() => prisma.$disconnect());
