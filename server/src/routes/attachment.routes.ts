import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { deleteHandler } from '../controllers/attachment.controller';

const router = Router();

// บังคับให้ต้องมี X-Requester-Id
router.use(authMiddleware);

// DELETE /api/attachments/:id - Soft-remove ไฟล์แนบ
router.delete('/:id', deleteHandler);

export default router;
