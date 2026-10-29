# Peer Review & QA Record (Lab 4)

This document summarizes the GitHub Pull Request peer review and quality assurance process for Sprint 4.

- **Developer / Author:** Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack))
- **Reviewer:** Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548))
- **My Repository:** [meebotsompurin-stack/toktickit](https://github.com/meebotsompurin-stack/toktickit)
- **Friend's Repository:** [poom2548/toktickit](https://github.com/poom2548/toktickit)

---

## Section 1: My Pull Requests

| PR Link | Branch | Brief Summary | Reviewer Feedback | Fixes Applied | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[PR #52](https://github.com/meebotsompurin-stack/toktickit/pull/52)** | `docs/issue-01-sprint4-contract` -> `lab4-staging` | **ISSUE-01: Sprint 4 Contract & Specifications**<br>Authored complete engineering specifications (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`). | Verified full traceability from Labsheet §4–§14. Requested clarification on optimistic concurrency version checking and 7-day window definition for recently updated tickets. | Added explicit 409 Conflict error shape in `api-spec.md` and formalized the 7-day date filter rule in `specification.md`. | **Approved & Merged** |
| **[PR #53](https://github.com/meebotsompurin-stack/toktickit/pull/53)** | `feature/issue-02-actions-taken-backend` -> `lab4-staging` | **ISSUE-02: Actions Taken Backend & Database Foundation**<br>Added `ActionTaken` Prisma schema, database migration, singleton Prisma client, and REST endpoints under `/api/staff/tickets/:ticketId/actions`. | Found that `followUpNote` was allowed to be empty when `followUpRequired` was set to `true`. Also requested verifying that performers need not be the ticket owner. | Enforced conditional validation in controller: if `followUpRequired` is true, `followUpNote` must be non-empty (returns 422 if invalid). Added BR-02 test. | **Approved & Merged** |
| **[PR #54](https://github.com/meebotsompurin-stack/toktickit/pull/54)** | `feature/issue-03-actions-taken-ui` -> `lab4-staging` | **ISSUE-03: Actions Taken UI Component**<br>Implemented `ActionsTaken.tsx` in `TicketDetail.tsx` with list view, inline create/edit form, and role-based permissions. | Noted that Requester users could briefly see the "Record Action Taken" button before authorization resolved, and requested preserving draft text on submission failure. | Gated action buttons strictly behind `user.role !== 'REQUESTER'`. Implemented error banner preserving form input upon failed submission. | **Approved & Merged** |
| **[PR #55](https://github.com/meebotsompurin-stack/toktickit/pull/55)** | `feature/issue-04-ticket-workflow` -> `lab4-staging` | **ISSUE-04: Ticket Workflow, State Machine & Concurrency**<br>Implemented 8x8 status transition matrix, optimistic locking (versioning) returning 409, and advisory "Mark as Resolved" flag. | Pointed out that rapid double-clicks on status transitions could send duplicate PATCH requests before the first response resolved. | Added `isUpdatingStatusRef` guard and disabled status controls during in-flight network requests to prevent duplicate submissions. | **Approved & Merged** |
| **[PR #56](https://github.com/meebotsompurin-stack/toktickit/pull/56)** | `feature/issue-05-role-dashboards` -> `lab4-staging` | **ISSUE-05: Role Dashboards (IT Staff & Requester)**<br>Implemented operational dashboard for IT Staff and personal overview for Requester, including drill-down filters and Admin User Management card. | 1. Dashboard numbers differed slightly from queue query logic.<br>2. Clicking metric cards navigated to Staff Queue but failed to pre-select dropdown filter states. | Aligned SQL aggregation filters with queue listing query. Updated `StaffQueuePage.tsx` to read incoming props and pre-populate filter dropdowns. | **Approved & Merged** |
| **[PR #57](https://github.com/meebotsompurin-stack/toktickit/pull/57)** | `feature/issue-06-hardening-regression` -> `lab4-staging` | **ISSUE-06: Security Hardening, Tech Debt & E2E Regression**<br>Resolved TD-05 through TD-15 (JWT secrets, default passwords, eval injection, race conditions), added 3 Lab 4 E2E specs, and verified full 37-test suite. | Reviewer (`poom2548`) flagged two bugs:<br>1. **TypeScript Argument Mismatch:** `downloadAttachment(ticketId, attachmentId)` in `TicketDetail.tsx` sent 2 args instead of 3.<br>2. **Playwright Selector Syntax:** `row.locator('text=Inactive, .badge-danger, .badge-inactive')` in `admin-flow.spec.ts` treated string as literal instead of OR condition. | 1. Fixed invocation to `downloadAttachment(ticketId, attachmentId, filename)` in commit `3e5d892`.<br>2. Refactored selector to CSS pseudo-class `:has-text("Inactive"), .badge-danger, .badge-inactive` in commit `3e5d892`.<br>3. Verified 37/37 passing E2E tests and generated 15 multi-viewport screenshots. | **Approved & Merged** |
| **[PR #58](https://github.com/meebotsompurin-stack/toktickit/pull/58)** | `docs/issue-07-lab4-submission` -> `main` | **ISSUE-07: Documentation, Peer Review & PDF Submission**<br>Authored `reviewer.md` with complete peer review logs and `ai-use.md` with 10 key engineering prompts and comprehensive reflection. | Pending final submission review. | Addressed all checklist criteria and verified zero out-of-scope code modifications. | **Approved & Merged** |

---

## Section 2: Friend's Pull Requests Reviewed

**Friend's Repository:** [poom2548/toktickit](https://github.com/poom2548/toktickit)  
**Author:** Saksorn Buranatananun ([`@poom2548`](https://github.com/poom2548)) | **Reviewer:** Purin Mebotsom ([`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack))

### 1. [PR #66](https://github.com/poom2548/toktickit/pull/66) — Issue #6: Role dashboards API (Requester, IT Staff, Admin)
- **Branch:** `feature/issue-6-lab4-dashboards-api` -> `lab4-staging`
- **Reviewer Feedback:**
  - **[Critical] Test Oracle Independence:** ใน `server/tests/lab-04/helpers.ts` มีการ export `dashboardService` ของ Production ออกมา และใน `staff-dashboard.api.test.ts` (เทสต์ SD-03) ใช้ `vi.spyOn(dashboardService, ...)` ซึ่งผิดกฎ Test Oracle Independence แนะนำให้ลบออกและเปลี่ยนไป Mock ที่ระดับฐานข้อมูล (`getPrisma().ticket`) แทน
  - **[Important] Missing `Cache-Control: no-store`:** ใน `server/src/dashboard/dashboard.routes.ts` จังหวะดัก `.all(...)` เพื่อคืนค่า 405 Method Not Allowed ยังไม่ได้แนบ Header `Cache-Control: no-store` ตามสเปก
- **Author Fixes:**
  - ลบการ export `dashboardService` ออกจาก `helpers.ts` และเปลี่ยนไป Mock Prisma ระดับฐานข้อมูล (`findMany`, `count`, `groupBy`) พร้อมระบบกู้คืนแบบ proxy-safe ใน `try/finally` และ `afterEach`
  - เพิ่ม middleware ที่ root ของ `dashboard.routes.ts` ให้แนบ `Cache-Control: no-store` ทุกสถานะ (200, 401, 403, 405, 500)
  - ปรับความยืดหยุ่น `±2` ในเทสต์ SD-01/SD-02 ป้องกัน Flakiness ตอนรัน Parallel
- **Final Status:** **Approved & Merged**

### 2. [PR #67](https://github.com/poom2548/toktickit/pull/67) — Issue #7: Ticket Detail UI: Actions Taken and workflow controls
- **Branch:** `feature/issue-7-lab4-ticket-detail-ui` -> `lab4-staging`
- **Reviewer Feedback:**
  - **[Blocking - AC-03, AC-05] Field Max Length:** `followUpNote` และ `attachmentNotes` ใน `ActionsTakenSection.tsx` เช็คความยาวไว้ที่ `> 2000` ซึ่งไม่ตรงสเปก (ต้องเป็น 2000 / 2000 / 1000 / 1000)
  - **[Blocking - AC-11] Edit Button `aria-label`:** ปุ่มแก้ไขในแต่ละแถวระบุแค่ `แก้ไข ${act.description}` ขาดวันที่และเวลาตามโซน `Asia/Bangkok`
  - **[Blocking - AC-18] `Idempotency-Key` Retry Reuse:** มีการสร้าง `generateIdempotencyKey()` ใหม่ทุกครั้งที่กดส่ง ทำให้เมื่อเกิด Network Error หรือ 500 แล้วกดส่งซ้ำด้วยข้อมูลเดิมไม่ได้ใช้คีย์เดิม
  - **[Important] Safe Error Display:** ใน `client/src/api/errors.ts` กรณี `body.error` เป็น string ที่ไม่ตรงเงื่อนไข อาจหลุดแสดง `rawError` ออกสู่หน้าจอ UI
- **Author Fixes:**
  - แยกค่าคงที่และการตรวจสอบไว้ที่ `actionLimits.ts` (2000/2000/1000/1000) พร้อม `.trim()`
  - ปรับ `aria-label` ของปุ่มแก้ไขให้ระบุวันเวลา `Asia/Bangkok` (`แก้ไข Action เมื่อ {dd/mm/yyyy hh:mm} - {description...}`)
  - เก็บและใช้ `Idempotency-Key` เดิมซ้ำเมื่อ Retry หลังเกิด Network Error/500 และรีเซ็ตเมื่อแก้ฟอร์มหรือเกิด 409/422
  - ปรับ `errors.ts` ให้แสดงเฉพาะข้อความภาษาไทยที่ปลอดภัยและจำกัด `reason` ไม่เกิน 300 ตัวอักษร
- **Final Status:** **Approved & Merged**

### 3. [PR #68](https://github.com/poom2548/toktickit/pull/68) — Issue #8: Role dashboards UI and navigation
- **Branch:** `feature/issue-8-lab4-dashboards-ui` -> `lab4-staging`
- **Reviewer Feedback:**
  - ตรวจสอบความถูกต้องของ Server Filters (`statusGroup=open`, `resolvedWithinDays=1..365`, `assignee=unassigned|me`, `priority=...|UNSET`)
  - ตรวจสอบความสอดคล้องของยอดตั๋วในลิงก์ Drill-down (AC-55..57), การซ่อนการ์ด `User Accounts` ให้แสดงเฉพาะ Admin (AC-33), หน้า 403 ข้ามบทบาท (AC-37) และแถบนำทาง `AppShell` (`aria-current="page"`, สี Zen Green)
  - ให้ข้อเสนอแนะเพิ่มเติม (Non-blocking) เรื่องการปรับคำอธิบายพารามิเตอร์ของ `buildRecentlyResolvedWhere` และการเรียกใช้ Helper ร่วมกันใน `ticket.controller.ts`
- **Author Fixes:**
  - ตรวจสอบประวัติ Commit สะอาด (Linear history)
  - ผลการทดสอบผ่านครบถ้วนทั้ง Server (524 passed), Client (77 passed) และ Playwright E2E (5 passed รวมการตรวจ Responsive 360px และ Axe Accessibility)
- **Final Status:** **Approved & Merged**

### 4. [PR #69](https://github.com/poom2548/toktickit/pull/69) — Issue #9: Final hardening: regression, accessibility, responsive, visual inspection
- **Branch:** `feature/issue-9-lab4-hardening` -> `lab4-staging`
- **Reviewer Feedback:**
  - ตรวจสอบครบทุกเกณฑ์ AC-43 ถึง AC-59 ได้แก่ การปรับสี Contrast ให้ผ่านเกณฑ์ WCAG 2.1 AA ($\ge 4.5:1$)
  - การลบ `alert()` และ `console.warn()` เปลี่ยนเป็น Inline Error (`role="alert"`) พร้อมเทสต์ `FormsHardening.test.tsx`
  - การเพิ่ม Endpoint `GET /staff/assignable-users` พร้อม `Cache-Control: no-store`
  - การบังคับตรวจ `version` token และการคงสัญญา `GET /api/health`
  - ตรวจสอบตารางเปรียบเทียบข้อมูลจริง `dashboard-metrics-vs-db.md` และชุดภาพหน้าจอ 58 ภาพใน 3 ขนาดหน้าจอ
- **Author Fixes:**
  - ผ่านเกณฑ์การตรวจสอบทั้งหมดโดยไม่มีจุดติดขัด (Zero Blocking Issues) ผลรันเทสต์ผ่านครบ 100%
- **Final Status:** **Approved & Merged**

### 5. [PR #70](https://github.com/poom2548/toktickit/pull/70) — Issue #10: Documentation and release preparation
- **Branch:** `feature/issue-10-lab4-docs-release` -> `lab4-staging`
- **Reviewer Feedback:**
  - ตรวจสอบขอบเขตไฟล์ 9 ไฟล์ตามกำหนด
  - ความถูกต้องของ `README.md` ที่ตรงกับ `dashboard.constants.ts` และ `seed.ts` (ไม่มีการ์ดนอกสเปกอย่าง SLA Risk และระบุฟีเจอร์ Set New Password ถูกต้อง)
  - ความปลอดภัยของ `.env.example` / `.gitignore` (`secrets-audit.md`)
  - ความสอดคล้องของตัวเลขผลเทสต์ใน `README.md`, `tests.md` (`REG-05`) และ `fresh-clone-check.md`
- **Author Fixes:**
  - เอกสารและหลักฐานการตรวจสอบครบถ้วนสมบูรณ์ตามเกณฑ์ AC-51 / REG-05
- **Final Status:** **Approved & Merged**
