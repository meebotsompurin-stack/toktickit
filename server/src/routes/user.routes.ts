import { Router } from 'express';
import { getAllUsers, updateUser, resetUserPassword } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// All routes here require the user to be authenticated and have the ADMINISTRATOR role
router.use(authenticate);
router.use(requireRole([Role.ADMINISTRATOR]));

router.get('/', getAllUsers);
router.patch('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;
