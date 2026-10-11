import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev';

describe('Lab 4: Requester Dashboard API Tests (DASH-01, DASH-02)', () => {
  let alice: any;
  let bob: any;
  let emptyRequester: any;
  let aliceToken: string;
  let bobToken: string;
  let emptyRequesterToken: string;

  let aliceTicket1: any;
  let aliceTicket2: any;
  let aliceTicket3: any;
  let bobTicket: any;

  beforeAll(async () => {
    // 1. Fetch reference data
    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();
    if (!category || !relatedSystem) {
      throw new Error('Reference data missing. Please seed categories and related systems.');
    }

    // 2. Fetch test requesters
    const requesters = await prisma.user.findMany({
      where: { role: 'REQUESTER', isActive: true },
      take: 2,
    });
    if (requesters.length < 2) {
      throw new Error('Not enough requesters in DB. Please run prisma db seed first.');
    }
    alice = requesters[0];
    bob = requesters[1];

    emptyRequester = await prisma.user.create({
      data: {
        email: `empty.req.${Date.now()}@toktickit.dev`,
        name: 'Empty Requester',
        passwordHash: 'dummy-hash',
        role: 'REQUESTER',
        requiresPasswordChange: false,
      },
    });

    aliceToken = jwt.sign({ userId: alice.id, role: alice.role }, JWT_SECRET);
    bobToken = jwt.sign({ userId: bob.id, role: bob.role }, JWT_SECRET);
    emptyRequesterToken = jwt.sign({ userId: emptyRequester.id, role: emptyRequester.role }, JWT_SECRET);

    // 3. Create test tickets for Alice:
    // - Ticket 1: OPEN
    aliceTicket1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DASH-AL1-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Alice VPN connection failure',
        description: 'VPN disconnects every 5 minutes',
        requesterId: alice.id,
        status: 'OPEN',
      },
    });

    // - Ticket 2: WAITING_FOR_REQUESTER
    aliceTicket2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DASH-AL2-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Alice Outlook sync error',
        description: 'Waiting for requester feedback on password change',
        requesterId: alice.id,
        status: 'WAITING_FOR_REQUESTER',
      },
    });

    // - Ticket 3: RESOLVED
    aliceTicket3 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DASH-AL3-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Alice printer driver installation',
        description: 'Printer driver was installed successfully',
        requesterId: alice.id,
        status: 'RESOLVED',
      },
    });

    // 4. Create test ticket for Bob (different requester):
    bobTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DASH-BOB-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Bob network cable damage',
        description: 'RJ-45 clip broken',
        requesterId: bob.id,
        status: 'OPEN',
      },
    });
  });

  afterAll(async () => {
    const ticketIds = [
      aliceTicket1?.id,
      aliceTicket2?.id,
      aliceTicket3?.id,
      bobTicket?.id,
    ].filter(Boolean);

    for (const id of ticketIds) {
      await prisma.ticket.delete({ where: { id } }).catch(() => {});
    }

    if (emptyRequester?.id) {
      await prisma.user.delete({ where: { id: emptyRequester.id } }).catch(() => {});
    }

    await prisma.$disconnect();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-01: Requester dashboard returns only own ticket metrics
  // ──────────────────────────────────────────────────────────────────────────
  describe('DASH-01: Requester isolation on dashboard metrics', () => {
    it('should return metrics and recent tickets strictly for the authenticated requester', async () => {
      const res = await request(app)
        .get('/api/tickets/dashboard/requester')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metrics');
      expect(res.body).toHaveProperty('recentTickets');

      const { metrics, recentTickets } = res.body;

      // Alice has at least 2 open tickets (OPEN + WAITING_FOR_REQUESTER)
      // and Bob's open ticket must NOT be included in Alice's metrics.
      expect(metrics.totalOpen).toBeGreaterThanOrEqual(2);
      expect(metrics.waitingForRequester).toBeGreaterThanOrEqual(1);
      expect(metrics.recentlyResolved).toBeGreaterThanOrEqual(1);

      // Verify that recent tickets list contains only tickets belonging to Alice
      expect(Array.isArray(recentTickets)).toBe(true);
      const bobTicketFound = recentTickets.some(
        (t: any) => t.id === bobTicket.id || t.ticketNumber === bobTicket.ticketNumber
      );
      expect(bobTicketFound).toBe(false);

      const aliceTicketFound = recentTickets.some(
        (t: any) => t.id === aliceTicket1.id || t.ticketNumber === aliceTicket1.ticketNumber
      );
      expect(aliceTicketFound).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-02: Requester with 0 tickets returns 0 metrics and empty recentTickets
  // ──────────────────────────────────────────────────────────────────────────
  describe('DASH-02: Empty state for requester with no tickets', () => {
    it('should return zero for all metric counts and empty list when requester has no tickets', async () => {
      const res = await request(app)
        .get('/api/tickets/dashboard/requester')
        .set('Authorization', `Bearer ${emptyRequesterToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metrics');
      expect(res.body).toHaveProperty('recentTickets');

      const { metrics, recentTickets } = res.body;
      expect(metrics.totalOpen).toBe(0);
      expect(metrics.waitingForRequester).toBe(0);
      expect(metrics.recentlyUpdated).toBe(0);
      expect(metrics.recentlyResolved).toBe(0);
      expect(recentTickets).toEqual([]);
    });
  });
});
