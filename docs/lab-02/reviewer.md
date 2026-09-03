# Peer Review Record (Lab 2)

## 1. Pull Requests Reviewed

| PR / Issue | Title | Status |
|---|---|---|
| #12 | Sprint specification and test plan | Approved |
| #13 | Development Requester context | Approved |
| #14 | Ticket creation | Approved |
| #15 | My Tickets list & Pagination | Approved |
| #16 | Ticket Detail & Attachment management | Approved |
| #18 | E2E Tests & Documentation | Approved (After revisions) |

## 2. Review Feedback & Resolutions

**Issue 5 & 16: Ticket Detail & Attachments**
- **Feedback:** ระบบ Soft-delete ขาดการบันทึกเวลา `deletedAt` และ `deletedBy` รวมถึง API ขาดการเช็ค Route Guard
- **Resolution:** เพิ่มโค้ดอัปเดตฟิลด์ดังกล่าวใน Prisma และเพิ่ม `authMiddleware` ลงใน Route ของการดาวน์โหลดไฟล์แล้ว

**Issue 18: E2E Tests & Documentation**
- **Feedback:** เทสต์ Responsive Screenshot มีการข้ามเคสหากไม่พบ Ticket และไฟล์เอกสารสรุปงาน (ai-use, reviewer) หายไป
- **Resolution:** แก้ไข Playwright ให้บังคับเช็ค `toBeVisible()` เพื่อให้ Error ชัดเจน และได้สร้างไฟล์เอกสารครบถ้วนแล้ว