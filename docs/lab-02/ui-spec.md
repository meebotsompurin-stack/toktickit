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

## 3. Accessibility Requirements
*   **Focus States:** ปุ่มและ Input fields ต้องแสดง Focus ring ชัดเจนเมื่อใช้คีย์บอร์ด (Tab)
*   **Contrast:** สีพื้นหลังและตัวอักษรต้องมีความแตกต่างกัน (WCAG AA compliance)
*   **ARIA Labels:** ปุ่มที่เป็นไอคอน (Icon-only) ต้องใส่ `aria-label` บรรยายหน้าที่เสมอ

## 4. Responsive Behavior
*   **Desktop (≥ 992 px):** Layout แบบ Multi-column
*   **Tablet (768 - 991 px):** Layout แบบ 2 คอลัมน์ 
*   **Mobile (< 768 px):** ข้อมูลเรียงซ้อนแนวตั้ง ห้ามมี Scroll แนวนอน
*   **Long Filenames:** ตัดคำด้วย `text-overflow: ellipsis` (...) และแสดง Tooltip เมื่อชี้เมาส์
*   **Mobile Table:** ตาราง Ticket List ในหน้า My Tickets ต้องแปลงเป็น Card layout บนหน้าจอมือถือเสมอ