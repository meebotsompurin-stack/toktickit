import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const uploadDir = path.join(process.cwd(), 'uploads');
// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 5MB
});

export const uploadSingle = (req: Request, res: Response, next: NextFunction) => {
  const uploader = upload.single('attachment');
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next({
          statusCode: 400,
          error: 'Bad Request',
          message: 'File size exceeds the 5MB limit'
        });
      }
      return next({
        statusCode: 400,
        error: 'Bad Request',
        message: err.message
      });
    } else if (err) {
      return next(err);
    }
    next();
  });
};
