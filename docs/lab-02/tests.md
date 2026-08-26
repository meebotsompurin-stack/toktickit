# Lab 2 Test Plan and Results

## 1. Test Strategy
การทดสอบจะครอบคลุมตั้งแต่ระดับ Unit, API, UI Components และ End-to-End (E2E) เพื่อให้มั่นใจว่าทุก Business Rules และ Acceptance Criteria ทำงานได้ถูกต้อง

## 2. Planned Tests
| Test ID | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| API-01 | AC-01 | สร้าง Ticket ด้วยข้อมูลที่ถูกต้องครบถ้วน | 201 Created; ระบบบันทึกข้อมูลและส่งคืน Ticket Number | `server/tests/lab-02/create-ticket.api.test.ts` | Pending |
| API-02 | AC-03 | ตรวจสอบสิทธิ์ (Ownership) เมื่อดึงข้อมูล Ticket | 403 Forbidden หรือไม่พบข้อมูล หากไม่ใช่ Ticket ของ Requester ที่ระบุ | `server/tests/lab-02/ticket-detail.api.test.ts` | Pending |
| UI-01 | BR-04 | อัปโหลดไฟล์แนบที่ไม่ใช่รูปภาพหรือ PDF | แจ้งเตือน Error ใต้ปุ่มอัปโหลด และอัปโหลดไม่สำเร็จ | `client/.../CreateTicket.test.tsx` | Pending |
| UI-02 | FR-04 | กด Submit โดยเว้นว่างช่อง Summary และ Description | แสดงข้อความ Error สีแดงใต้ฟิลด์ และฟอร์มไม่ถูกส่ง | `client/.../CreateTicket.test.tsx` | Pending |
| E2E-01 | FR-02 | ค้นหาและเรียงลำดับ Ticket ในหน้า My Tickets | แสดงเฉพาะ Ticket ที่ตรงกับคำค้นหา และเรียงตามความเร่งด่วน | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pending |

## 3. Known Limitations
- เนื่องจาก Lab 2 ยังไม่มีระบบ Authentication จริง การทดสอบจึงทำผ่าน Development Requester Context เท่านั้น
<!-- อัปเดตเอกสาร -->
