import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '@prisma/client';
import { prisma } from '../lib/db';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header', statusCode: 401, details: [] });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role };

    // Fetch user from database
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found', statusCode: 401, details: [] });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Forbidden', message: 'User account is deactivated', statusCode: 403, details: [] });
      return;
    }

    if (
      user.requiresPasswordChange && 
      !req.originalUrl.includes('/change-password') && 
      !req.originalUrl.includes('/logout') && 
      !req.originalUrl.includes('/me')
    ) {
      res.status(403).json({ error: 'Forbidden', message: 'Password change required', statusCode: 403, details: [] });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token', statusCode: 401, details: [] });
  }
};

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated', statusCode: 401, details: [] });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions', statusCode: 403, details: [] });
      return;
    }

    next();
  };
};


