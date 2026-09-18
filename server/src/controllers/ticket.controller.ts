import { Request, Response, NextFunction } from 'express';
import * as TicketService from '../services/ticket.service';

export const createTicketHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requesterId = req.user!.id; // AC-REQ-01: Always use req.user.id
    const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;

    const details: { field: string; message: string }[] = [];

    if (!categoryId) details.push({ field: 'categoryId', message: 'Category is required' });
    if (!relatedSystemId) details.push({ field: 'relatedSystemId', message: 'Related System is required' });
    
    if (!requestedPriority) {
      details.push({ field: 'requestedPriority', message: 'Priority is required' });
    } else if (!['Low', 'Medium', 'High'].includes(requestedPriority)) {
      details.push({ field: 'requestedPriority', message: 'Priority must be Low, Medium, or High' });
    }

    if (!summary) {
      details.push({ field: 'summary', message: 'Summary is required' });
    } else if (summary.length > 100) {
      details.push({ field: 'summary', message: 'Summary must not exceed 100 characters' });
    }

    if (!description) {
      details.push({ field: 'description', message: 'Description is required' });
    } else if (description.length > 1000) {
      details.push({ field: 'description', message: 'Description must not exceed 1000 characters' });
    }

    if (details.length > 0) {
      throw {
        statusCode: 400,
        error: 'Validation Failed',
        message: 'Invalid input data',
        details
      };
    }

    const ticket = await TicketService.createTicket({
      categoryId,
      relatedSystemId,
      requestedPriority,
      summary,
      description,
      requesterId
    });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

export const getTicketsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requesterId = req.user!.id; // AC-REQ-01
    
    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const priority = req.query.priority as string | undefined;
    const status = req.query.status as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    // Only enforce requesterId filter if the user is a REQUESTER. IT_STAFF and ADMIN see all tickets.
    const queryRequesterId = req.user!.role === 'REQUESTER' ? requesterId : undefined;

    const result = await TicketService.getTickets(queryRequesterId, {
      search,
      categoryId,
      priority,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTicketByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { ticketId } = req.params;

    const ticket = await TicketService.getTicketById(ticketId);

    // AC-REQ-02: Check ownership for REQUESTER without leaking existence
    if (user.role === 'REQUESTER') {
      if (!ticket || ticket.requesterId !== user.id) {
        throw { statusCode: 403, error: 'Forbidden', message: 'You do not have permission to view this ticket' };
      }
    } else {
      // IT_STAFF and ADMIN just get 404 if it doesn't exist
      if (!ticket) {
        throw { statusCode: 404, error: 'Not Found', message: 'Ticket not found' };
      }
    }

    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
};

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPublicCommentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const comments = await prisma.ticketComment.findMany({
      where: { ticketId, isInternal: false },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { name: true, role: true } } }
    });

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const addPublicCommentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      res.status(422).json({ error: 'Unprocessable Entity', message: 'Comment content cannot be empty' });
      return;
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
        isInternal: false
      },
      include: { author: { select: { name: true, role: true } } }
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const addInternalNoteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role === 'REQUESTER') {
      res.status(403).json({ error: 'Forbidden', message: 'Requesters cannot add internal notes' });
      return;
    }

    const { ticketId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      res.status(422).json({ error: 'Unprocessable Entity', message: 'Note content cannot be empty' });
      return;
    }

    const note = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
        isInternal: true
      },
      include: { author: { select: { name: true, role: true } } }
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const getInternalNotesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role === 'REQUESTER') {
      res.status(403).json({ error: 'Forbidden', message: 'Requesters cannot view internal notes' });
      return;
    }

    const { ticketId } = req.params;
    const notes = await prisma.ticketComment.findMany({
      where: { ticketId, isInternal: true },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { name: true, role: true } } }
    });

    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const toggleAppearsResolvedHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { appearsResolved } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
      return;
    }

    if (req.user!.role === 'REQUESTER' && ticket.requesterId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this ticket' });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { appearsResolved: Boolean(appearsResolved) }
    });

    res.status(200).json(updatedTicket);
  } catch (error) {
    next(error);
  }
};
