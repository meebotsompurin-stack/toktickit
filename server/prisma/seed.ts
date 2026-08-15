import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. เพิ่มหมวดหมู่ให้ครบถ้วน
  const categories = [
    'Account and Access',
    'Hardware',
    'Software',
    'Network'
  ];

  // 2. ใช้ upsert เพื่อไม่ให้พังเวลารันซ้ำ
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name: name },
      update: {}, // ถ้ามีอยู่แล้วไม่ต้องทำอะไร
      create: { name: name }, // ถ้ายังไม่มีให้สร้างใหม่
    });
    console.log(`Upserted category: ${name}`);
  }
}

// 3. รันฟังก์ชันพร้อมจัดการ Error และปิด Connection
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });