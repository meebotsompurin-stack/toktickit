# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Palette
*   **Primary Green:** `#006B3C`
*   **Secondary Green:** `#0B7A46`
*   **Pale Green:** `#EAF6EF`
*   **Page Background:** `#F5F7F6`
*   **Surface/Cards:** พื้นสีขาวพร้อมขอบบางๆ และเงาเล็กน้อย
*   **Text:** สีเขียวชาร์โคลเข้ม
*   **Error:** ข้อความและขอบสีแดงเข้ม แสดงผลใต้ฟิลด์ข้อมูลทันที

## 2. Component States & Rules
*   **Editable Field:** พื้นหลังสีขาว ขอบสีเทากลางๆ
*   **Read-only Field:** พื้นหลังสีเทา-เขียวอ่อน เพื่อให้แยกออกชัดเจน
*   **Required Field:** มีดอกจันสีแดง (*) กำกับที่ Label
*   **Submit Button:** ต้องมีสถานะ Busy (หมุนๆ) และ Disable ไว้ระหว่างรอ API

## 3. Accessibility (a11y)
*   **Contrast:** สีพื้นหลังและตัวอักษรต้องมีความต่างของสี (Contrast) ที่เหมาะสมเพื่อให้ผู้ใช้อ่านได้ง่าย (WCAG AA compliance)
*   **Keyboard Navigation:** การนำทางด้วย Keyboard ต้องแสดงกรอบ Focus (Focus states) ที่ชัดเจนในทุกปุ่มและอินพุต เมื่อใช้ปุ่ม Tab
*   **ARIA Labels:** ปุ่มที่เป็นไอคอน (Icon-only buttons) จะต้องมีการใส่ `aria-label` เสมอ

## 4. Responsive & Content Management
*   **Desktop (≥ 992 px):** Layout แบบ Multi-column
*   **Tablet (768 - 991 px):** Layout แบบ 2 คอลัมน์ 
*   **Mobile (< 768 px):** ข้อมูลเรียงซ้อนแนวตั้ง ห้ามมี Scroll แนวนอน
*   **Text Truncation:** หากชื่อไฟล์แนบมีความยาวเกินพื้นที่แสดงผล ให้ตัดคำด้วยเครื่องหมาย `...` (`text-overflow: ellipsis`) และแสดง Tooltip เมื่อชี้เมาส์
*   **Mobile View (< 768 px):** การแสดงผลตารางรายการตั๋ว (Table) ในหน้า My Tickets จะต้องถูกแปลงเป็นรูปแบบการ์ด (Card) เสมอเมื่อเปิดบนหน้าจอมือถือ

## 5. Visual Inspection Checklist
ทีมทดสอบสามารถใช้ Checklist นี้ในการตรวจรับงาน UI ได้:
- [ ] ความต่างของสี (Contrast) ผ่านมาตรฐาน WCAG AA
- [ ] กดปุ่ม Tab บนคีย์บอร์ดแล้วมีกรอบ Focus ปรากฏชัดเจนทุกปุ่ม
- [ ] ปุ่มที่เป็นไอคอน (Icon-only) มีการใส่ aria-label กำกับไว้ทั้งหมด
- [ ] ชื่อไฟล์ยาวๆ ถูกตัดคำด้วย ...
- [ ] เมื่อเปิดบนมือถือ ตาราง (Table) ต้องเปลี่ยนรูปแบบเป็นการ์ด (Card) เสมอ และต้องไม่มีแถบเลื่อนแนวนอน
- [ ] กด Submit แล้วปุ่มจะโชว์ Loading spinner และโดน Disable ชั่วคราว

## 6. Advanced Features (Issue 4)
*   **Search & Filter Controls:**
    *   หน้า My Tickets จะต้องมี Control Bar ด้านบน ประกอบด้วยช่องค้นหาและ Dropdown 4 ส่วน (Category, Priority, Status, Sort By) 
    *   ใช้ Grid Layout เพื่อความ Responsive (Desktop 6 คอลัมน์, Mobile เรียงซ้อน)
    *   มีปุ่ม "Clear Filters" ให้ผู้ใช้กดย้อนกลับไปค่าเริ่มต้น
*   **Pagination:** 
    *   ส่วนท้ายตาราง My Tickets จะแสดงเลขหน้าและปุ่ม Previous / Next ที่สามารถ Disable ตัวเองได้หากอยู่หน้าแรกหรือหน้าสุดท้าย
*   **Access Denied Screen (403):** 
    *   หากเกิดข้อผิดพลาดด้านสิทธิ์ (403 Forbidden) ระบบจะต้องแสดงการ์ดสีแดงพร้อมไอคอนกากบาท (X) แจ้งข้อความ "Access Denied: You do not have permission to view this ticket." ตรงกลางหน้าจอ พร้อมปุ่มสำหรับกดย้อนกลับ