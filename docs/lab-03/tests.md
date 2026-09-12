# Lab 3 Test Plan and Results

## 1. Test Strategy
กลยุทธ์การทดสอบใน Lab 3 จะครอบคลุมระบบความปลอดภัย การพิสูจน์ตัวตน (Authentication), การควบคุมสิทธิ์ตามบทบาท (RBAC), เวิร์กโฟลว์ของเจ้าหน้าที่ไอที, ระบบจัดการผู้ใช้ของแอดมิน ตลอดจนการทดสอบความเข้ากันได้ย้อนหลัง (Regression Testing) ของฝั่ง Requester โดยแบ่งออกเป็น:
*   **Unit & API Integration Tests:** ใช้ Vitest และ Supertest สำหรับทดสอบ Controller, Service, Middleware และ Database queries
*   **Component UI Tests:** ใช้ Vitest ร่วมกับ React Testing Library ตรวจสอบการเรนเดอร์หน้าจอ, สถานะฟอร์ม, และบทบาทการแสดงผล
*   **End-to-End (E2E) Tests:** ใช้ Playwright จำลองการเข้าใช้งานจริงผ่านเบราว์เซอร์ ทั้งมุมมองของ Requester, IT Staff และ Administrator

---

## 2. Test Execution Matrix

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Unit/API | AC-01 | ส่ง Username และ Password ที่ถูกต้องมายัง `/api/auth/login` | HTTP 200 พร้อม JWT Access Token และข้อมูล Profile ของผู้ใช้ | `server/src/__tests__/auth.test.ts` | Pending |
| **AUTH-02** | Unit/API | AC-02 | ส่ง Password ไม่ถูกต้องมายัง `/api/auth/login` | HTTP 401 Unauthorized พร้อมข้อความเตือนที่ปลอดภัย | `server/src/__tests__/auth.test.ts` | Pending |
| **AUTH-03** | Unit/API | AC-03 | ล็อกอินด้วยบัญชีที่ถูกปิดการใช้งาน (`isActive = false`) | HTTP 403 Forbidden ไม่อนุญาตให้ออก Token | `server/src/__tests__/auth.test.ts` | Pending |
| **AUTH-04** | Unit/API | AC-04 | ผู้ใช้ที่มี `requiresPasswordChange = true` เปลี่ยนรหัสผ่านสำเร็จ | HTTP 200 และแฟล็ก `requiresPasswordChange` กลายเป็น `false` | `server/src/__tests__/auth.test.ts` | Pending |
| **AUTH-05** | E2E | AC-01 | กรอกรหัสผ่านเข้าสู่ระบบผ่านหน้าจอ Login (`/login`) | ระบบจัดเก็บ Token ลง LocalStorage และพาเข้าสู่หน้า Dashboard ตาม Role | `e2e/lab-03/auth-flow.spec.ts` | Pending |
| **AUTH-06** | E2E | AC-04 | ล็อกอินครั้งแรกด้วยบัญชีใหม่ที่มีสิทธิ์เปลี่ยนรหัสผ่าน | ระบบตรวจพบแฟล็กและบังคับ Redirect ไปหน้า `/change-password` ทันที | `e2e/lab-03/auth-flow.spec.ts` | Pending |
| **AUTH-07** | E2E | AC-05 | ผู้ใช้กดปุ่ม Logout ที่แถบด้านบนของหน้าเว็บ | Token ถูกลบออกจาก LocalStorage และระบบพากลับสู่หน้า Login | `e2e/lab-03/auth-flow.spec.ts` | Pending |
| **STAFF-01** | Unit/API | AC-06 | เจ้าหน้าที่ไอทีดึงข้อมูลคิวงานผ่าน `GET /api/staff/tickets` | HTTP 200 ได้รับรายการตั๋วทั้งหมดในระบบพร้อมข้อมูล Pagination | `server/src/__tests__/staff-ticket.test.ts` | Pending |
| **STAFF-02** | Unit/API | AC-06 | คัดกรองตั๋วที่ยังไม่มีผู้รับผิดชอบ (`unassigned=true`) | คืนค่าเฉพาะตั๋วที่มีค่า `ownerId` เป็น `null` | `server/src/__tests__/staff-ticket.test.ts` | Pending |
| **STAFF-03** | Unit/API | AC-07 | เจ้าหน้าที่ไอทีกดรับงาน `PATCH /api/staff/tickets/:id/owner` | HTTP 200 และ `ownerId` ของตั๋วเปลี่ยนเป็น ID ของเจ้าหน้าที่ผู้เรียก | `server/src/__tests__/staff-ticket.test.ts` | Pending |
| **STAFF-04** | Unit/API | AC-08 | เจ้าหน้าที่ไอทีประเมินและปรับระดับความสำคัญ `itPriority` | HTTP 200 ค่า `itPriority` บันทึกลงฐานข้อมูลถูกต้อง | `server/src/__tests__/staff-ticket.test.ts` | Pending |
| **STAFF-05** | Unit/API | AC-08 | ปรับเปลี่ยนสถานะตั๋วตามวงจรงาน (`New` -> `Open` -> `Resolved`) | HTTP 200 สถานะตั๋วอัปเดตเป็นค่าใหม่อย่างเป็นทางการ | `server/src/__tests__/staff-ticket.test.ts` | Pending |
| **STAFF-06** | Unit/API | AC-09 | เจ้าหน้าที่ไอทีบันทึกข้อความภายใน (`type: "INTERNAL"`) | HTTP 201 บันทึกสำเร็จและผูกความสัมพันธ์กับตั๋วถูกต้อง | `server/src/__tests__/comments.test.ts` | Pending |
| **STAFF-07** | E2E | AC-06,07 | Flow เจ้าหน้าที่ไอทีเข้าดู Queue, ค้นหาตั๋ว, กด Claim งาน และปรับสถานะ | ข้อมูลบนหน้าจออัปเดตแบบ Real-time และแสดงชื่อผู้ดูแลชัดเจน | `e2e/lab-03/staff-flow.spec.ts` | Pending |
| **STAFF-08** | E2E | AC-09 | เจ้าหน้าที่เขียนทั้ง Public Comment และ Internal Note บนตั๋ว | หน้าจอแสดงผลทั้ง 2 ข้อความโดย Internal Note มีแถบเตือนสีส้มชัดเจน | `e2e/lab-03/staff-flow.spec.ts` | Pending |
| **ADMIN-01** | Unit/API | AC-14 | ผู้ใช้ทั่วไป (Requester/ITStaff) พยายามเรียก `GET /api/admin/users` | HTTP 403 Forbidden ถูกบล็อกโดย Admin RBAC Middleware | `server/src/__tests__/admin-rbac.test.ts` | Pending |
| **ADMIN-02** | Unit/API | AC-15 | ผู้ดูแลระบบสร้างบัญชีผู้ใช้ใหม่ผ่าน `POST /api/admin/users` | HTTP 201 บัญชีถูกสร้างใน DB พร้อม `requiresPasswordChange = true` | `server/src/__tests__/admin-users.test.ts` | Pending |
| **ADMIN-03** | Unit/API | AC-16 | ผู้ดูแลระบบสลับปิดการใช้งานบัญชี (`isActive: false`) | HTTP 200 และผู้ใช้รายนั้นไม่สามารถใช้ Token ส่งคำขอใหม่ได้ | `server/src/__tests__/admin-users.test.ts` | Pending |
| **ADMIN-04** | Unit/API | AC-17 | ผู้ดูแลระบบรีเซ็ตรหัสผ่านของผู้ใช้ผ่าน `PATCH /api/admin/users/:id/password` | HTTP 200 รหัสผ่านเปลี่ยนใหม่และแฟล็กบังคับเปลี่ยนรหัสถูกเปิด | `server/src/__tests__/admin-users.test.ts` | Pending |
| **ADMIN-05** | E2E | AC-15,16 | แอดมินเข้าหน้า `/admin/users`, สร้างพนักงานใหม่ และทดลองปิดสถานะ | บัญชีปรากฏในตารางถูกต้อง และสถานะ Badge เปลี่ยนเป็น Inactive | `e2e/lab-03/admin-flow.spec.ts` | Pending |
| **REQ-01** | Unit/API | AC-10 | Requester เข้าดูตั๋วของผู้อื่นผ่าน `GET /api/tickets/:id` | HTTP 403 Forbidden แม้จะมี Token ก็ตาม | `server/src/__tests__/ticket-auth.test.ts` | Pending |
| **REQ-02** | Unit/API | AC-11,12 | Requester ดึงคอมเมนต์ของตั๋วผ่าน `GET /api/tickets/:id/comments` | HTTP 200 ได้รับเฉพาะ Public Comments ห้ามมี Internal Notes ปะปน | `server/src/__tests__/comments.test.ts` | Pending |
| **REQ-03** | Unit/API | AC-12 | Requester พยายามแอบสร้างคอมเมนต์แบบ `type: "INTERNAL"` | HTTP 403 Forbidden ถูกปฏิเสธสิทธิ์ทันที | `server/src/__tests__/comments.test.ts` | Pending |
| **REQ-04** | Unit/API | AC-13 | Requester กดส่งสัญญาณปัญหาคลี่คลาย (`/resolution-flag`) | HTTP 200 ค่า `appearsResolved` กลายเป็น `true` (สถานะตั๋วไม่เปลี่ยน) | `server/src/__tests__/requester-actions.test.ts` | Pending |
| **REQ-05** | E2E | AC-10..13 | Regression E2E: Requester สร้างตั๋ว, แนบไฟล์, คุย Public Comment และกด Appears Resolved | ตั๋วถูกสร้างสมบูรณ์, ไฟล์แนบดาวน์โหลดได้, ไม่เห็นข้อความลับของไอที | `e2e/lab-03/requester-flow.spec.ts` | Pending |

---

## 3. Test Execution Environment & Prerequisites
1. **Database Seeding:** สำหรับการทดสอบ ต้องมีการรันคำสั่ง `npx prisma db seed` เพื่อสร้างบัญชีทดสอบเริ่มต้นอย่างน้อย 3 บัญชี:
   *   `admin` (Role: `Administrator`, Password: `Password123!`, `requiresPasswordChange: false`)
   *   `itstaff` (Role: `ITStaff`, Password: `Password123!`, `requiresPasswordChange: false`)
   *   `requester` (Role: `Requester`, Password: `Password123!`, `requiresPasswordChange: false`)
   *   `newuser` (Role: `Requester`, Password: `TempPass123!`, `requiresPasswordChange: true`)
2. **Backward Compatibility Verification:** ข้อมูลเดิมจาก Lab 2 (ตั๋ว `TKT-xxxx` และไฟล์แนบในไดเรกทอรี `uploads/`) จะต้องเข้าถึงและเปิดดูได้ตามปกติหลังจากรัน Migration
