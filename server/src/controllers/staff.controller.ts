import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
