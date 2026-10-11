import { Router } from 'express';
import { getActiveRequesters } from './requester.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/requesters/active (protected by authenticate)
router.get('/active', authenticate, getActiveRequesters);

export default router;
