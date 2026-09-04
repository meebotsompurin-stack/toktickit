import { Router } from 'express';
import { getCategories } from './category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// บังคับให้ส่ง X-Requester-Id มาด้วย ถ้ามี authMiddleware
router.use(authMiddleware);

router.get('/', getCategories);

export default router;
