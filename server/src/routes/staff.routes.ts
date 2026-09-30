import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { 
  getStaffTicketsHandler,
  updateTicketOwnerHandler,
  updatePriorityHandler,
  updateStatusHandler
} from '../controllers/staff.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole(['IT_STAFF', 'ADMINISTRATOR']));

router.get('/tickets', getStaffTicketsHandler);
router.patch('/tickets/:id/owner', updateTicketOwnerHandler);
router.patch('/tickets/:id/priority', updatePriorityHandler);
router.patch('/tickets/:id/status', updateStatusHandler);

export default router;
