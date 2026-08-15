import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

describe('GET /api/categories', () => {

  it('should return 200 and an array of categories', async () => {
    const response = await request(app).get('/api/categories');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    }
  });
});
