# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
ส่งมอบแอปพลิเคชันสำหรับ Requester เพื่อใช้สร้าง, ค้นหา, ดูรายละเอียด Ticket และจัดการไฟล์แนบ โดยใช้ระบบจำลอง Development Requester แทนการล็อกอิน

## 2. Stakeholder Request Interpretation
IT Department ต้องการระบบให้พนักงานแจ้งปัญหา IT (Ticket) พร้อมแนบไฟล์หลักฐานได้ โดยต้องมีหน้า My Tickets สำหรับค้นหา กรอง และดูสถานะ Ticket ของตัวเอง เนื่องจากยังไม่มีระบบ Login จึงใช้หน้า Development Requester Selection แทนไปก่อน และทุกหน้าต้องใช้ดีไซน์ Zen Green Theme

## 3. Scope
*   **Included:** หน้า Create Ticket, My Tickets, Requester Ticket Detail, ระบบแนบไฟล์/ลบไฟล์แบบ Soft-remove, ระบบค้นหา/ฟิลเตอร์/แบ่งหน้า (Pagination), และการตรวจสอบสิทธิ์ความเป็นเจ้าของ Ticket
*   **Excluded:** ระบบ Authentication/Login จริง, IT Staff workflow (การจัดการคิวรับงาน), คอมเมนต์, Internal Notes, Actions Taken, ระบบจัดการแอดมิน (Admin management) และการเปลี่ยนสถานะ Ticket อื่นๆ

## 4. Functional Requirements (FR)
*   FR-01: ผู้ใช้สามารถสร้าง Ticket ใหม่โดยระบุ Category, Related System, Priority, Summary, Description และ Attachments ได้
*   FR-02: ระบบต้องรองรับการค้นหาและฟิลเตอร์ Ticket ในหน้า My Tickets
*   FR-03: ผู้ใช้สามารถดูรายละเอียด Ticket ของตัวเองและดาวน์โหลด/ลบไฟล์แนบที่อนุญาตได้
*   FR-04: เมื่อเกิดข้อผิดพลาดในการกรอกข้อมูลฟอร์ม จะต้องแสดงข้อความ Error ใต้ช่อง input นั้นๆ ทันที

## 5. Business Rules (BR)
*   BR-01: Backend เป็นผู้สร้าง Ticket Number อย่างเป็นทางการและต้องไม่ซ้ำกัน
*   BR-02: Ticket ใหม่ต้องเริ่มต้นด้วยสถานะ "New" เสมอ
*   BR-03: หน้า Development Requester ใช้สำหรับจำลองการทดสอบเท่านั้น ไม่ใช่ระบบ Authentication
*   BR-04: **Required Fields & Constraints:** ฟิลด์ Category, Requested Priority, และ Related System เป็นข้อมูลบังคับกรอก (Required) โดย Summary จำกัดความยาวสูงสุด 100 ตัวอักษร และ Description จำกัดสูงสุด 1,000 ตัวอักษร
*   BR-05: **Enum Values:** ค่า Requested Priority ที่อนุญาตคือ Low, Medium, High และ ค่า Status ที่ระบบรองรับคือ New, Open, In Progress, Resolved, Closed *(หมายเหตุ: สำหรับการพัฒนาใน Lab 2 จะจำกัดการทำงานและแสดงผลเฉพาะสถานะ "New" เท่านั้น)*
*   BR-06: **Attachment Security:** ฝั่ง Backend ต้องตรวจสอบประเภทไฟล์ที่อนุญาตจากเนื้อหา "MIME Type" ของจริงเท่านั้น ห้ามพึ่งพาการตรวจสอบจากนามสกุลไฟล์ (File Extension) ที่ส่งมาจากหน้าบ้านเพียงอย่างเดียว
*   BR-07: **Soft-removal Policy:** การลบไฟล์แนบจะเป็นแบบ Soft-removal (ไม่ลบไฟล์จริงออกจากฐานข้อมูล) โดยระบบจะต้องเก็บ Metadata ไว้ตรวจสอบย้อนหลัง (ใครเป็นคนลบ `deletedBy`, ลบเมื่อไหร่ `deletedAt`) และกำหนดให้มีเพียงบทบาท `Admin` เท่านั้นที่สามารถลบถาวร (Hard-delete) หรือกู้คืน (Restore) ได้

## 6. Data Changes (Database Schema)
โครงสร้างฐานข้อมูลที่เพิ่มขึ้นหรือเปลี่ยนแปลงใน Lab นี้:
*   **Table: Ticket**
    *   `id` (Primary Key, UUID)
    *   `ticketNumber` (String, Unique)
    *   `categoryId` (Foreign Key -> Category)
    *   `relatedSystemId` (Foreign Key -> RelatedSystem)
    *   `requestedPriority` (Enum: Low, Medium, High)
    *   `status` (Enum: New, Open, In Progress, Resolved, Closed)
    *   `summary` (String, Max 100)
    *   `description` (String, Max 1000)
    *   `requesterId` (String, Index)
    *   `createdAt`, `updatedAt` (Timestamp)
*   **Table: Attachment**
    *   `id` (Primary Key, UUID)
    *   `ticketId` (Foreign Key -> Ticket)
    *   `filename` (String)
    *   `mimetype` (String)
    *   `size` (Integer)
    *   `isRemoved` (Boolean, Default: false)
    *   `deletedBy` (String, Nullable)
    *   `deletedAt` (Timestamp, Nullable)

## 7. Acceptance Criteria (AC)
*   **AC-01:** ถ้าพิมพ์ Summary เกิน 100 ตัวอักษร ฟอร์มต้องไม่ถูกส่งและขึ้น Error สีแดงใต้ฟิลด์
*   **AC-02:** ถ้าพยายามเข้าดูตั๋วของคนอื่น (สิทธิ์ Requester ไม่ตรงกัน) API ต้องคืนค่า `403 Forbidden`
*   **AC-03:** ถ้าแอบอัปโหลดไฟล์ `.txt` แต่เปลี่ยนนามสกุลเป็น `.jpg` Backend ต้องจับได้จาก MIME Type และตอบ `400 Bad Request`
*   **AC-04:** ถ้าผู้ใช้ไม่กรอกข้อมูลฟิลด์บังคับ (Category, Related System, Priority) ระบบจะต้องแสดง Error แจ้งเตือนและไม่บันทึกข้อมูล
*   **AC-05:** ถ้าผู้ใช้พิมพ์ Description ยาวเกิน 1,000 ตัวอักษร ระบบต้องบล็อกการส่งฟอร์มและแจ้งเตือน Error
*   **AC-06:** เมื่อเข้าหน้า My Tickets ระบบต้องรองรับการแบ่งหน้า (Pagination) ตามค่า Default (page=1, limit=10) ได้อย่างถูกต้อง
*   **AC-07:** เมื่อทำการลบไฟล์แนบ (Soft-remove) ระบบจะต้องซ่อนไฟล์นั้นจากการแสดงผล และต้องมีการบันทึกค่า `deletedBy` และ `deletedAt` ลงในฐานข้อมูลเสมอ