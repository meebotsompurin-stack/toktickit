import { Router } from 'express';
import { login, getMe, changePassword, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;
