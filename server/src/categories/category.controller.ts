import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany();
    return res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};
