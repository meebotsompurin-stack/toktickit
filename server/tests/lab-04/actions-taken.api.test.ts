import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev';

describe('Lab 4: Actions Taken API & Singleton Tests (ACTION-01 to ACTION-08)', () => {
  let requester1: any;
  let requester2: any;
  let staff1: any;
  let staff2: any;
  let ticket: any;
  let createdActionId: string;

  let requester1Token: string;
  let requester2Token: string;
  let staff1Token: string;
  let staff2Token: string;

  beforeAll(async () => {
    // 1. Fetch test users from DB
    const requesters = await prisma.user.findMany({
      where: { role: 'REQUESTER', isActive: true },
      take: 2,
    });
    const staffMembers = await prisma.user.findMany({
      where: { role: 'IT_STAFF', isActive: true },
      take: 2,
    });

    if (requesters.length < 2 || staffMembers.length < 2) {
      throw new Error('Not enough test users in DB. Please run prisma db seed first.');
    }

    requester1 = requesters[0];
    requester2 = requesters[1];
    staff1 = staffMembers[0];
    staff2 = staffMembers[1];

    requester1Token = jwt.sign({ userId: requester1.id, role: requester1.role }, JWT_SECRET);
    requester2Token = jwt.sign({ userId: requester2.id, role: requester2.role }, JWT_SECRET);
    staff1Token = jwt.sign({ userId: staff1.id, role: staff1.role }, JWT_SECRET);
    staff2Token = jwt.sign({ userId: staff2.id, role: staff2.role }, JWT_SECRET);

    // 2. Locate or create a test ticket owned by staff1 and requested by requester1
    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();

    if (!category || !relatedSystem) {
      throw new Error('Category or RelatedSystem missing. Please seed reference data.');
    }

    ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Test ticket for actions taken test suite',
        description: 'Verifying actions taken functionality for Lab 4',
        requesterId: requester1.id,
        ownerId: staff1.id,
        status: 'OPEN',
      },
    });
  });

  afterAll(async () => {
    if (ticket?.id) {
      // Clean up ticket if possible
      try {
        await prisma.ticket.delete({ where: { id: ticket.id } });
      } catch (err) {
        // Ignore if already cleaned or cascaded
      }
    }
    await prisma.$disconnect();
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-08 (Unit): Singleton PrismaClient (TD-03)
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-08: Singleton PrismaClient (TD-03)', () => {
    it('should export a singleton PrismaClient instance from lib/db.ts', async () => {
      // Dynamically load to verify lib/db exists and exports single instance
      const dbModule1 = await import('../../src/lib/db');
      expect(dbModule1.prisma).toBeDefined();

      const dbModule2 = await import('../../src/lib/db');
      expect(dbModule1.prisma).toBe(dbModule2.prisma);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-01: Create valid Actions Taken
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-01: Create valid Actions Taken', () => {
    it('should allow authorized IT Staff to create an action taken with valid fields', async () => {
      const payload = {
        actionDateTime: new Date().toISOString(),
        description: 'Inspected network switch ports and tested cable latency',
        result: 'Identified loose patch cable on port 14 and reseated it',
        followUpRequired: false,
        attachmentNotes: 'See switch log screenshot if attached',
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${ticket.id}/actions`)
        .set('Authorization', `Bearer ${staff1Token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.ticketId).toBe(ticket.id);
      expect(res.body.performedById).toBe(staff1.id);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.result).toBe(payload.result);
      expect(res.body.followUpRequired).toBe(false);

      createdActionId = res.body.id;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-02: Validation error if followUpRequired=true but no followUpNote
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-02: Validation error if followUpNote is missing when followUpRequired=true', () => {
    it('should reject with 422 Unprocessable Entity when followUpNote is empty or missing', async () => {
      const payload = {
        description: 'Replaced power supply unit',
        result: 'Unit powered on successfully',
        followUpRequired: true,
        // followUpNote is omitted
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${ticket.id}/actions`)
        .set('Authorization', `Bearer ${staff1Token}`)
        .send(payload);

      expect(res.status).toBe(422);
      expect(res.body).toMatchObject({
        error: expect.any(String),
        message: expect.stringMatching(/followUpNote/i),
        statusCode: 422,
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-03: Create by Requester -> 403 Forbidden
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-03: Create action by Requester is forbidden', () => {
    it('should return 403 Forbidden when a Requester attempts to create an action taken', async () => {
      const payload = {
        description: 'Attempting to self-resolve issue',
        result: 'Rebooted laptop',
        followUpRequired: false,
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${ticket.id}/actions`)
        .set('Authorization', `Bearer ${requester1Token}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-04: Create by IT Staff who is NOT Ticket owner -> succeeds (BR-02)
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-04: Performer != Ticket Owner allowed (BR-02)', () => {
    it('should allow IT Staff who is not ticket owner to record an action taken', async () => {
      // ticket.ownerId is staff1.id, but staff2 is recording this action
      const payload = {
        description: 'Assisted primary owner with packet capture analysis',
        result: 'Identified TCP reset packets from external firewall',
        followUpRequired: true,
        followUpNote: 'Coordinate with primary owner on firewall rule update',
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${ticket.id}/actions`)
        .set('Authorization', `Bearer ${staff2Token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.performedById).toBe(staff2.id);
      expect(res.body.ticketId).toBe(ticket.id);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-05: Update existing Actions Taken
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-05: Update existing Action Taken', () => {
    it('should update description, result, and follow-up fields while preserving original performer', async () => {
      if (!createdActionId) {
        throw new Error('createdActionId is required from ACTION-01');
      }

      const updatePayload = {
        description: 'Updated description: Inspected switch ports and verified VLAN configuration',
        result: 'Updated result: VLAN 20 was misconfigured, re-assigned to VLAN 10',
        followUpRequired: false,
        followUpNote: null,
      };

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/actions/${createdActionId}`)
        .set('Authorization', `Bearer ${staff1Token}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdActionId);
      expect(res.body.description).toBe(updatePayload.description);
      expect(res.body.result).toBe(updatePayload.result);
      expect(res.body.followUpRequired).toBe(false);
      expect(res.body.performedById).toBe(staff1.id);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-06: GET Actions for owned Ticket (Requester) -> returns all Actions
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-06: GET Actions for owned Ticket by Requester', () => {
    it('should allow the ticket owner Requester to view all actions taken on their ticket', async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket.id}/actions`)
        .set('Authorization', `Bearer ${requester1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const action = res.body[0];
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('result');
      expect(action).toHaveProperty('performedBy');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTION-07: GET Actions for non-owned Ticket (Requester) -> 403 Forbidden
  // ────────────────────────────────────────────────────────────────────────
  describe('ACTION-07: GET Actions for non-owned Ticket by Requester is forbidden', () => {
    it('should return 403 Forbidden when a Requester accesses actions of another user ticket', async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket.id}/actions`)
        .set('Authorization', `Bearer ${requester2Token}`);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Support ticketNumber parameter lookup (e.g. TKT-XXXX)
  // ────────────────────────────────────────────────────────────────────────
  describe('Support ticketNumber in Actions endpoints', () => {
    it('should allow fetching and creating actions using ticketNumber instead of UUID', async () => {
      // 1. GET using ticketNumber
      const getRes = await request(app)
        .get(`/api/tickets/${ticket.ticketNumber}/actions`)
        .set('Authorization', `Bearer ${requester1Token}`);

      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body)).toBe(true);

      // 2. POST using ticketNumber
      const postRes = await request(app)
        .post(`/api/staff/tickets/${ticket.ticketNumber}/actions`)
        .set('Authorization', `Bearer ${staff1Token}`)
        .send({
          description: 'Testing action creation using ticketNumber',
          result: 'Succeeded using ticketNumber lookup',
          followUpRequired: false,
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.ticketId).toBe(ticket.id);

      // 3. PATCH using ticketNumber
      const patchRes = await request(app)
        .patch(`/api/staff/tickets/${ticket.ticketNumber}/actions/${postRes.body.id}`)
        .set('Authorization', `Bearer ${staff1Token}`)
        .send({
          result: 'Updated using ticketNumber lookup',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.result).toBe('Updated using ticketNumber lookup');
    });
  });
});
