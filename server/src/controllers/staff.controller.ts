import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { isValidTransition } from '../lib/status-transitions';

export const getStaffTicketsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      status,
      itPriority,
      priority,
      search,
      ownerId,
      owner,
      unassigned,
      recentlyUpdated,
      page = '1',
      limit = '10'
    } = req.query;
    
    const where: any = {};
    if (status) where.status = status as string;
    const prio = (itPriority || priority) as string;
    if (prio) where.itPriority = prio;

    if (unassigned === 'true' || unassigned === '1' || ownerId === 'unassigned' || owner === 'unassigned') {
      where.ownerId = null;
    } else if (ownerId) {
      where.ownerId = ownerId as string;
    } else if (owner) {
      where.ownerId = owner as string;
    }

    if (recentlyUpdated === 'true' || recentlyUpdated === '1') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.updatedAt = { gte: sevenDaysAgo };
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          category: true,
          relatedSystem: true,
          requester: { select: { name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: totalPages === 0 ? 1 : totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketOwnerHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { version } = req.body;
    let ticket: any = null;
    if (typeof prisma.ticket.findFirst === 'function') {
      ticket = await prisma.ticket.findFirst({
        where: {
          OR: [
            { id },
            { ticketNumber: id },
          ],
        },
      });
    }
    if (!ticket && typeof prisma.ticket.findUnique === 'function') {
      ticket = await prisma.ticket.findUnique({ where: { id } });
    }
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found', statusCode: 404, details: [] });
      return;
    }

    if (version !== undefined && ticket.version !== Number(version)) {
      res.status(409).json({
        error: 'Conflict',
        message: `Ticket version mismatch. Expected version ${ticket.version}, but received ${version}.`,
        statusCode: 409,
        details: [{
          field: 'version',
          expectedVersion: ticket.version,
          currentServerVersion: ticket.version,
          providedVersion: version,
        }],
      });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        ownerId: req.user!.id,
        version: { increment: 1 },
      },
      include: { owner: { select: { name: true, email: true } } }
    });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const updatePriorityHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { itPriority, version } = req.body;
    let ticket: any = null;
    if (typeof prisma.ticket.findFirst === 'function') {
      ticket = await prisma.ticket.findFirst({
        where: {
          OR: [
            { id },
            { ticketNumber: id },
          ],
        },
      });
    }
    if (!ticket && typeof prisma.ticket.findUnique === 'function') {
      ticket = await prisma.ticket.findUnique({ where: { id } });
    }
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found', statusCode: 404, details: [] });
      return;
    }

    if (version !== undefined && ticket.version !== Number(version)) {
      res.status(409).json({
        error: 'Conflict',
        message: `Ticket version mismatch. Expected version ${ticket.version}, but received ${version}.`,
        statusCode: 409,
        details: [{
          field: 'version',
          expectedVersion: ticket.version,
          currentServerVersion: ticket.version,
          providedVersion: version,
        }],
      });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        itPriority,
        version: { increment: 1 },
      },
      include: { owner: { select: { name: true, email: true } } }
    });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const updateStatusHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, version } = req.body;
    let ticket: any = null;
    if (typeof prisma.ticket.findFirst === 'function') {
      ticket = await prisma.ticket.findFirst({
        where: {
          OR: [
            { id },
            { ticketNumber: id },
          ],
        },
      });
    }
    if (!ticket && typeof prisma.ticket.findUnique === 'function') {
      ticket = await prisma.ticket.findUnique({ where: { id } });
    }
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found', statusCode: 404, details: [] });
      return;
    }

    if (ticket.status && !isValidTransition(ticket.status, status, req.user!.role)) {
      res.status(422).json({
        error: 'Unprocessable Entity',
        message: `Invalid status transition from ${ticket.status} to ${status} for role ${req.user!.role}`,
        statusCode: 422,
        details: [
          {
            field: 'status',
            message: `Transition from ${ticket.status} to ${status} is not permitted for ${req.user!.role}`,
          },
        ],
      });
      return;
    }

    if (version !== undefined && ticket.version !== Number(version)) {
      res.status(409).json({
        error: 'Conflict',
        message: `Ticket version mismatch. Expected version ${ticket.version}, but received ${version}.`,
        statusCode: 409,
        details: [
          {
            field: 'version',
            expectedVersion: ticket.version,
            currentServerVersion: ticket.version,
            providedVersion: version,
          },
        ],
      });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status,
        version: { increment: 1 },
      },
      include: { owner: { select: { name: true, email: true } } }
    });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const createActionTakenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const performerId = req.user!.id;
    const { actionDateTime, description, result, followUpRequired = false, followUpNote, attachmentNotes } = req.body;

    const details: { field: string; message: string }[] = [];

    if (!description || typeof description !== 'string' || description.trim() === '') {
      details.push({ field: 'description', message: 'Action description is required' });
    }

    if (!result || typeof result !== 'string' || result.trim() === '') {
      details.push({ field: 'result', message: 'Action result is required' });
    }

    if (followUpRequired && (!followUpNote || typeof followUpNote !== 'string' || followUpNote.trim() === '')) {
      details.push({ field: 'followUpNote', message: 'followUpNote is required when followUpRequired is true' });
    }

    if (details.length > 0) {
      res.status(422).json({
        error: 'Unprocessable Entity',
        message: details.map(d => d.message).join('; '),
        statusCode: 422,
        details,
      });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: ticketId },
          { ticketNumber: ticketId },
        ],
      },
    });

    if (!ticket) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Ticket not found',
        statusCode: 404,
        details: [],
      });
      return;
    }

    const action = await prisma.actionTaken.create({
      data: {
        ticketId: ticket.id,
        actionDateTime: actionDateTime ? new Date(actionDateTime) : new Date(),
        description: description.trim(),
        result: result.trim(),
        performedById: performerId,
        followUpRequired: Boolean(followUpRequired),
        followUpNote: followUpRequired && followUpNote ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
};

export const updateActionTakenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId, actionId } = req.params;
    const { description, result, followUpRequired, followUpNote, attachmentNotes, version } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: ticketId },
          { ticketNumber: ticketId },
        ],
      },
    });

    if (!ticket) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Ticket not found',
        statusCode: 404,
        details: [],
      });
      return;
    }

    const existingAction = await prisma.actionTaken.findFirst({
      where: {
        id: actionId,
        ticketId: ticket.id,
      },
    });

    if (!existingAction) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Action Taken record not found for this ticket',
        statusCode: 404,
        details: [],
      });
      return;
    }

    if (version !== undefined && existingAction.version !== Number(version)) {
      res.status(409).json({
        error: 'Conflict',
        message: `ActionTaken version mismatch. Expected version ${existingAction.version}, but received ${version}.`,
        statusCode: 409,
        details: [{
          field: 'version',
          expectedVersion: existingAction.version,
          currentServerVersion: existingAction.version,
          providedVersion: version,
        }],
      });
      return;
    }

    const isFollowUpRequired = followUpRequired !== undefined ? Boolean(followUpRequired) : existingAction.followUpRequired;
    const note = followUpNote !== undefined ? followUpNote : existingAction.followUpNote;

    if (isFollowUpRequired && (!note || typeof note !== 'string' || note.trim() === '')) {
      res.status(422).json({
        error: 'Unprocessable Entity',
        message: 'followUpNote is required when followUpRequired is true',
        statusCode: 422,
        details: [{ field: 'followUpNote', message: 'followUpNote is required when followUpRequired is true' }],
      });
      return;
    }

    const dataToUpdate: any = {};
    if (description !== undefined) dataToUpdate.description = description.trim();
    if (result !== undefined) dataToUpdate.result = result.trim();
    if (followUpRequired !== undefined) dataToUpdate.followUpRequired = Boolean(followUpRequired);
    if (followUpNote !== undefined) dataToUpdate.followUpNote = isFollowUpRequired && followUpNote ? followUpNote.trim() : null;
    if (attachmentNotes !== undefined) dataToUpdate.attachmentNotes = attachmentNotes ? attachmentNotes.trim() : null;
    dataToUpdate.version = { increment: 1 };

    const updated = await prisma.actionTaken.update({
      where: { id: actionId },
      data: dataToUpdate,
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const getStaffMembersHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: ['IT_STAFF', 'ADMINISTRATOR'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(staffMembers);
  } catch (error) {
    next(error);
  }
};

export const getStaffDashboardHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffId = req.user!.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [unassigned, ownedByMe, recentlyUpdated, statusGroup, priorityGroup, urgentTickets] = await Promise.all([
      // Unassigned tickets
      prisma.ticket.count({
        where: {
          ownerId: null,
        },
      }),
      // Tickets owned by current staff
      prisma.ticket.count({
        where: {
          ownerId: staffId,
        },
      }),
      // Tickets updated within the last 7 days (all tickets)
      prisma.ticket.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      // Status breakdown
      prisma.ticket.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Priority breakdown
      prisma.ticket.groupBy({
        by: ['itPriority'],
        where: { itPriority: { not: null } },
        _count: { id: true },
      }),
      // Urgent tickets awaiting action (Critical/High priority or unassigned open)
      prisma.ticket.findMany({
        where: {
          status: { notIn: ['CLOSED', 'CANCELLED'] },
          OR: [
            { itPriority: { in: ['CRITICAL', 'HIGH'] } },
            { ownerId: null },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          status: true,
          itPriority: true,
          owner: { select: { name: true } },
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const byStatus: Record<string, number> = {
      NEW: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_REQUESTER: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
      CANCELLED: 0,
    };
    statusGroup.forEach((g) => {
      byStatus[g.status] = g._count.id;
    });

    const byItPriority: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    priorityGroup.forEach((g) => {
      if (g.itPriority) {
        byItPriority[g.itPriority] = g._count.id;
      }
    });

    const formattedUrgent = urgentTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      status: t.status,
      itPriority: t.itPriority,
      ownerName: t.owner?.name || 'Unassigned',
      updatedAt: t.updatedAt,
    }));

    res.status(200).json({
      metrics: {
        unassigned,
        ownedByMe,
        recentlyUpdated,
        byStatus,
        byItPriority,
      },
      urgentTickets: formattedUrgent,
    });
  } catch (error) {
    next(error);
  }
};

