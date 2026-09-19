import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { deleteHandler } from '../controllers/attachment.controller';

const router = Router();

router.use(authenticate);

// DELETE /api/attachments/:id - Soft-remove ไฟล์แนบ
router.delete('/:id', deleteHandler);

export default router;
