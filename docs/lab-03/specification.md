# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
แทนที่ระบบจำลองสิทธิ์ (Dev Requester Selector) ใน Lab 2 ด้วยระบบยืนยันตัวตนและความปลอดภัยเต็มรูปแบบ (Secure Authentication & RBAC) พร้อมเพิ่มเวิร์กโฟลว์สำหรับเจ้าหน้าที่ไอที (IT Staff Queue & Ticket Triage) และระบบบริหารจัดการผู้ใช้สำหรับผู้ดูแลระบบ (Admin User Management) โดยต้องรักษาความเข้ากันได้ย้อนหลัง (Backward Compatibility) และไม่ส่งผลกระทบต่อข้อมูลเดิมจาก Lab 2

---

## 2. Stakeholder Request Interpretation
ฝ่ายบริหารไอทีและผู้มีส่วนได้ส่วนเสีย (Stakeholders) ต้องการยกระดับระบบ TokTickIT ให้เป็นระบบจัดการงานบริการไอทีที่ใช้งานได้จริงในองค์กร โดยมีประเด็นสำคัญดังนี้:
1. **Real User Accounts & Authentication:** พนักงานทุกคนต้องมีบัญชีผู้ใช้งานจริงพร้อมรหัสผ่านที่ปลอดภัย ยกเลิกการเลือกชื่อผู้ใช้แบบจำลองใน Dev Mode
2. **Mandatory First-Time Password Change:** บัญชีที่ผู้ดูแลระบบสร้างขึ้นใหม่หรือได้รับการรีเซ็ตรหัสผ่าน จะต้องถูกบังคับให้เปลี่ยนรหัสผ่านทันทีเมื่อเข้าสู่ระบบครั้งแรก ก่อนที่จะเข้าถึงหน้าจอการทำงานอื่นได้
3. **IT Staff Workflows:** เจ้าหน้าที่ไอทีต้องมีหน้าจอรวมคิวงาน (IT Staff Queue) เพื่อดูตั๋วทั้งหมดในระบบ คัดกรองงานที่ยังไม่มีผู้รับผิดชอบ (Unassigned) จัดลำดับความสำคัญตามมุมมองของไอที (IT Priority) ปรับสถานะงาน (Status Progression) และบันทึกข้อความภายใน (Internal Notes) ที่ผู้แจ้งปัญหา (Requester) มองไม่เห็น
4. **Minimalist Admin Management:** ผู้ดูแลระบบต้องการหน้าจอที่กระชับ เรียบง่าย สำหรับสร้างผู้ใช้ใหม่ กำหนดบทบาท ปิดการใช้งานบัญชี (Deactivate) และรีเซ็ตรหัสผ่าน โดยไม่ต้องซับซ้อนเกินความจำเป็น

---

## 3. Scope
*   **Included (สิ่งที่ครอบคลุมในสปรินต์นี้):**
    *   ระบบการยืนยันตัวตน (Authentication) ด้วย JWT Bearer Token (Login, Logout, Get Current User, Change Password)
    *   ระบบบทบาทผู้ใช้งาน 3 ระดับ (Roles): `Requester`, `ITStaff`, `Administrator`
    *   ระบบบังคับเปลี่ยนรหัสผ่านครั้งแรก (`requiresPasswordChange = true`)
    *   เวิร์กโฟลว์ฝั่ง IT Staff: หน้ารวมคิวตั๋ว (Queue), หน้ารายละเอียดตั๋วสำหรับเจ้าหน้าที่, การเคลม/มอบหมายเจ้าของตั๋ว (`ownerId`), การกำหนดความสำคัญของไอที (`itPriority`), การปรับเปลี่ยนสถานะตั๋ว
    *   ระบบข้อความและการสื่อสาร: ความคิดเห็นสาธารณะ (Public Comments) และบันทึกช่วยจำภายใน (Internal Notes สำหรับ Staff/Admin)
    *   ระบบจัดการผู้ใช้สำหรับผู้ดูแลระบบ (Admin User Management): การแสดงรายชื่อ, สร้างผู้ใช้ใหม่, สลับสถานะเปิด/ปิดใช้งาน (`isActive`), รีเซ็ตรหัสผ่าน
    *   การรักษาความเข้ากันได้ของข้อมูลเดิมจาก Lab 2 (Database Migration & Preservation)
*   **Excluded (สิ่งที่อยู่นอกขอบเขตของสปรินต์นี้):**
    *   ระบบส่งอีเมลแจ้งเตือนภายนอก (Email Notifications / SMTP)
    *   การยืนยันตัวตนแบบหลายปัจจัย (Multi-Factor Authentication / MFA)
    *   ระบบลงทะเบียนผู้ใช้ด้วยตนเอง (Self-registration / Public Sign-up)
    *   การลบข้อมูลผู้ใช้ออกจากฐานข้อมูลอย่างถาวร (Hard User Deletion) - ใช้การสลับสถานะ `isActive = false` เท่านั้น
    *   การกำหนดผู้ใช้หนึ่งคนให้มีหลายบทบาทพร้อมกัน (Multiple Roles per User)

---

## 4. Functional Requirements (FR)

### 4.1 Authentication & Session Management
*   **FR-01 (User Login):** ผู้ใช้สามารถเข้าสู่ระบบด้วย Username/Email และ Password ผ่านหน้า Login
*   **FR-02 (Session Validation):** เมื่อเปิดเว็บ ระบบต้องตรวจสอบความถูกต้องของ Token ผ่าน `/api/auth/me` และดึงข้อมูล Profile ของผู้ใช้ปัจจุบันมาแสดงผล
*   **FR-03 (Forced Password Change):** หากบัญชีมีค่า `requiresPasswordChange = true` ระบบต้องบังคับพาผู้ใช้ไปยังหน้าจอเปลี่ยนรหัสผ่านทันที และบล็อกการเข้าถึงหน้าจออื่นๆ จนกว่าจะเปลี่ยนรหัสผ่านสำเร็จ
*   **FR-04 (User Logout):** ผู้ใช้สามารถออกจากระบบได้ทุกเมื่อ โดยระบบจะล้าง Token และข้อมูล Session ฝั่ง Client ทิ้งทั้งหมด

### 4.2 IT Staff Workflows
*   **FR-05 (Staff Ticket Queue):** เจ้าหน้าที่ไอทีสามารถดูรายการตั๋วทั้งหมดในระบบ ค้นหา และกรองตามสถานะ (Status), ลำดับความสำคัญ (Priority), หรือตั๋วที่ยังไม่มีผู้รับผิดชอบ (Unassigned) ได้
*   **FR-06 (Ticket Assignment):** เจ้าหน้าที่ไอทีสามารถกดรับงาน (Claim ticket) เพื่อตั้งตนเองเป็นเจ้าของตั๋ว หรือมอบหมายตั๋วให้เจ้าหน้าที่ท่านอื่นได้
*   **FR-07 (Triage Priority):** เจ้าหน้าที่ไอทีสามารถกำหนดหรือปรับเปลี่ยนค่า `itPriority` (Low, Medium, High) ได้แยกต่างหากจาก `requestedPriority` ที่ผู้แจ้งระบุมา
*   **FR-08 (Status Progression):** เจ้าหน้าที่ไอทีสามารถอัปเดตสถานะของตั๋วตามวงจรการทำงาน (`New` -> `Open` -> `InProgress` -> `Resolved` -> `Closed`)
*   **FR-09 (Internal Notes):** เจ้าหน้าที่ไอทีและแอดมินสามารถเพิ่มและอ่านบันทึกช่วยจำภายใน (Internal Notes) ในหน้า Ticket Detail ได้ โดยข้อมูลนี้จะไม่ถูกส่งให้ Requester เห็น

### 4.3 Requester Operations & Comments
*   **FR-10 (Public Comments):** ผู้แจ้งและเจ้าหน้าที่ไอทีสามารถแลกเปลี่ยนข้อความผ่าน Public Comments บนหน้า Ticket Detail ได้
*   **FR-11 (Resolution Confirmation):** ผู้แจ้งสามารถกดปุ่มยืนยันว่าปัญหาได้รับการแก้ไขแล้ว ("Appears Resolved") เพื่อแจ้งให้เจ้าหน้าที่ไอทีทราบ

### 4.4 Administrator Management
*   **FR-12 (User List):** ผู้ดูแลระบบสามารถดูรายชื่อผู้ใช้ทั้งหมด ค้นหาตามชื่อหรือบทบาท และตรวจสอบสถานะการเปิดใช้งานได้
*   **FR-13 (Create User):** ผู้ดูแลระบบสามารถสร้างบัญชีผู้ใช้ใหม่ กำหนดบทบาท และสร้างรหัสผ่านชั่วคราว (Temporary Password) ได้
*   **FR-14 (Toggle User Status):** ผู้ดูแลระบบสามารถเปิดหรือปิดการใช้งานบัญชีผู้ใช้ (`isActive = true/false`) ได้
*   **FR-15 (Reset Password):** ผู้ดูแลระบบสามารถรีเซ็ตรหัสผ่านของผู้ใช้ และกำหนดให้ต้องเปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งถัดไปได้

---

## 5. Business Rules (BR)
*   **BR-01 (Active User Constraint):** เฉพาะผู้ใช้ที่มีสถานะเปิดใช้งาน (`isActive === true`) เท่านั้นที่สามารถล็อกอินและส่งคำขอเข้าใช้งาน API ได้ หากบัญชีถูกปิดการใช้งาน ระบบต้องปฏิเสธด้วย `401 Unauthorized` หรือ `403 Forbidden`
*   **BR-02 (Mandatory Password Change):** หากผู้ใช้มีแฟล็ก `requiresPasswordChange === true` ระบบจะไม่อนุญาตให้เข้าถึง API ใดๆ นอกเหนือจาก Endpoint สำหรับการเปลี่ยนรหัสผ่านและตรวจสอบข้อมูลส่วนตัว (`/api/auth/change-password` และ `/api/auth/me`)
*   **BR-03 (Token-Based Identity & Ownership):** การระบุตัวตนของผู้ใช้และสิทธิ์การเป็นเจ้าของตั๋วจะต้องดึงมาจาก JWT Bearer Token ที่ผ่านการถอดรหัสและตรวจสอบความถูกต้องแล้วเท่านั้น ยกเลิกการส่งและเชื่อถือ Header `X-Requester-Id` จาก Client โดยสิ้นเชิง
*   **BR-04 (Comment Visibility & Confidentiality):** 
    *   **Public Comments:** เป็นข้อมูลสาธารณะที่มองเห็นได้ทั้งผู้แจ้ง (Requester), เจ้าหน้าที่ไอที (IT Staff) และผู้ดูแลระบบ (Admin)
    *   **Internal Notes:** เป็นความลับภายในทีมไอที อนุญาตให้เฉพาะผู้มีบทบาท `ITStaff` และ `Administrator` เท่านั้นที่สามารถสร้างและมองเห็นได้ ห้ามส่งข้อมูลนี้ใน Response ให้กับ Requester โดยเด็ดขาด
*   **BR-05 (Resolution Authority):** Requester ไม่มีสิทธิ์ปรับสถานะทางการของตั๋วเป็น `Resolved` หรือ `Closed` โดยตรง สามารถทำได้เพียงส่งสัญญานหรือกด Flag ว่า "Appears Resolved" เพื่อให้เจ้าหน้าที่ไอทีตรวจสอบและปิดงานอย่างเป็นทางการ

---

## 6. Authorization Matrix (RBAC)

| Resource / Action | Requester | IT Staff | Administrator | รายละเอียด / เงื่อนไข |
| :--- | :---: | :---: | :---: | :--- |
| **Auth / Change Own Password** | ✔ | ✔ | ✔ | ผู้ใช้ทุกคนเปลี่ยนรหัสผ่านของตนเองได้ |
| **View Own Tickets (My Tickets)** | ✔ | ✔ | ✔ | ดูเฉพาะตั๋วที่ตนเองเป็นผู้แจ้ง |
| **Create Ticket** | ✔ | ✔ | ✔ | ผู้ใช้ทุกคนสามารถแจ้งปัญหาได้ |
| **View All Tickets (IT Queue)** | ❌ | ✔ | ✔ | สงวนสิทธิ์เฉพาะฝ่ายไอทีและแอดมิน |
| **Claim / Assign Ticket Owner** | ❌ | ✔ | ✔ | กำหนดหรือเปลี่ยนตัวผู้รับผิดชอบตั๋ว |
| **Triage / Update IT Priority** | ❌ | ✔ | ✔ | ปรับค่าความสำคัญทางเทคนิค |
| **Update Ticket Status (Resolve/Close)** | ❌ | ✔ | ✔ | เปลี่ยนสถานะของงานตามขั้นตอน |
| **Flag "Appears Resolved"** | ✔ | ❌ | ❌ | ผู้แจ้งกดเพื่อแจ้งว่าปัญหาคลี่คลายแล้ว |
| **Create / View Public Comments** | ✔ | ✔ | ✔ | คอมเมนต์พูดคุยแลกเปลี่ยนบนตั๋ว |
| **Create / View Internal Notes** | ❌ | ✔ | ✔ | บันทึกช่วยจำภายในทีมไอที |
| **View Users List** | ❌ | ❌ | ✔ | หน้าจัดการบัญชีผู้ใช้ |
| **Create User / Set Role** | ❌ | ❌ | ✔ | สร้างผู้ใช้และกำหนดบทบาท |
| **Toggle User Status (`isActive`)** | ❌ | ❌ | ✔ | พักการใช้งานหรือเปิดใช้งานบัญชี |
| **Reset User Password** | ❌ | ❌ | ✔ | กำหนดรหัสผ่านใหม่ให้ผู้ใช้ |

---

## 7. Database Changes (Schema Evolution)

เพื่อให้ระบบรองรับฟีเจอร์ใหม่และรักษาข้อมูลเดิมจาก Lab 2 จะต้องปรับปรุง Prisma Schema ดังนี้:

### 7.1 New & Updated Enums
```prisma
enum Role {
  Requester
  ITStaff
  Administrator
}

enum CommentType {
  PUBLIC
  INTERNAL
}
```

### 7.2 Updated User Model
สร้าง Model `User` เพื่อใช้เป็นแกนหลักของการตรวจสอบสิทธิ์:
*   `id`: String (UUID, Primary Key)
*   `username`: String (Unique)
*   `name`: String
*   `passwordHash`: String
*   `role`: Role (Default: `Requester`)
*   `isActive`: Boolean (Default: `true`)
*   `requiresPasswordChange`: Boolean (Default: `true`)
*   `createdAt`, `updatedAt`: DateTime

### 7.3 Ticket Model Enhancements
ปรับปรุง Model `Ticket` เพื่อเชื่อมโยงกับระบบสิทธิ์ใหม่:
*   `requesterId`: String (FK -> User.id) แทนที่ Requester ชั่วคราวเดิม
*   `ownerId`: String? (Nullable, FK -> User.id) สำหรับระบุ IT Staff ที่รับผิดชอบ
*   `itPriority`: Priority? (Nullable) สำหรับการประเมินระดับความสำคัญของไอที
*   `appearsResolved`: Boolean (Default: `false`) เก็บ Flag การยืนยันจาก Requester

### 7.4 TicketComment Model
สร้าง Model ใหม่สำหรับข้อความความคิดเห็นและบันทึกช่วยจำ:
*   `id`: String (UUID, Primary Key)
*   `ticketId`: String (FK -> Ticket.id)
*   `authorId`: String (FK -> User.id)
*   `type`: CommentType (Default: `PUBLIC`)
*   `content`: String (Text)
*   `createdAt`, `updatedAt`: DateTime

> [!NOTE]
> **Data Migration Strategy:** ข้อมูลตั๋วเดิมและไฟล์แนบจาก Lab 2 จะต้องถูกโอนย้ายความสัมพันธ์ (Migrate) ให้ชี้ไปยังบัญชี User ที่ถูก Seed ขึ้นมา โดยไม่สูญหายและไม่เกิดข้อผิดพลาดของ Foreign Key

---

## 8. Acceptance Criteria (AC)

### 8.1 Authentication & Password Policy
*   **AC-01:** เมื่อผู้ใช้กรอก Username และ Password ที่ถูกต้อง ระบบตอบกลับ HTTP 200 พร้อม JWT Access Token และข้อมูล User
*   **AC-02:** เมื่อผู้ใช้กรอกรหัสผ่านผิด ระบบต้องตอบกลับ HTTP 401 Unauthorized และไม่เปิดเผยว่าผิดที่ Username หรือ Password
*   **AC-03:** หากผู้ใช้มีสถานะ `isActive = false` แม้จะกรอกรหัสผ่านถูกต้อง ระบบต้องตอบกลับ HTTP 403 Forbidden และไม่สามารถล็อกอินได้
*   **AC-04:** หากผู้ใช้มี `requiresPasswordChange = true` เมื่อเข้าสู่ระบบสำเร็จ ระบบต้องบังคับพาไปหน้า Change Password และไม่อนุญาตให้ข้ามไปยังหน้าอื่นจนกว่าจะเปลี่ยนรหัสผ่านสำเร็จ
*   **AC-05:** เมื่อผู้ใช้กด Logout ระบบต้องเคลียร์ Token ใน LocalStorage และรีเซ็ต Application State กลับสู่หน้า Login ทันที

### 8.2 IT Staff Operations & Queue
*   **AC-06:** เจ้าหน้าที่ไอทีล็อกอินแล้วสามารถเข้าถึงหน้า `/staff/queue` เพื่อดูตั๋วทั้งหมดในระบบ พร้อมตัวกรองตามสถานะและ Unassigned ได้
*   **AC-07:** เจ้าหน้าที่ไอทีสามารถกดปุ่ม "Claim" บนหน้า Ticket Detail เพื่อตั้งตนเองเป็นผู้รับผิดชอบตั๋ว (`ownerId = currentUserId`) ได้สำเร็จ
*   **AC-08:** เจ้าหน้าที่ไอทีสามารถปรับเปลี่ยนค่า `itPriority` และ `status` ของตั๋วได้ โดยบันทึกผลลงฐานข้อมูลถูกต้อง
*   **AC-09:** เจ้าหน้าที่ไอทีสามารถสร้าง Internal Note บนตั๋วได้ และตัวบันทึกนี้จะแสดงเครื่องหมายหรือแถบสีเตือนว่าเป็นข้อมูลลับเฉพาะเจ้าหน้าที่

### 8.3 Requester Experience & Privacy
*   **AC-10:** Requester สามารถดูได้เฉพาะตั๋วที่ตนเองเป็นผู้สร้างเท่านั้น ไม่สามารถเปิดดูตั๋วของผู้อื่นได้ (HTTP 403)
*   **AC-11:** Requester สามารถพิมพ์ Public Comment ได้ และเห็นข้อความ Public Comment จากเจ้าหน้าที่ไอที
*   **AC-12:** เมื่อ Requester ดึงข้อมูลตั๋วและคอมเมนต์ผ่าน API ต้องไม่มีข้อความที่เป็น `type: INTERNAL` ปะปนออกมาใน Response เด็ดขาด
*   **AC-13:** Requester สามารถกดปุ่ม "Appears Resolved" บนตั๋วของตนเองได้ โดยค่า `appearsResolved` จะถูกอัปเดตเป็น `true`

### 8.4 Administrator User Management
*   **AC-14:** เฉพาะผู้ใช้ที่มีบทบาท `Administrator` เท่านั้นที่สามารถเข้าถึง Endpoint ในกลุ่ม `/api/admin/*` ได้ ผู้ใช้อื่นจะได้ HTTP 403
*   **AC-15:** ผู้ดูแลระบบสามารถสร้างผู้ใช้ใหม่พร้อมกำหนด Role และได้รหัสผ่านชั่วคราวเริ่มต้น โดยผู้ใช้ใหม่จะมี `requiresPasswordChange = true` เสมอ
*   **AC-16:** เมื่อผู้ดูแลระบบปิดการใช้งานบัญชี (`isActive = false`) ผู้ใช้รายนั้นจะไม่สามารถส่งคำขอที่ต้องใช้สิทธิ์เข้าสู่ระบบได้อีกต่อไป
*   **AC-17:** ผู้ดูแลระบบสามารถกดรีเซ็ตรหัสผ่านของผู้ใช้ได้สำเร็จ พร้อมทั้งตั้งค่าให้บัญชีนั้นต้องเปลี่ยนรหัสผ่านในการเข้าใช้งานครั้งหน้า

---

## 9. Assumptions & Architectural Decisions
1. **JWT Storage in LocalStorage & Bearer Header:** เลือกจัดเก็บ JWT Token ไว้ใน `localStorage` และส่งผ่าน `Authorization: Bearer <token>` แทนการใช้ HttpOnly Cookie เนื่องจากสอดคล้องกับสถาปัตยกรรม Client-Server ปัจจุบัน เพิ่มความคล่องตัวในการพัฒนา (Developer Experience - DX) และเอื้อต่อการเขียน Automated Integration/E2E Testing บน Playwright
2. **Namespace Routing for Clear RBAC:** แยกกลุ่ม API Route ออกตามบทบาทอย่างชัดเจน ได้แก่ `/api/auth/*`, `/api/staff/*`, `/api/admin/*`, และ `/api/tickets/*` เพื่อให้ Middleware สามารถดักตรวจสอบสิทธิ์ตาม Route Prefix ได้อย่างกระชับ รัดกุม และลดความผิดพลาดในการเข้าถึงทรัพยากรข้ามบทบาท
3. **Stateless Token Verification:** ระบบตรวจสอบความถูกต้องของ Token แบบ Stateless บน Backend โดยถอดรหัส Signature และตรวจสอบ Payload สดในทุก Request

---

## 10. Product Definition of Done (DoD)
*   [ ] ฟีเจอร์ทั้งหมดผ่านตามเงื่อนไขใน Functional Requirements (FR-01 ถึง FR-15) และ Business Rules (BR-01 ถึง BR-05)
*   [ ] Acceptance Criteria ทุกข้อ (AC-01 ถึง AC-17) ผ่านการทดสอบเรียบร้อย
*   [ ] Automated Tests (Unit, Integration, E2E) ผ่าน 100% ครบถ้วนตามตารางการทดสอบใน `docs/lab-03/tests.md`
*   [ ] ข้อมูลเดิมจาก Lab 2 ไม่สูญหายและระบบสามารถรันร่วมกับ Schema ใหม่ได้อย่างสมบูรณ์
*   [ ] หน้าจอ UI รองรับ Responsive Design (Desktop, Tablet, Mobile) ตามมาตรฐาน Zen Green Theme
*   [ ] โค้ดผ่านการตรวจสอบ Lint และ Type-checking ไม่มี Error ตกค้าง
