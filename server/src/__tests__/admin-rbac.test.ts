import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

describe('Admin RBAC Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup a dummy route protected by requireRole
    app.get('/protected', (req: any, res: any, next) => {
      // Mock the authenticate middleware behavior
      req.user = req.headers['x-user-role'] ? { role: req.headers['x-user-role'] } : undefined;
      next();
    }, requireRole([Role.ADMINISTRATOR]), (req, res) => {
      res.status(200).json({ ok: true });
    });
  });

  it('should allow ADMINISTRATOR access', async () => {
    const res = await request(app).get('/protected').set('x-user-role', 'ADMINISTRATOR');
    expect(res.status).toBe(200);
  });

  it('should deny REQUESTER access with 403', async () => {
    const res = await request(app).get('/protected').set('x-user-role', 'REQUESTER');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });

  it('should deny IT_STAFF access with 403', async () => {
    const res = await request(app).get('/protected').set('x-user-role', 'IT_STAFF');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });

  it('should return 401 if user is not authenticated', async () => {
    const res = await request(app).get('/protected'); // No x-user-role header
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('User not authenticated');
  });
});
