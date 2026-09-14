import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index'; 
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const { mockUserDb } = vi.hoisted(() => {
  return {
    mockUserDb: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      user: mockUserDb
    })),
    Role: {
      REQUESTER: 'REQUESTER',
      IT_STAFF: 'IT_STAFF',
      ADMINISTRATOR: 'ADMINISTRATOR'
    }
  };
});

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  }
}));

describe('Auth API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: 'hashedpassword',
    role: 'REQUESTER',
    isActive: true,
    requiresPasswordChange: true
  };

  describe('POST /api/auth/login', () => {
    it('1. Success - Returns 200, includes token, and user data MUST NOT include passwordHash', async () => {
      mockUserDb.findUnique.mockResolvedValue(validUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user.email).toBe('john@example.com');
      expect(response.body.user.isActive).toBe(true);
    });

    it('2. Fail - Inactive - Returns 403 with generic error (as per AC-03)', async () => {
      const inactiveUser = { ...validUser, isActive: false };
      mockUserDb.findUnique.mockResolvedValue(inactiveUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'password123' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('3. Fail - Wrong Password - Returns 401 with generic error', async () => {
      mockUserDb.findUnique.mockResolvedValue(validUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toMatch(/invalid/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('4. Success - Returns 200 with user data (no passwordHash)', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'user-123', role: 'REQUESTER' }, process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev');
      
      mockUserDb.findUnique.mockResolvedValue(validUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user.email).toBe('john@example.com');
    });

    it('5. Fail - No Token - Returns 401 Unauthorized', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('6. Success - Returns 200, updates password, and sets requiresPasswordChange: false', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'user-123', role: 'REQUESTER' }, process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev');
      
      mockUserDb.findUnique.mockResolvedValue(validUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('newHashedPassword' as never);
      mockUserDb.update.mockResolvedValue({ ...validUser, passwordHash: 'newHashedPassword', requiresPasswordChange: false });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/success/i);
      
      expect(mockUserDb.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user-123' },
        data: {
          passwordHash: 'newHashedPassword',
          requiresPasswordChange: false
        }
      }));
    });
  });
});
