import { Router } from 'express';
import { getRelatedSystems } from './related-system.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getRelatedSystems);

export default router;
