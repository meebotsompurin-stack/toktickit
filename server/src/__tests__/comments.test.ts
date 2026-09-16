import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import ticketRoutes from '../routes/ticket.routes';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrisma = {
    ticketComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrisma) };
});

const prisma = new PrismaClient() as any;

const app = express();
app.use(express.json());

// Set up a middleware to mock the authenticated user dynamically via headers
app.use((req: any, res: any, next: any) => {
  const role = req.headers['x-mock-role'] || 'REQUESTER';
  req.user = { id: 'user123', role };
  next();
});

// Since the route itself has router.use(authenticate), we mock authenticate
vi.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
}));

app.use('/api/tickets', ticketRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.statusCode || 500).json({ error: err.error, message: err.message });
});

describe('Ticket Comments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list public comments (GET /:id/comments)', async () => {
    prisma.ticketComment.findMany.mockResolvedValue([
      { id: 'c1', content: 'Public comment', isInternal: false }
    ]);

    const res = await request(app).get('/api/tickets/t1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'c1', content: 'Public comment', isInternal: false }
    ]);
    expect(prisma.ticketComment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ ticketId: 't1', isInternal: false })
    }));
  });

  it('should add a public comment (POST /:id/comments)', async () => {
    prisma.ticketComment.create.mockResolvedValue({ id: 'c2', content: 'New comment' });

    const res = await request(app)
      .post('/api/tickets/t1/comments')
      .send({ content: 'New comment' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('New comment');
    expect(prisma.ticketComment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isInternal: false, content: 'New comment' })
    }));
  });

  it('should deny empty public comment (POST /:id/comments)', async () => {
    const res = await request(app)
      .post('/api/tickets/t1/comments')
      .send({ content: '   ' });

    expect(res.status).toBe(422);
  });

  it('should block requester from adding internal notes (POST /:id/notes)', async () => {
    const res = await request(app)
      .post('/api/tickets/t1/notes')
      .set('x-mock-role', 'REQUESTER')
      .send({ content: 'Secret note' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Requesters cannot add internal notes');
  });

  it('should allow IT_STAFF to add internal notes (POST /:id/notes)', async () => {
    prisma.ticketComment.create.mockResolvedValue({ id: 'n1', content: 'Secret note' });

    const res = await request(app)
      .post('/api/tickets/t1/notes')
      .set('x-mock-role', 'IT_STAFF')
      .send({ content: 'Secret note' });

    expect(res.status).toBe(201);
    expect(prisma.ticketComment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isInternal: true })
    }));
  });

  it('should block requester from viewing internal notes (GET /:id/notes)', async () => {
    const res = await request(app)
      .get('/api/tickets/t1/notes')
      .set('x-mock-role', 'REQUESTER');

    expect(res.status).toBe(403);
  });
});
