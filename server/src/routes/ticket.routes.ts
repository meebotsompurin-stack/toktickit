import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { createTicketHandler, getTicketsHandler, getTicketByIdHandler } from '../controllers/ticket.controller';
import { uploadHandler, downloadAttachmentHandler } from '../controllers/attachment.controller';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

// บังคับให้ต้องมี X-Requester-Id
router.use(authMiddleware);

// GET /api/tickets - ดึงรายการตั๋ว
router.get('/', getTicketsHandler);

// GET /api/tickets/:ticketId - ดึงรายละเอียดตั๋ว
router.get('/:ticketId', getTicketByIdHandler);

// POST /api/tickets - สร้างตั๋วใหม่
router.post('/', createTicketHandler);

// POST /api/tickets/:ticketId/attachments - แนบไฟล์
router.post('/:ticketId/attachments', uploadSingle, uploadHandler);

// GET /api/tickets/:ticketId/attachments/:attachmentId/download - ดาวน์โหลดไฟล์แนบ
router.get('/:ticketId/attachments/:attachmentId/download', downloadAttachmentHandler);

export default router;
