import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index'; 
import * as TicketService from '../services/ticket.service';
import * as AttachmentService from '../services/attachment.service';

const { mockUserDb } = vi.hoisted(() => ({
  mockUserDb: { findUnique: vi.fn() }
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class { user = mockUserDb; },
    Role: { REQUESTER: 'REQUESTER', IT_STAFF: 'IT_STAFF', ADMINISTRATOR: 'ADMINISTRATOR' }
  };
});

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

  const getValidToken = (userId: string, role = 'REQUESTER') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev');
  };

  const setupMockUser = (userId: string, role = 'REQUESTER') => {
    mockUserDb.findUnique.mockResolvedValue({
      id: userId,
      role: role,
      isActive: true,
      requiresPasswordChange: false
    });
  };

  describe('1. HTTP 401: Missing Auth Header', () => {
    it('should return 401 when requesting a ticket without Authorization header', async () => {
      const response = await request(app).get('/api/tickets/some-id');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when downloading an attachment without Authorization header', async () => {
      const response = await request(app).get('/api/tickets/ticket-id/attachments/attach-id/download');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('2. HTTP 403: Forbidden (Cross-Requester Access)', () => {
    it('should return 403 when requesting a ticket belonging to another requester', async () => {
      setupMockUser('user-B');
      vi.mocked(TicketService.getTicketById).mockResolvedValue({
        id: 'some-id',
        requesterId: 'user-A',
      } as any);

      const response = await request(app)
        .get('/api/tickets/some-id')
        .set('Authorization', `Bearer ${getValidToken('user-B')}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 403 when downloading an attachment from a ticket belonging to another requester', async () => {
      setupMockUser('user-B');
      vi.mocked(AttachmentService.getAttachmentWithTicket).mockResolvedValue({
        id: 'attach-id',
        ticketId: 'ticket-id',
        isRemoved: false,
        filename: 'test.pdf',
        ticket: { requesterId: 'user-A' }
      } as any);

      const response = await request(app)
        .get('/api/tickets/ticket-id/attachments/attach-id/download')
        .set('Authorization', `Bearer ${getValidToken('user-B')}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('3. HTTP 404: Not Found', () => {
    it('should return 404 when requesting a ticket that does not exist', async () => {
      setupMockUser('staff-1', 'IT_STAFF');
      vi.mocked(TicketService.getTicketById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tickets/non-existent-id')
        .set('Authorization', `Bearer ${getValidToken('staff-1', 'IT_STAFF')}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 404 when downloading an attachment that does not exist', async () => {
      setupMockUser('user-A');
      vi.mocked(AttachmentService.getAttachmentWithTicket).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tickets/ticket-id/attachments/non-existent-attach-id/download')
        .set('Authorization', `Bearer ${getValidToken('user-A')}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
    
    it('should return 404 when downloading an attachment that is soft-removed', async () => {
      setupMockUser('user-A');
      vi.mocked(AttachmentService.getAttachmentWithTicket).mockResolvedValue({
        id: 'attach-id',
        ticketId: 'ticket-id',
        isRemoved: true,
        filename: 'test.pdf',
        ticket: { requesterId: 'user-A' }
      } as any);

      const response = await request(app)
        .get('/api/tickets/ticket-id/attachments/attach-id/download')
        .set('Authorization', `Bearer ${getValidToken('user-A')}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toMatch(/Attachment not found/i);
    });
  });
});
