# Peer Review Record
## PR Issue 1
* comment: ขาดโครงสร้างไฟล์ Backend และ Prisma (Express app, package.json, schema.prisma, .env.example, scripts) และแนะนำให้ตรวจสอบนามสกุลไฟล์ Frontend (App.tsx) ให้ถูกต้อง
* responded: ดำเนินการเพิ่มโครงสร้างไฟล์ Backend, Prisma scaffold และตั้งค่า Environment ตามที่แนะนำ เพื่อเตรียมระบบให้พร้อมสำหรับ Issue ถัดไป

## PR Issue 2
* comment: ควรปรับ API test ให้ตรวจสอบข้อความ TokTickIT API มี Syntax Error ใน client/src/App.tsx ทำให้หน้าเว็บไม่แสดงผลและ Vitest รันไม่ผ่าน
* responded: แก้ไข Prisma Version ให้เชื่อมต่อฐานข้อมูลได้ตามปกติ และแก้ปัญหา Port Collision (EADDRINUSE) ที่ชนกันในโหมด Test เรียบร้อยแล้ว

## PR Issue 3
* comment: ขาดหมวดหมู่ Account and Access ในไฟล์ seed.ts, แนะนำให้ใช้คำสั่ง upsert แทน create เพื่อป้องกัน Error เมื่อรันซ้ำ, ขาดการตั้งค่า @unique ที่ฟิลด์ name และขาดฟิลด์ createdAt
* responded: เพิ่มหมวดหมู่ที่ขาดหายไป เปลี่ยนไปใช้คำสั่ง upsert สำหรับการ Seed ข้อมูล และอัปเดต Schema โดยเพิ่ม @unique กับ createdAt ครบถ้วน

## PR Issue 4
* comment: แนะนำให้แก้ global.fetch เป็น globalThis.fetch เพื่อแก้ปัญหา TypeScript Error ตอน Build, ปรับ Supertest ให้ตรวจสอบชื่อหมวดหมู่ตามลำดับที่ Seed ไว้, และต้องนำ .env ออกจาก Git พร้อมทำไฟล์ .env.example
* responded: แก้เป็น globalThis.fetch ทำให้รัน Build ผ่าน, อัปเดตโค้ด Supertest ให้ตรวจสอบข้อมูลครบทั้ง 4 รายการตามลำดับ, และจัดการนำ .env ใส่ .gitignore พร้อมสร้าง .env.example เรียบร้อย

## Review ให้เพื่อนคนที่ 1
* Issue 2: แนะนำให้เพื่อนเช็คเรื่อง Port 3000 ที่อาจจะชนกันตอนรันเทส และให้ลองลบ node_modules แล้วลงใหม่เพื่อแก้ปัญหา Prisma Client ไม่ซิงค์กับฐานข้อมูล
* Issue 3: ตรวจสอบไฟล์ seed.ts พบว่าลืมใส่ฟิลด์ createdAt ตามที่ Schema กำหนดไว้ ทำให้ตอนรันคำสั่ง Seed แจ้งเตือน Error
* Issue 4: โค้ดแสดงผลรายการหมวดหมู่ถูกต้องแล้ว แต่เตือนให้เพื่อนอย่าลืมแก้ global.fetch เป็น globalThis.fetch ในไฟล์เทสต์ด้วย เพื่อให้ตอน Build ระบบไม่ติด TypeScript Error

## Review ให้เพื่อนคนที่ 2
* Issue 2: แนะนำให้เพื่อนเช็คการเขียน Regex ใน API Test ว่าครอบคลุมตัวอักษรพิมพ์เล็ก-ใหญ่ถูกต้องไหม เพื่อป้องกันเทสรันไม่ผ่านในอนาคต
* Issue 3: แจ้งเพื่อนว่าในไฟล์ schema.prisma ลืมตั้งค่า @unique ที่ฟิลด์ name ของ Category ซึ่งอาจทำให้มีข้อมูลหมวดหมู่ชื่อซ้ำกันในระบบได้
