import { Router } from 'express';
import { getActiveRequesters } from './requester.controller';

const router = Router();

// GET /api/requesters/active
router.get('/active', getActiveRequesters);

export default router;
