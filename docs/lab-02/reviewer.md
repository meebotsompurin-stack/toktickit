# Peer Review Record - Lab 2: Requester Ticketing MVP

**Developer / Author:** Purin Mebotsom 67070507214
**Reviewer:** Saksorn Buranatananun 67070507208

---

## 1. Feature PRs into `lab2-staging`

### PR #18: docs: add sprint specification and test plan for Lab 2
- **Branch:** `feature/sprint-spec` -> `lab2-staging`
- **Related Issue:** Closes #12
- **Comments Received (poom2548):**
  1. `specification.md`: ระบุฟิลด์บังคับ ความยาว Summary (100 อักษร) และ Description (1,000 อักษร), กำหนดค่า Enum ชัดเจน, กำหนดเงื่อนไข Soft-removal (บันทึก metadata ซ่อนไฟล์)
  2. `api-spec.md`: เพิ่ม JSON Schema สำหรับ 400 Bad Request, ระบุการส่ง `X-Requester-Id` ทาง Header, กำหนด Default Pagination
  3. `ui-spec.md`: เพิ่มข้อกำหนด a11y (Contrast, Focus states, aria-label) และ Responsive Card บน Mobile
  4. `tests.md`: เพิ่ม Test Case การอัปโหลดไฟล์ผิดประเภท, ไฟล์เกิน 5MB, ตรวจสอบ 401/403 และทดสอบแปลงตารางเป็น Card
  5. ขอเพิ่มหัวข้อ "6. Data Changes" (อธิบายตาราง DB Schema) และ "7. Acceptance Criteria (AC)" เป็นข้อๆ รวมถึง Checklist ใน `ui-spec.md`
- **Remediation & Response (meebotsompurin-stack):**
  - อัปเดตเอกสารครบทั้ง 4 ไฟล์ เพิ่มหัวข้อ Data Changes, กำหนด AC ครอบคลุม Business Rules และเพิ่ม Visual Inspection Checklist
- **Verdict:** APPROVED & MERGED (poom2548: "ตรวจแล้ว ครบถ้วน")

---

### PR #20: feat: implement Lab 2 Database Schema and core API
- **Branch:** `feat/13-development-requester-context` -> `lab2-staging`
- **Related Issue:** Closes #13
- **Scope & Changes:**
  - สร้าง Schema (Ticket, Attachment, Category, RelatedSystem, Requester) พร้อม Seed data
  - Middleware: ดักจับ Header `X-Requester-Id` (401) และ Global Error Handler
  - Ticket Controller: Pagination (page=1, limit=10), Auto ticket number (`TKT-YYYY-XXXXXX`)
  - Attachment: ตรวจสอบ MIME Type (Magic Bytes) ผ่าน `file-type`, Soft-remove (`isRemoved=true`, `deletedAt`, `deletedBy`), ตรวจสอบสิทธิ์ Requester (403)
- **Reviewer Feedback (poom2548):** ตรวจสอบโครงสร้าง Schema และ API endpoints ถูกต้องตามสเปก
- **Verdict:** APPROVED & MERGED (poom2548: "ตรวจแล้ว ครบถ้วนแล้ว")

---

### PR #22: feat: Implement Frontend Core Features - My Tickets, Create Ticket & Ticket Details
- **Branch:** `feat/13-development-requester-context` -> `lab2-staging`
- **Related Issue:** Closes #14
- **Scope & Changes:**
  - My Tickets Page: แสดงผลแบบตารางบน Desktop และการ์ดบน Mobile พร้อม Search/Filter/Pagination
  - Create Ticket: ตรวจสอบ Form Validation และรองรับ Upload attachment
  - Ticket Detail: แสดงรายละเอียดแบบ Read-only, ดาวน์โหลดไฟล์ และ Delete attachment แบบตอบสนองทันที
  - API Client: แนบ `X-Requester-Id` ทุก Request อัตโนมัติ
- **Reviewer Feedback (poom2548):** ตรวจสอบ UI การทำงานและการเชื่อมต่อ API ครบถ้วน
- **Verdict:** APPROVED & MERGED (poom2548: "ตรวจแล้ว ครบถ้วนแล้ว")

---

### PR #23: test: complete E2E test for requester ticket flow
- **Branch:** `feat/13-development-requester-context` -> `lab2-staging`
- **Related Issue:** Closes #15
- **Scope & Changes:**
  - พัฒนา Playwright E2E Test ครอบคลุม Flow การใช้งานจริงของ Requester ตั้งแต่เลือก Dev User, สร้างตั๋ว, ดูรายละเอียด จนถึงลบไฟล์แนบ
  - แก้ไข Locator สู่ Strict Mode โดยใช้ `getByRole` ป้องกันปัญหาข้อความซ้ำ
  - จำลองการอัปโหลดไฟล์ด้วย Buffer แทรก Magic Bytes (`%PDF-1.4`) เพื่อให้ผ่านการตรวจจับของ Backend
- **Reviewer Feedback (poom2548):** ตรวจสอบ Test Script ทำงานผ่านได้อย่างเสถียร
- **Verdict:** APPROVED & MERGED (poom2548: "ตรวจแล้ว ครบถ้วนแล้ว")

---

## 2. Release PR: `lab2-staging` -> `main` (PR #25)

### Initial Review Feedback Received (poom2548 - Requested Changes)
1. **Context Switch Protection (Critical):** หน้า `TicketDetail.tsx` ขาดระบบตรวจสอบกรณีผู้ใช้สลับตัวละคร (Dev Requester) กลางคัน ทำให้แอบดูตั๋วของคนอื่นได้ ให้เพิ่ม `useEffect` ดึง `localStorage` มาเทียบกับ `ticket.requesterId` หากไม่ตรงให้ Redirect กลับหน้า My Tickets ทันที
2. **5-Attachment Quota Limit (Critical):** ใน `attachment.controller.ts` ขาดการจำกัดโควต้า 5 ไฟล์ต่อตั๋ว ให้เพิ่มโค้ดนับไฟล์ `isRemoved: false` หาก $\ge 5$ ไฟล์ ให้บล็อกและส่ง HTTP 400 Bad Request
3. **Missing Backend Unit Tests (High):** ขาด Unit Test ฝั่งเซิร์ฟเวอร์ ให้สร้างไฟล์เทสต์ดักเคส 401 (ไม่ส่ง Header), 403 (เข้าถึงข้อมูลข้ามสิทธิ์), และ 404 (หาข้อมูลไม่พบหรือถูก Soft-remove)
4. **E2E Responsive Screenshots (Medium):** Playwright สคริปต์ยังไม่ได้ตั้งค่า Viewport และแคปภาพ (Desktop, Tablet, Mobile) ตามข้อตกลง และต้องไม่ใช้ hardcoded timeouts (`waitForTimeout`)
5. **Missing Documentation (Low):** ขาดไฟล์สรุปงาน `ai-use.md` และ `reviewer.md` ในโฟลเดอร์ `docs/lab-02/`

### Remediation Actions Taken (meebotsompurin-stack)
- **Context Switch:** เพิ่ม `useEffect` ใน `TicketDetail.tsx` เปรียบเทียบ `localStorage` กับ `ticket.requesterId` และดักจับ Error 403 เพื่อเรียก `onBack()` นำผู้ใช้กลับสู่หน้ารายการตั๋วทันที
- **Attachment Limit:** เพิ่มการนับไฟล์ Active ใน `attachment.controller.ts` หากครบ 5 ไฟล์ จะลบไฟล์ทิ้งด้วย `fs.unlinkSync(req.file.path)` และตอบกลับ 400 Bad Request
- **Backend Unit Tests:** สร้าง `server/src/__tests__/ticket-auth.test.ts` ด้วย Vitest + Supertest ผ่านครบทั้ง 7 เคสย่อย (401, 403, 404)
- **E2E & Screenshots:** นำ `waitForTimeout(600)` ออกจาก `requester-ticket-flow.spec.ts` และเพิ่มการแคปหน้าจอ Responsive 3 ขนาดลง `artifacts/lab-02/screenshots/ticket-detail/`
- **Documentation:** จัดทำ `docs/lab-02/ai-use.md` และ `docs/lab-02/reviewer.md` ครบถ้วนตามมาตรฐาน

### Final Approval & Merge Status
- **Final Comment (poom2548):** "ตรวจแล้ว ครบถ้วน"
- **Review Decision:** APPROVED
- **Merge Commit:** Merged 29 commits into `main` from `lab2-staging`