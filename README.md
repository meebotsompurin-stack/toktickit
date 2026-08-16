# TokTickIT IT Service Desk

โปรเจกต์ระบบแจ้งปัญหา IT (IT Service Desk) สำหรับรายวิชา CPE

## ข้อกำหนดเบื้องต้น (Prerequisites)
* Node.js (เวอร์ชัน 18 ขึ้นไป)
* Docker Desktop (สำหรับรันฐานข้อมูล PostgreSQL)

## การตั้งค่า Environment Variables
ทำการคัดลอกไฟล์ `.env.example` ไปเป็นไฟล์ `.env` ทั้งในโฟลเดอร์ client และ server:

cp client/.env.example client/.env
cp server/.env.example server/.env

## การเตรียมฐานข้อมูล (Database Setup)
หลังจากตั้งค่าไฟล์ `.env` เรียบร้อยแล้ว ให้เข้าไปที่โฟลเดอร์ `server` และรันคำสั่งต่อไปนี้:
1. `npx prisma migrate dev` (เพื่อสร้างโครงสร้างตารางและรัน Seed ข้อมูลหมวดหมู่เริ่มต้น)
2. `npx prisma generate` (เพื่อสร้าง Prisma Client สำหรับใช้งานในโปรเจกต์)
