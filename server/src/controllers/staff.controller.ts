import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStaffTicketsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { name: true, email: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
};

export const claimTicketHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
