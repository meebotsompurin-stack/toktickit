# AI Usage Documentation (Lab 2)

## 1. AI Tools Used
- GitHub Copilot / ChatGPT / Gemini

## 2. How AI was used in this lab

| Task | Prompt / Command used | How it helped |
|---|---|---|
| **Code Review** | `@workspace Please review the current changes...` | ช่วยตรวจสอบ Acceptance Criteria และหาข้อผิดพลาดที่ซ่อนอยู่ เช่น การลืมอัปเดต `deletedAt` ในระบบ Soft-delete |
| **Write E2E Tests** | `ช่วยเขียน Playwright E2E test สำหรับ Flow ของ Requester...` | ช่วยวางโครงสร้าง E2E Test รวมถึงการตั้งค่า Viewport สำหรับทดสอบ Responsive |
| **Refactoring** | `ช่วยปรับโค้ดการจัดการ Error ให้รองรับ res.headersSent...` | แนะนำวิธีป้องกัน Server Crash เวลาเกิด Error ระหว่างการดาวน์โหลดไฟล์ |
| **Documentation** | `ช่วยจัดฟอร์แมต Markdown สำหรับไฟล์ specification...` | ช่วยเรียบเรียงและตรวจสอบความถูกต้องของเอกสาร Requirement |

## 3. Reflection
การใช้ AI ช่วยลดระยะเวลาในการตรวจสอบโค้ด (Code Review) และการเขียน Boilerplate สำหรับ E2E Test ได้มาก อย่างไรก็ตาม AI ยังมีข้อผิดพลาด (Hallucination) เช่น การอ้างว่ามีไฟล์เอกสารอยู่ทั้งที่ยังไม่ได้สร้างจริง จึงจำเป็นต้องตรวจสอบความถูกต้องด้วยตัวเองทุกครั้งก่อนนำไปใช้งาน