import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

describe('GET /api/categories', () => {
  it('should return 200 and an array of exactly 4 categories in order', async () => {
    const response = await request(app).get('/api/categories');
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
  });
});
