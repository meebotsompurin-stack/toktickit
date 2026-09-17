import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import ticketRoutes from '../routes/ticket.routes';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrisma = {
    ticket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrisma) };
});

const prisma = new PrismaClient() as any;

const app = express();
app.use(express.json());

app.use((req: any, res: any, next: any) => {
  const role = req.headers['x-mock-role'] || 'REQUESTER';
  const id = req.headers['x-mock-id'] || 'req1';
  req.user = { id, role };
  next();
});

vi.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
}));

app.use('/api/tickets', ticketRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.statusCode || 500).json({ error: err.error, message: err.message });
});

describe('Requester Actions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should toggle resolution flag if requester owns the ticket (PATCH /:id/resolution-flag)', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', requesterId: 'req1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', appearsResolved: true });

    const res = await request(app)
      .patch('/api/tickets/t1/resolution-flag')
      .set('x-mock-role', 'REQUESTER')
      .set('x-mock-id', 'req1')
      .send({ appearsResolved: true });

    expect(res.status).toBe(200);
    expect(res.body.appearsResolved).toBe(true);
    expect(prisma.ticket.update).toHaveBeenCalled();
  });

  it('should return 403 if requester toggles resolution flag for unowned ticket', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', requesterId: 'req2' });

    const res = await request(app)
      .patch('/api/tickets/t1/resolution-flag')
      .set('x-mock-role', 'REQUESTER')
      .set('x-mock-id', 'req1')
      .send({ appearsResolved: true });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You do not own this ticket');
  });

  it('should return 403 if requester views unowned ticket (GET /:id)', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', requesterId: 'req2' });

    const res = await request(app)
      .get('/api/tickets/t1')
      .set('x-mock-role', 'REQUESTER')
      .set('x-mock-id', 'req1');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You do not have permission to view this ticket');
  });

  it('should allow IT_STAFF to view any ticket (GET /:id)', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', requesterId: 'req2' });

    const res = await request(app)
      .get('/api/tickets/t1')
      .set('x-mock-role', 'IT_STAFF')
      .set('x-mock-id', 'staff1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('t1');
  });
});
