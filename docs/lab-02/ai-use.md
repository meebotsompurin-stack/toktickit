# AI Use Log and Engineering Reflection - Lab 2

## 1. LLM & Tools Used
- **Primary AI Agent:** Gemini 3.1 pro , Gemini 3.8 Flash extend 
- **AI Specification & Review Assistant:** Copilot 

---

## 2. Key Prompts Table (6–10 Prompts)

| No. | Prompt Name | Purpose | Key Prompt Text | Outcome |
|:---:|---|---|---|---|
| 1 | **Spec Ambiguity Review** | วิเคราะห์ความคลุมเครือของโจทย์ก่อนเขียนโค้ด | "Read docs/lab-02/specification.md, tests.md, and api-spec.md. List ambiguities, ownership edge cases, and proposed implementation order without writing code." | ได้รายการ Business Rules และ Edge Cases เพิ่มเติม เช่น การแยกสิทธิ์ Requester และโควต้าไฟล์ |
| 2 | **Database Schema & Constraints** | ออกแบบ Prisma Schema และความสัมพันธ์ | "Generate Prisma schema for Ticket, Attachment, Category, RelatedSystem, and Requester with soft-delete fields and foreign keys." | ได้ไฟล์ `schema.prisma` ที่มี relation ครบถ้วนและรองรับ soft-delete |
| 3 | **MIME Magic Bytes Validation** | ตรวจสอบไฟล์อัปโหลดจริงด้วย Magic Bytes | "Implement multer middleware with file-type to validate real file MIME types using magic bytes for JPG, PNG, WEBP, and PDF." | ป้องกันการปลอมแปลงนามสกุลไฟล์ที่ระดับ Backend API |
| 4 | **Attachment Quota Enforcement** | จำกัดจำนวนไฟล์แนบไม่เกิน 5 ไฟล์ต่อตั๋ว | "In attachment controller, check active attachments count (isRemoved: false). If >= 5, delete temp file with fs.unlinkSync and return 400." | ควบคุมโควต้า 5 ไฟล์ตาม AC-04 และกำจัดไฟล์ขยะบนเซิร์ฟเวอร์ |
| 5 | **Context Switch Protection** | ป้องกันการสลับตัวละครแอบดูตั๋ว | "Add useEffect in TicketDetail to compare localStorage requester ID with ticket.requesterId. Redirect to My Tickets on mismatch or 403." | ป้องกันการเข้าถึงข้ามสิทธิ์แบบ Real-time บน Client |
| 6 | **Backend Auth Unit Tests** | สร้าง Unit Test ดักจับ Error Authentication | "Write Vitest + Supertest unit tests for ticket controller mocking Prisma to assert 401 Unauthorized, 403 Forbidden, and 404 Not Found." | ได้ชุดทดสอบ 7 เคสย่อยใน `ticket-auth.test.ts` ผ่าน 100% |
| 7 | **Strict Locator & Magic Bytes in E2E** | ปรับปรุง Playwright Script ให้เสถียร | "Update Playwright test to use strict role locators (getByRole) and upload a valid PDF buffer with %PDF-1.4 magic bytes." | E2E Test รันผ่าน ไม่ติดปัญหาข้อความซ้ำซ้อนในหน้าตาราง |
| 8 | **Vitest DOM Environment Fix** | แก้ไขข้อผิดพลาด ReferenceError ใน Test | "Fix 'ReferenceError: document is not defined' in App.test.tsx by configuring jsdom environment for Vitest." | ทดสอบ Frontend Component ผ่านฉลุย |

---

## 3. My Reflection (บทสะท้อนความคิด)
การนำ AI เข้ามาช่วยในการทำงานทำให้เราสามารถทำงานได้อย่างรวดเร็วมากขึ้นจริงแต่ก็ยังต้องมีการที่เราจะต้องค่อยตรวจสอบอยู่เสมอว่าสิ่งที่ AI ทำอยู่นั้นไปในทิศทางที่เราต้องการหรือไม่และการใช้ AI หลายตัวรวมกันก็สามารถยกระดับการทำงานของเราไปได้เพึ่มขึ้นแต่เราก็ยึ่งต้องดูให้ดีว่า AI แต่ละตัวทำตามแผนที่เราวางไว้จริงหรือไม่