import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev';

describe('Lab 4: Ticket Workflow & Status Transition API Tests (WORK-01 to WORK-06)', () => {
  let requester: any;
  let staff: any;
  let newTicket: any;
  let inProgressTicket: any;
  let actionTicket: any;
  let testAction: any;

  let requesterToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // 1. Fetch test users from DB
    const requesters = await prisma.user.findMany({
      where: { role: 'REQUESTER', isActive: true },
      take: 1,
    });
    const staffMembers = await prisma.user.findMany({
      where: { role: 'IT_STAFF', isActive: true },
      take: 1,
    });

    if (requesters.length === 0 || staffMembers.length === 0) {
      throw new Error('Not enough test users in DB. Please run prisma db seed first.');
    }

    requester = requesters[0];
    staff = staffMembers[0];

    requesterToken = jwt.sign({ userId: requester.id, role: requester.role }, JWT_SECRET);
    staffToken = jwt.sign({ userId: staff.id, role: staff.role }, JWT_SECRET);

    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();

    if (!category || !relatedSystem) {
      throw new Error('Reference data missing. Please seed categories and related systems.');
    }

    // 2. Create test tickets
    // Ticket in NEW status
    newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-NEW-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Workflow test ticket in NEW status',
        description: 'Testing valid and invalid transitions from NEW',
        requesterId: requester.id,
        status: 'NEW',
      },
    });

    // Ticket in IN_PROGRESS status
    inProgressTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-INP-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Workflow test ticket in IN_PROGRESS status',
        description: 'Testing appearsResolved advisory rule',
        requesterId: requester.id,
        ownerId: staff.id,
        status: 'IN_PROGRESS',
      },
    });

    // Ticket for concurrency testing
    actionTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-ACT-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Concurrency test ticket',
        description: 'Testing optimistic locking and stale version handling',
        requesterId: requester.id,
        ownerId: staff.id,
        status: 'OPEN',
      },
    });

    // Create an action taken for WORK-06
    testAction = await prisma.actionTaken.create({
      data: {
        ticketId: actionTicket.id,
        description: 'Initial action for concurrency testing',
        result: 'Initial result',
        performedById: staff.id,
        followUpRequired: false,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test tickets
    const ticketIds = [newTicket?.id, inProgressTicket?.id, actionTicket?.id].filter(Boolean);
    for (const id of ticketIds) {
      try {
        await prisma.ticket.delete({ where: { id } });
      } catch (err) {
        // Ignore
      }
    }
    await prisma.$disconnect();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-01: Valid transition: NEW → OPEN by IT Staff returns 200 OK
  // ──────────────────────────────────────────────────────────────────────────
  describe('WORK-01: Valid status transition', () => {
    it('should allow IT Staff to transition ticket from NEW to OPEN', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${newTicket.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'OPEN', version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OPEN');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-02: Invalid transition: NEW → CLOSED directly returns 422
  // ──────────────────────────────────────────────────────────────────────────
  describe('WORK-02: Invalid status transition rejected', () => {
    it('should reject invalid transition (e.g. from current status to CLOSED directly) with 422', async () => {
      // Create a fresh ticket in NEW status
      const category = await prisma.category.findFirst();
      const relatedSystem = await prisma.relatedSystem.findFirst();

      const freshNewTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-WF-INV-${Date.now().toString().slice(-4)}`,
          categoryId: category!.id,
          relatedSystemId: relatedSystem!.id,
          summary: 'Fresh ticket in NEW status for invalid transition',
          description: 'Testing illegal jump from NEW directly to CLOSED',
          requesterId: requester.id,
          status: 'NEW',
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${freshNewTicket.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'CLOSED', version: 1 });

      expect(res.status).toBe(422);
      expect(res.body).toMatchObject({
        error: expect.any(String),
        statusCode: 422,
      });

      // Cleanup
      await prisma.ticket.delete({ where: { id: freshNewTicket.id } }).catch(() => {});
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-03: Transition by unauthorized role returns 403
  // ──────────────────────────────────────────────────────────────────────────
  describe('WORK-03: Transition by unauthorized role', () => {
    it('should return 403 Forbidden when a Requester attempts to transition ticket status', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${newTicket.id}/status`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-04: appearsResolved=true does NOT auto-change status to RESOLVED
  // ──────────────────────────────────────────────────────────────────────────
  describe('WORK-04: appearsResolved is advisory only', () => {
    it('should set appearsResolved to true without altering ticket status to RESOLVED', async () => {
      const res = await request(app)
        .patch(`/api/tickets/${inProgressTicket.id}/resolution-flag`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ appearsResolved: true });

      expect(res.status).toBe(200);
      expect(res.body.appearsResolved).toBe(true);
      expect(res.body.status).toBe('IN_PROGRESS');

      // Verify in DB that status is still IN_PROGRESS
      const ticketInDb = await prisma.ticket.findUnique({
        where: { id: inProgressTicket.id },
      });
      expect(ticketInDb?.status).toBe('IN_PROGRESS');
      expect(ticketInDb?.appearsResolved).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-05: Concurrent update (stale version) returns 409 Conflict
  // ──────────────────────────────────────────────────────────────────────────
  describe('WORK-05: Concurrent ticket status update (stale version)', () => {
    it('should reject stale version with 409 Conflict when concurrent modification occurs', async () => {
      // First update with version 1 -> succeeds and increments version to 2
      const firstUpdate = await request(app)
        .patch(`/api/staff/tickets/${actionTicket.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'IN_PROGRESS', version: 1 });

      expect(firstUpdate.status).toBe(200);

      // Stale update still sending old version: 1 -> should return 409 Conflict
      const staleUpdate = await request(app)
        .patch(`/api/staff/tickets/${actionTicket.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'WAITING_FOR_REQUESTER', version: 1 });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body).toMatchObject({
        error: expect.stringMatching(/conflict/i),
        statusCode: 409,
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-06: Concurrent Actions Taken update (stale version) returns 409 Conflict
  // ──────────────────────────────────────────────────────────────────────────
  describe('WORK-06: Concurrent Actions Taken update (stale version)', () => {
    it('should reject stale update on Actions Taken with 409 Conflict', async () => {
      // First update action with version: 1 -> succeeds
      const firstUpdate = await request(app)
        .patch(`/api/staff/tickets/${actionTicket.id}/actions/${testAction.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          description: 'Updated description from first user',
          result: 'Updated result from first user',
          version: 1,
        });

      expect(firstUpdate.status).toBe(200);

      // Stale update sending outdated version: 1 -> should return 409 Conflict
      const staleUpdate = await request(app)
        .patch(`/api/staff/tickets/${actionTicket.id}/actions/${testAction.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          description: 'Stale overwrite attempt from second user',
          result: 'Stale result',
          version: 1,
        });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body).toMatchObject({
        error: expect.stringMatching(/conflict/i),
        statusCode: 409,
      });
    });
  });
});
