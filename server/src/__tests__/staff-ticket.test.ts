import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import staffRoutes from '../routes/staff.routes';
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
  requireRole: (roles: any[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  }
}));

app.use('/api/staff', staffRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.statusCode || 500).json({ error: err.error, message: err.message });
});

describe('Staff Ticket Updates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow IT_STAFF to update a ticket owner (update ownerId)', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', ownerId: null });
    prisma.ticket.update.mockResolvedValue({ id: 't1', ownerId: 'staff123' });

    const res = await request(app)
      .patch('/api/staff/tickets/t1/owner')
      .set('x-mock-role', 'IT_STAFF')
      .send();

    expect(res.status).toBe(200);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ ownerId: 'staff123' })
    }));
  });

  it('should allow IT_STAFF to update itPriority', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', itPriority: 'HIGH' });

    const res = await request(app)
      .patch('/api/staff/tickets/t1/priority')
      .set('x-mock-role', 'IT_STAFF')
      .send({ itPriority: 'HIGH' });

    expect(res.status).toBe(200);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ itPriority: 'HIGH' })
    }));
  });

  it('should allow IT_STAFF to update status', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', status: 'IN_PROGRESS' });

    const res = await request(app)
      .patch('/api/staff/tickets/t1/status')
      .set('x-mock-role', 'IT_STAFF')
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ status: 'IN_PROGRESS' })
    }));
  });

  it('should block REQUESTER from updating IT fields', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/t1/status')
      .set('x-mock-role', 'REQUESTER')
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it('should return 404 if ticket not found', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/staff/tickets/t999/status')
      .set('x-mock-role', 'IT_STAFF')
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(404);
  });
});
