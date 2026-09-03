import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index'; 
import * as TicketService from '../services/ticket.service';
import * as AttachmentService from '../services/attachment.service';

// Mock the services so we don't need a real database connection
vi.mock('../services/ticket.service', () => ({
  getTicketById: vi.fn(),
  getTickets: vi.fn(),
  createTicket: vi.fn(),
}));

vi.mock('../services/attachment.service', () => ({
  getAttachmentWithTicket: vi.fn(),
  uploadAttachment: vi.fn(),
  softRemoveAttachment: vi.fn(),
}));

describe('Ticket and Attachment Auth/Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. HTTP 401: Missing Auth Header (X-Requester-Id)', () => {
    it('should return 401 when requesting a ticket without X-Requester-Id', async () => {
      const response = await request(app).get('/api/tickets/some-id');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when downloading an attachment without X-Requester-Id', async () => {
      const response = await request(app).get('/api/tickets/ticket-id/attachments/attach-id/download');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('2. HTTP 403: Forbidden (Cross-Requester Access)', () => {
    it('should return 403 when requesting a ticket belonging to another requester', async () => {
      // Mock the service to return a ticket owned by 'user-A'
      vi.mocked(TicketService.getTicketById).mockResolvedValue({
        id: 'some-id',
        requesterId: 'user-A',
      } as any);

      // The request comes from 'user-B'
      const response = await request(app)
        .get('/api/tickets/some-id')
        .set('X-Requester-Id', 'user-B');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 403 when downloading an attachment from a ticket belonging to another requester', async () => {
      // Mock the service to return an attachment owned by 'user-A'
      vi.mocked(AttachmentService.getAttachmentWithTicket).mockResolvedValue({
        id: 'attach-id',
        ticketId: 'ticket-id',
        isRemoved: false,
        filename: 'test.pdf',
        ticket: {
          requesterId: 'user-A'
        }
      } as any);

      // The request comes from 'user-B'
      const response = await request(app)
        .get('/api/tickets/ticket-id/attachments/attach-id/download')
        .set('X-Requester-Id', 'user-B');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('3. HTTP 404: Not Found', () => {
    it('should return 404 when requesting a ticket that does not exist', async () => {
      vi.mocked(TicketService.getTicketById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tickets/non-existent-id')
        .set('X-Requester-Id', 'user-A');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 404 when downloading an attachment that does not exist', async () => {
      vi.mocked(AttachmentService.getAttachmentWithTicket).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tickets/ticket-id/attachments/non-existent-attach-id/download')
        .set('X-Requester-Id', 'user-A');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
    
    it('should return 404 when downloading an attachment that is soft-removed', async () => {
      vi.mocked(AttachmentService.getAttachmentWithTicket).mockResolvedValue({
        id: 'attach-id',
        ticketId: 'ticket-id',
        isRemoved: true,
        filename: 'test.pdf',
        ticket: {
          requesterId: 'user-A'
        }
      } as any);

      const response = await request(app)
        .get('/api/tickets/ticket-id/attachments/attach-id/download')
        .set('X-Requester-Id', 'user-A');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toMatch(/Attachment not found/i);
    });
  });
});
