import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding data...');

  // 1. Category
  const categories = ['Hardware', 'Software', 'Network', 'Access/Account'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {}, // ถ้ามีอยู่แล้วก็ไม่ต้องทำอะไร
      create: { name }, // ถ้าไม่มีให้สร้างใหม่
    });
  }
  console.log('✅ Categories seeded.');

  // 2. RelatedSystem
  const relatedSystems = ['ERP', 'HRIS', 'CRM', 'Email', 'Intranet'];
  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ RelatedSystems seeded.');

  // 3. Requester
  // เนื่องจากฟิลด์ name ของ Requester ไม่ได้เป็น Unique จึงใช้ upsert ตรงๆ ไม่ได้
  // เราจะใช้การเช็คก่อนสร้าง (findFirst -> create) แทนเพื่อป้องกันข้อมูลซ้ำ
  const requesters = ['John Doe', 'Jane Smith', 'Bob Admin'];
  for (const name of requesters) {
    const existing = await prisma.requester.findFirst({
      where: { name }
    });
    
    if (!existing) {
      await prisma.requester.create({
        data: { name },
      });
    }
  }
  console.log('✅ Requesters seeded.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });