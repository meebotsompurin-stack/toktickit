import { Request, Response, NextFunction } from 'express';
import * as TicketService from '../services/ticket.service';

export const createTicketHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requesterId = req.header('X-Requester-Id') as string;
    const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;

    const details: { field: string; message: string }[] = [];

    // Manual Validation
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

    // หากมี Error จากการ Validate
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
    next(error); // โยนให้ Global Error Handler
  }
};

export const getTicketsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requesterId = req.header('X-Requester-Id') as string;
    
    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const priority = req.query.priority as string | undefined;
    const status = req.query.status as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    
    // Pagination defaults: page=1, limit=10 (max 50)
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const result = await TicketService.getTickets(requesterId, {
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
    const requesterId = req.header('X-Requester-Id') as string;
    const { ticketId } = req.params;

    const ticket = await TicketService.getTicketById(ticketId);

    if (!ticket) {
      throw { statusCode: 404, error: 'Not Found', message: 'Ticket not found' };
    }

    // Check ownership if required (Optional based on business rules, but good practice)
    if (ticket.requesterId !== requesterId) {
      throw { statusCode: 403, error: 'Forbidden', message: 'You do not have permission to view this ticket' };
    }

    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
};
