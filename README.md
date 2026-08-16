1. การตั้งค่าระบบหลังบ้าน (Backend Setup)

เข้าไปยังโฟลเดอร์ server และติดตั้ง Dependencies:
Bash

cd server
npm install

การตั้งค่า Environment Variables:

    คัดลอกไฟล์ .env.example แล้วเปลี่ยนชื่อเป็น .env

    ตั้งค่า DATABASE_URL ให้ตรงกับข้อมูลเชื่อมต่อ PostgreSQL ของคุณ

    🚨 คำเตือนความปลอดภัย: ห้าม Commit ไฟล์ .env หรือไฟล์ความลับใดๆ ขึ้น GitHub เด็ดขาด

ตรวจสอบ Prisma และเริ่มรันเซิร์ฟเวอร์:
Bash

# ตรวจสอบความถูกต้องของ Schema
npx prisma validate

# ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล
npx prisma migrate status

# เริ่มต้นรัน Backend Server
npm run dev

2. การตั้งค่าระบบหน้าบ้าน (Frontend Setup)

เปิด Terminal หน้าต่างใหม่ เข้าไปยังโฟลเดอร์ client และติดตั้ง Dependencies (รวมถึง Bootstrap):
Bash

cd client
npm install

เริ่มต้นรัน Frontend Client:
Bash

npm run dev

3. การรันชุดทดสอบ (Running Tests)

ตรวจสอบฝั่ง Backend:
เข้าไปที่โฟลเดอร์ server แล้วใช้คำสั่งรันเทส:
Bash

cd server
npm run test

ตรวจสอบฝั่ง Frontend:
เข้าไปที่โฟลเดอร์ client แล้วใช้คำสั่งรันเทส:
Bash

cd client
npm run test
