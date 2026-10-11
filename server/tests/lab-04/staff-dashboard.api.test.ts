import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev';

describe('Lab 4: IT Staff Dashboard API Tests (DASH-03, DASH-04, DASH-05)', () => {
  let staff: any;
  let requester: any;
  let staffToken: string;
  let requesterToken: string;

  let unassignedTicket: any;
  let ownedTicket: any;
  let recentTicket: any;
  let oldTicket: any;

  beforeAll(async () => {
    // 1. Fetch reference data
    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();
    if (!category || !relatedSystem) {
      throw new Error('Reference data missing. Please seed categories and related systems.');
    }

    // 2. Fetch users
    const staffMembers = await prisma.user.findMany({
      where: { role: 'IT_STAFF', isActive: true },
      take: 1,
    });
    const requesters = await prisma.user.findMany({
      where: { role: 'REQUESTER', isActive: true },
      take: 1,
    });

    if (staffMembers.length === 0 || requesters.length === 0) {
      throw new Error('Not enough test users in DB. Please run prisma db seed first.');
    }

    staff = staffMembers[0];
    requester = requesters[0];

    staffToken = jwt.sign({ userId: staff.id, role: staff.role }, JWT_SECRET);
    requesterToken = jwt.sign({ userId: requester.id, role: requester.role }, JWT_SECRET);

    // 3. Create test tickets
    // - Unassigned ticket with CRITICAL priority (urgent)
    unassignedTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STF-UNASS-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Core database failover',
        description: 'Cluster lost quorum',
        requesterId: requester.id,
        ownerId: null,
        status: 'OPEN',
        itPriority: 'CRITICAL',
      },
    });

    // - Ticket owned by this staff member
    ownedTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STF-OWNED-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Staff owned ticket',
        description: 'Assigned to Frank',
        requesterId: requester.id,
        ownerId: staff.id,
        status: 'IN_PROGRESS',
        itPriority: 'HIGH',
      },
    });

    // - Ticket updated recently (within 7 days)
    recentTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STF-RECENT-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Recently updated ticket',
        description: 'Updated 1 day ago',
        requesterId: requester.id,
        status: 'OPEN',
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    });

    // - Old ticket updated 14 days ago (outside 7-day window)
    oldTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STF-OLD-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Old ticket outside 7-day window',
        description: 'Updated 14 days ago',
        requesterId: requester.id,
        status: 'CLOSED',
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
    });
  });

  afterAll(async () => {
    const ticketIds = [
      unassignedTicket?.id,
      ownedTicket?.id,
      recentTicket?.id,
      oldTicket?.id,
    ].filter(Boolean);

    for (const id of ticketIds) {
      await prisma.ticket.delete({ where: { id } }).catch(() => {});
    }

    await prisma.$disconnect();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-03: Staff sees unassigned count, owned count, status breakdown
  // ──────────────────────────────────────────────────────────────────────────
  describe('DASH-03: IT Staff operational metrics', () => {
    it('should return unassigned count, ownedByMe count, byStatus breakdown, and byItPriority breakdown', async () => {
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metrics');
      const { metrics, urgentTickets } = res.body;

      expect(typeof metrics.unassigned).toBe('number');
      expect(metrics.unassigned).toBeGreaterThanOrEqual(1);

      expect(typeof metrics.ownedByMe).toBe('number');
      expect(metrics.ownedByMe).toBeGreaterThanOrEqual(1);

      expect(metrics).toHaveProperty('byStatus');
      expect(typeof metrics.byStatus).toBe('object');
      expect(metrics.byStatus).toHaveProperty('OPEN');
      expect(metrics.byStatus).toHaveProperty('IN_PROGRESS');

      expect(metrics).toHaveProperty('byItPriority');
      expect(typeof metrics.byItPriority).toBe('object');
      expect(metrics.byItPriority).toHaveProperty('CRITICAL');
      expect(metrics.byItPriority).toHaveProperty('HIGH');

      expect(Array.isArray(urgentTickets)).toBe(true);
      const unassignedFound = urgentTickets.some(
        (t: any) => t.id === unassignedTicket.id || t.ticketNumber === unassignedTicket.ticketNumber
      );
      expect(unassignedFound).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-04: Staff dashboard respects 7-day window for recently updated
  // ──────────────────────────────────────────────────────────────────────────
  describe('DASH-04: 7-day window for recently updated metrics', () => {
    it('should only include tickets updated within the last 7 days in recentlyUpdated count', async () => {
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      const { metrics } = res.body;

      expect(typeof metrics.recentlyUpdated).toBe('number');
      expect(metrics.recentlyUpdated).toBeGreaterThanOrEqual(1);

      // Verify that the count matches the DB query for updatedAt >= 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const expectedRecentCount = await prisma.ticket.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
      });

      expect(metrics.recentlyUpdated).toBe(expectedRecentCount);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-05: Requester accessing staff dashboard gets 403 Forbidden
  // ──────────────────────────────────────────────────────────────────────────
  describe('DASH-05: RBAC guard on Staff Dashboard endpoint', () => {
    it('should return 403 Forbidden when a Requester attempts to access staff dashboard', async () => {
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });
});
