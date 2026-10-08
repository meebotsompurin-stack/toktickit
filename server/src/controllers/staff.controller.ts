import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

export const getStaffTicketsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, itPriority, search, page = '1', limit = '10' } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (itPriority) where.itPriority = itPriority;
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
          owner: { select: { name: true, email: true } },
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
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
      return;
    }
    const updated = await prisma.ticket.update({
      where: { id },
      data: { ownerId: req.user!.id },
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
    const { itPriority } = req.body;
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
      return;
    }
    const updated = await prisma.ticket.update({
      where: { id },
      data: { itPriority },
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
    const { status } = req.body;
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
      return;
    }
    const updated = await prisma.ticket.update({
      where: { id },
      data: { status },
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
    const { description, result, followUpRequired, followUpNote, attachmentNotes } = req.body;

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
