import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  createTicketHandler, 
  getTicketsHandler, 
  getTicketByIdHandler,
  addPublicCommentHandler,
  addInternalNoteHandler,
  getInternalNotesHandler,
  toggleAppearsResolvedHandler
} from '../controllers/ticket.controller';
import { uploadHandler, downloadAttachmentHandler } from '../controllers/attachment.controller';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

// Use real JWT session auth
router.use(authenticate);

// GET /api/tickets
router.get('/', getTicketsHandler);

// GET /api/tickets/:ticketId
router.get('/:ticketId', getTicketByIdHandler);

// POST /api/tickets
router.post('/', createTicketHandler);

// POST /api/tickets/:ticketId/attachments
router.post('/:ticketId/attachments', uploadSingle, uploadHandler);

// GET /api/tickets/:ticketId/attachments/:attachmentId/download
router.get('/:ticketId/attachments/:attachmentId/download', downloadAttachmentHandler);

// Comments & Notes
router.post('/:ticketId/comments', addPublicCommentHandler);
router.post('/:ticketId/notes', addInternalNoteHandler);
router.get('/:ticketId/notes', getInternalNotesHandler);

// Toggle Appears Resolved
router.patch('/:ticketId/resolved-status', toggleAppearsResolvedHandler);

export default router;
