# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
(มาจากโจทย์[cite: 4]) ส่งมอบแอปพลิเคชันสำหรับ Requester เพื่อใช้สร้าง, ค้นหา, ดูรายละเอียด Ticket และจัดการไฟล์แนบ โดยใช้ระบบจำลอง Development Requester แทนการล็อกอิน

## 2. Stakeholder Request Interpretation
(สรุปจากโจทย์ด้วยภาษาตัวเอง[cite: 4]) IT Department ต้องการระบบให้พนักงานแจ้งปัญหา IT (Ticket) พร้อมแนบไฟล์หลักฐานได้ โดยต้องมีหน้า My Tickets สำหรับค้นหา กรอง และดูสถานะ Ticket ของตัวเอง เนื่องจากยังไม่มีระบบ Login จึงใช้หน้า Development Requester Selection แทนไปก่อน และทุกหน้าต้องใช้ดีไซน์ Zen Green Theme

## 3. Scope
(มาจากโจทย์ระบุชัดเจน[cite: 4])
*   **Included:** หน้า Create Ticket, My Tickets, Requester Ticket Detail, ระบบแนบไฟล์/ลบไฟล์แบบ Soft-remove, ระบบค้นหา/ฟิลเตอร์/แบ่งหน้า (Pagination), และการตรวจสอบสิทธิ์ความเป็นเจ้าของ Ticket
*   **Excluded:** ระบบ Authentication/Login จริง, IT Staff workflow (การจัดการคิวรับงาน), คอมเมนต์, Internal Notes, Actions Taken, และการเปลี่ยนสถานะ Ticket อื่นๆ

## 4. Functional Requirements (FR)
(นำมาจากโจทย์[cite: 4] และคิดเพิ่มบางส่วน)
*   FR-01: ผู้ใช้สามารถสร้าง Ticket ใหม่โดยระบุ Category, Related System, Priority, Summary, Description และ Attachments ได้ (จากโจทย์[cite: 4])
*   FR-02: ระบบต้องรองรับการค้นหาและฟิลเตอร์ Ticket ในหน้า My Tickets (จากโจทย์[cite: 4])
*   FR-03: ผู้ใช้สามารถดูรายละเอียด Ticket ของตัวเองและดาวน์โหลด/ลบไฟล์แนบที่อนุญาตได้ (จากโจทย์[cite: 4])
*   FR-04: (คิดเพิ่ม) เมื่อเกิดข้อผิดพลาดในการกรอกข้อมูลฟอร์ม จะต้องแสดงข้อความ Error ใต้ช่อง input นั้นๆ ทันที

## 5. Business Rules (BR)
(นำมาจากโจทย์[cite: 4] และคิดเพิ่ม)
*   BR-01: Backend เป็นผู้สร้าง Ticket Number อย่างเป็นทางการและต้องไม่ซ้ำกัน (จากโจทย์[cite: 4])
*   BR-02: Ticket ใหม่ต้องเริ่มต้นด้วยสถานะ "New" เสมอ (จากโจทย์[cite: 4])
*   BR-03: หน้า Development Requester ใช้สำหรับจำลองการทดสอบเท่านั้น ไม่ใช่ระบบ Authentication (จากโจทย์[cite: 4])
*   BR-04: ไฟล์แนบต้องเป็นประเภท JPG, PNG, WEBP, PDF ขนาดไม่เกิน 5MB และแนบได้สูงสุด 5 ไฟล์ต่อ 1 Ticket (จากโจทย์[cite: 4])
*   BR-05: (คิดเพิ่ม) ไฟล์ที่ถูกลบแบบ Soft-removal จะยังคงแสดงชื่อในระบบประวัติ แต่ไม่สามารถดาวน์โหลดหรือดูตัวอย่างได้
