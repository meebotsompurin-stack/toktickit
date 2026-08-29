import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRelatedSystems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const systems = await prisma.relatedSystem.findMany();
    return res.status(200).json(systems);
  } catch (error) {
    next(error);
  }
};
