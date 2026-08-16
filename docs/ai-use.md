# AI Use and Reflection
**Issue 1: Project Foundation**
* Prompt: ขอวิธีสร้างโครงสร้างโปรเจกต์ Backend ด้วย Express และ Prisma พร้อมวิธีตั้งค่าไฟล์ .env และสคริปต์ใน package.json ให้ทำงานร่วมกับ React (Vite)
* Reflection: ได้เรียนรู้วิธีการวางโครงสร้างเริ่มต้นของระบบ Full-stack และการตั้งค่า Environment Variables ให้ปลอดภัย ไม่หลุดเข้าไปใน Git

**Issue 2: Health Check API**
* Prompt: วิธีแก้ Error "EADDRINUSE" พอร์ต 3000 ชนกันตอนรัน Test และวิธีแก้ Syntax Error ของ React JSX ในไฟล์ App.tsx
* Reflection: เข้าใจสาเหตุและวิธีจัดการปัญหา Port Collision ระหว่างรันเทส รวมถึงการปรับแก้โครงสร้างโค้ดฝั่ง UI ให้คอมไพล์ผ่าน

**Issue 3: Category Seed**
* Prompt: วิธีเขียน Prisma Seed สำหรับข้อมูลเริ่มต้น 4 หมวดหมู่ โดยใช้คำสั่ง upsert เพื่อป้องกันข้อมูลซ้ำ และวิธีเพิ่ม @unique กับ createdAt ใน Schema
* Reflection: เห็นข้อดีของการใช้ upsert แทน create ทำให้สามารถรันคำสั่ง Seed ซ้ำได้โดยระบบไม่พัง และเข้าใจการออกแบบ Schema ให้รัดกุมขึ้น

**Issue 4: Category List UI**
* Prompt: วิธีแก้ปัญหา TypeScript Error "global.fetch" ตอนรัน Build และวิธีเขียนเทสด้วย Vitest เพื่อตรวจสอบการแสดงผลรายการหมวดหมู่ทั้ง 4 รายการ
* Reflection: ได้เรียนรู้วิธีการ Mock API (fetch) สำหรับการทำ Unit Test ฝั่ง Frontend และการใช้ Supertest ตรวจสอบความถูกต้องของการเรียงลำดับข้อมูลจาก Backend

**สรุปรายการคำสั่งทั้งหมดที่สั่งให้ Antigravity ทำงาน**
* เคลียร์ปัญหา Prisma v5 conflicts: สั่งให้ช่วยจัดการข้อขัดแย้งของเวอร์ชัน Prisma ตอนเริ่มต้นตั้งค่าโปรเจกต์
* สร้าง API Endpoints: สั่งให้เขียนและจัดการ Backend API สำหรับดึงข้อมูล Categories
* เขียน Frontend UI Tests: สั่งให้สร้างโค้ดทดสอบหน้าเว็บฝั่งผู้ใช้งาน
* แก้ไขโค้ดเพิ่ม Sorting: สั่งให้ปรับแก้โค้ดเฉพาะจุด โดยเพิ่มเงื่อนไขการเรียงลำดับข้อมูล
* อัปเดตไฟล์ Test ทั้งระบบ: สั่งให้อัปเดตโค้ดทดสอบต่างๆ ให้สอดคล้องกับโค้ดที่แก้ไป เพื่อตรวจสอบความถูกต้องและป้องกัน Error ระหว่างการพัฒนา
