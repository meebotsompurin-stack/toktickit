import { Request, Response, NextFunction } from 'express';

// Global error handler (ต้องมีพารามิเตอร์ 4 ตัวเพื่อให้ Express รู้ว่าเป็น error middleware)
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const errorType = err.error || 'Internal Server Error';
  const message = err.message || 'Something went wrong';

  // ถ้าเป็น Array of details (เช่นจาก Validation) ให้แนบไปด้วย
  const details = err.details || undefined;

  res.status(statusCode).json({
    error: errorType,
    message,
    ...(details && { details })
  });
};
