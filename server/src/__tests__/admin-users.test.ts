import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/user.routes';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

vi.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrisma), Role: { ADMINISTRATOR: 'ADMINISTRATOR', IT_STAFF: 'IT_STAFF', REQUESTER: 'REQUESTER' } };
});

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

vi.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'admin123', role: 'ADMINISTRATOR' };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

const prisma = new PrismaClient() as any;
const app = express();
app.use(express.json());
app.use('/api/admin/users', userRoutes);

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all users', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: '1', name: 'John Doe' }]);
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1', name: 'John Doe' }]);
  });

  it('should create a new user successfully', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '2', name: 'New User' });

    const res = await request(app).post('/api/admin/users').send({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'REQUESTER'
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New User');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('should return 409 if user email or name exists', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'exist' });

    const res = await request(app).post('/api/admin/users').send({
      name: 'Existing',
      email: 'exist@example.com',
      password: 'pwd',
      role: 'REQUESTER'
    });

    expect(res.status).toBe(409);
  });

  it('should reset user password (PATCH /:id/password)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user1' });
    prisma.user.update.mockResolvedValue({ id: 'user1' });

    const res = await request(app).patch('/api/admin/users/user1/password');
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset successfully');
  });
});
