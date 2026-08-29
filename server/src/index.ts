import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

import ticketRoutes from './routes/ticket.routes';
import attachmentRoutes from './routes/attachment.routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// Public / Unprotected Routes (ถ้ามีในอนาคต)
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

// ----------------------------------------------------
// API Routes
// ----------------------------------------------------
app.use('/api/tickets', ticketRoutes);
app.use('/api/attachments', attachmentRoutes);

// * สามารถเพิ่ม Route อื่นๆ ในอนาคตเช่น /api/categories ได้ตรงนี้

// ----------------------------------------------------
// Global Error Handler (ต้องอยู่ล่างสุดเสมอ)
// ----------------------------------------------------
app.use(errorMiddleware);

// เริ่มทำงาน Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
}

export default app;
