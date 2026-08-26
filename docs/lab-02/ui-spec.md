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