import { Router } from 'express';
import { getRelatedSystems } from './related-system.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRelatedSystems);

export default router;
