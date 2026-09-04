import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActiveRequesters = async (req: Request, res: Response) => {
  try {
    const requesters = await prisma.requester.findMany({
      where: {
        isActive: true,
      },
    });

    return res.status(200).json(requesters);
  } catch (error) {
    console.error('Error fetching requesters:', error);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch active requesters',
    });
  }
};
