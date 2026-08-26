import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { createTicketHandler, getTicketsHandler } from '../controllers/ticket.controller';
import { uploadHandler } from '../controllers/attachment.controller';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

// บังคับให้ต้องมี X-Requester-Id
router.use(authMiddleware);

// GET /api/tickets - ดึงรายการตั๋ว
router.get('/', getTicketsHandler);

// POST /api/tickets - สร้างตั๋วใหม่
router.post('/', createTicketHandler);

// POST /api/tickets/:ticketId/attachments - แนบไฟล์
router.post('/:ticketId/attachments', uploadSingle, uploadHandler);

export default router;
