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
  const role = req.headers['x-mock-role'] || 'IT_STAFF';
  req.user = { id: 'staff123', role };
  next();
});

vi.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
}));

app.use('/api/tickets', ticketRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.statusCode || 500).json({ error: err.error, message: err.message });
});

describe('Ticket Updates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow IT_STAFF to claim a ticket (update ownerId)', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', ownerId: null });
    prisma.ticket.update.mockResolvedValue({ id: 't1', ownerId: 'staff123' });

    const res = await request(app)
      .patch('/api/tickets/t1')
      .set('x-mock-role', 'IT_STAFF')
      .send({ ownerId: 'staff123' });

    expect(res.status).toBe(200);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ ownerId: 'staff123' })
    }));
  });

  it('should allow IT_STAFF to update itPriority and status', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', itPriority: 'HIGH', status: 'IN_PROGRESS' });

    const res = await request(app)
      .patch('/api/tickets/t1')
      .set('x-mock-role', 'IT_STAFF')
      .send({ itPriority: 'HIGH', status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ itPriority: 'HIGH', status: 'IN_PROGRESS' })
    }));
  });

  it('should block REQUESTER from updating IT fields', async () => {
    const res = await request(app)
      .patch('/api/tickets/t1')
      .set('x-mock-role', 'REQUESTER')
      .send({ itPriority: 'HIGH', status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot update IT fields/i);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it('should return 404 if ticket not found', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/tickets/t999')
      .set('x-mock-role', 'IT_STAFF')
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(404);
  });
});
