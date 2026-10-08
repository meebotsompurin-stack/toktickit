import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { 
  getStaffTicketsHandler,
  updateTicketOwnerHandler,
  updatePriorityHandler,
  updateStatusHandler,
  createActionTakenHandler,
  updateActionTakenHandler
} from '../controllers/staff.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole(['IT_STAFF', 'ADMINISTRATOR']));

router.get('/tickets', getStaffTicketsHandler);
router.patch('/tickets/:id/owner', updateTicketOwnerHandler);
router.patch('/tickets/:id/priority', updatePriorityHandler);
router.patch('/tickets/:id/status', updateStatusHandler);

// Actions Taken routes
router.post('/tickets/:ticketId/actions', createActionTakenHandler);
router.patch('/tickets/:ticketId/actions/:actionId', updateActionTakenHandler);

export default router;
