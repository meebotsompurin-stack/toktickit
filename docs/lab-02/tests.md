# Lab 2 Test Plan and Results

## 1. Test Strategy
การทดสอบจะครอบคลุมตั้งแต่ระดับ Unit, API, UI Components และ End-to-End (E2E) เพื่อให้มั่นใจว่าทุก Business Rules และ Acceptance Criteria ทำงานได้ถูกต้อง

## 2. Planned Tests
| Test ID | Category | What It Tests | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| API-01 | Ticket | สร้าง Ticket ด้วยข้อมูลที่ถูกต้องครบถ้วน | 201 Created; ระบบบันทึกข้อมูลและส่งคืน Ticket Number | Pending |
| API-02 | Ticket | ตรวจสอบสิทธิ์ (Ownership) เมื่อดึงข้อมูล Ticket | 403 Forbidden หากไม่ใช่ Ticket ของ Requester ที่ระบุ | Pending |
| API-05 | File Upload | อัปโหลดไฟล์ผิดประเภท (ตรวจจับจาก MIME Type จริงๆ ไม่ใช่นามสกุลไฟล์) | 400 Bad Request | Pending |
| API-06 | File Upload | อัปโหลดไฟล์ที่มีขนาดใหญ่เกิน 5MB (เช่น 5.1MB) | 400 Bad Request | Pending |
| API-07 | File Upload | อัปโหลดไฟล์เกินโควต้า (เช่น อัปโหลด 6 ไฟล์พร้อมกัน) | 400 Bad Request | Pending |
| API-08 | Security | ส่ง Request โดยไม่มีการแนบ Header `X-Requester-Id` หรือค่าไม่ถูกต้อง | 401 Unauthorized | Pending |
| API-09 | Security | ตรวจสอบว่าระบบบันทึก Metadata (`deletedAt`, `deletedBy`) ครบถ้วนเมื่อทำการ Soft-remove | 200 OK และตรวจสอบพบ Metadata ใน Database (`deletedBy` ตรงกับ Header) | Pending |
| API-10 | Security | จำลองสิทธิ์ Requester ธรรมดาพยายามลบไฟล์ถาวร (Hard-delete) หรือกู้คืน (Restore) | 403 Forbidden | Deferred to Lab 3 (Out of Scope: ระบบ Admin ไม่อยู่ในขอบเขตของ Lab 2) |
| UI-01 | Validation | กด Submit โดยเว้นว่างช่อง Summary และ Description | แสดงข้อความ Error สีแดงใต้ฟิลด์ | Pending |
| UI-03 | a11y | จำลองการใช้คีย์บอร์ดนำทาง (Tab) เพื่อตรวจสอบการแสดงผลของกรอบ Focus | กรอบ Focus แสดงผลชัดเจน | Pending |
| UI-04 | Responsive | E2E Test ตรวจสอบการแสดงผลบนจอมือถือ | ตารางรายการตั๋ว (Table) ถูกแปลงเป็นการ์ด (Card) อย่างถูกต้อง | Pending |

## 3. Known Limitations
- เนื่องจาก Lab 2 ยังไม่มีระบบ Authentication จริง การทดสอบจึงทำผ่าน Development Requester Context เท่านั้น