import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

export const getRelatedSystems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const systems = await prisma.relatedSystem.findMany();
    return res.status(200).json(systems);
  } catch (error) {
    next(error);
  }
};
