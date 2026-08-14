import request from 'supertest';
import { describe, it, expect, afterAll } from 'vitest';
import app, { server } from '../../src/index';

describe('GET /api/health', () => {
  afterAll(() => {
    server.close();
  });

  it('should return 200 and status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'Tok TickIT API',
    });
  });
});
