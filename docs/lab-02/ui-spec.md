# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Palette
*   **Primary Green:** `#006B3C` (สำหรับ App Header, ปุ่มหลัก (Primary Actions))
*   **Secondary Green:** `#0B7A46` (สำหรับ Active Tabs, ลิงก์, และสถานะ Hover)
*   **Pale Green:** `#EAF6EF` (สำหรับ Selected, Success, และการเน้นส่วนต่างๆ แบบนุ่มนวล)
*   **Page Background:** `#F5F7F6` (สีพื้นหลังเพจ)[cite: 4]
*   **Surface/Cards:** พื้นสีขาวพร้อมขอบ (Border) บางๆ และเงา (Shadow) เล็กน้อย
*   **Text:** สีเขียวชาร์โคลเข้ม (Dark charcoal-green) สำหรับตัวหนังสือทั่วไป
*   **Error:** ข้อความและขอบสีแดงเข้ม แสดงผลใต้ฟิลด์ข้อมูลทันที

## 2. Component States & Rules
*   **Editable Field:** พื้นหลังสีขาว ขอบสีเทากลางๆ
*   **Read-only Field:** พื้นหลังสีเทา-เขียวอ่อน (Soft gray-green) เพื่อให้แยกออกชัดเจนว่าแก้ไขไม่ได้
*   **Required Field:** มีดอกจันสีแดง (*) กำกับที่ Label
*   **Submit Button:** ต้องมีสถานะ Busy (หมุนๆ กำลังโหลด) และถูก Disable ไว้ระหว่างรอ API ประมวลผล

## 3. Responsive Rules
*   **Desktop (≥ 992 px):** Layout แบบ Multi-column จัดกึ่งกลางจอและจำกัดความกว้างสูงสุด (Max-width)
*   **Tablet (768 - 991 px):** Layout แบบ 2 คอลัมน์ (Two-column) ในส่วนที่ทำได้ ช่อง Summary และ Description ต้องกว้างพอ
*   **Mobile (< 768 px):** ข้อมูลเรียงซ้อนกันแนวตั้ง (Stack vertically) ปุ่มกดต้องใหญ่พอสำหรับแตะ (Touch-friendly) และห้ามมี Scroll แนวนอนเด็ดขาด

<!-- อัปเดตเอกสาร -->