import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/categories', () => {
  it('should return 200 and an array of exactly 4 categories in order', async () => {
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) throw new Error('No user found in DB. Did you seed?');

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev'
    );
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // 1. Ensure the response body is an array with exactly 4 items
    expect(response.body).toHaveLength(4);
    
    // 2. Verify that the items contain 'id' and 'name' properties
    response.body.forEach((category: any) => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
    });

    // 3. Check the specific order of the categories
    expect(response.body[0].name).toBe('Account and Access');
    expect(response.body[1].name).toBe('Hardware');
    expect(response.body[2].name).toBe('Software');
    expect(response.body[3].name).toBe('Network');
  });
});
