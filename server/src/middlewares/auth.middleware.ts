import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requesterId = req.header('X-Requester-Id');

  if (!requesterId || requesterId.trim() === '') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'X-Requester-Id header is required or invalid'
    });
    return;
  }

  // ส่งผ่านไปทำงานต่อ (สามารถเก็บ requesterId ไว้ใน req ได้ถ้าต้องการในอนาคต)
  next();
};
