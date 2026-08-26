import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { fileTypeFromFile } from 'file-type';
import * as AttachmentService from '../services/attachment.service';
import * as TicketService from '../services/ticket.service';

export const uploadHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requesterId = req.header('X-Requester-Id') as string;
    const { ticketId } = req.params;

    if (!req.file) {
      throw { statusCode: 400, error: 'Bad Request', message: 'No file uploaded' };
    }

    // 1. ตรวจสอบสิทธิ์ (Ownership)
    const ticket = await TicketService.getTicketById(ticketId);
    if (!ticket) {
      fs.unlinkSync(req.file.path);
      throw { statusCode: 404, error: 'Not Found', message: 'Ticket not found' };
    }

    if (ticket.requesterId !== requesterId) {
      fs.unlinkSync(req.file.path); // ลบไฟล์ทิ้งถ้าไม่มีสิทธิ์
      throw { statusCode: 403, error: 'Forbidden', message: 'You do not have permission to perform this action' };
    }

    // 2. ความปลอดภัย (BR-06): ตรวจสอบ MIME Type จากเนื้อหาไฟล์จริงๆ
    const meta = await fileTypeFromFile(req.file.path);
    if (!meta) {
      fs.unlinkSync(req.file.path);
      throw { statusCode: 400, error: 'Bad Request', message: 'Unknown file type or invalid signature' };
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(meta.mime)) {
      fs.unlinkSync(req.file.path);
      throw { statusCode: 400, error: 'Bad Request', message: 'File type not allowed. Only images and PDFs are permitted.' };
    }

    // 3. บันทึกลง DB (เก็บ Mimetype ที่ตรวจสอบได้จริง ไม่ใช่จาก req.file.mimetype ที่อาจโดนหลอก)
    const attachment = await AttachmentService.uploadAttachment({
      ticketId,
      filename: req.file.filename,
      mimetype: meta.mime,
      size: req.file.size
    });

    res.status(201).json(attachment);
  } catch (error) {
    next(error);
  }
};

export const deleteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requesterId = req.header('X-Requester-Id') as string;
    const { id } = req.params;

    const attachment = await AttachmentService.getAttachmentWithTicket(id);
    if (!attachment || attachment.isRemoved) {
      throw { statusCode: 404, error: 'Not Found', message: 'Attachment not found' };
    }

    // 1. ตรวจสอบสิทธิ์ (Ownership) เช็คจาก Ticket ที่ไฟล์นี้ผูกอยู่
    if (attachment.ticket.requesterId !== requesterId) {
      throw { statusCode: 403, error: 'Forbidden', message: 'You do not have permission to perform this action' };
    }

    // 2. ทำ Soft-remove (BR-07)
    await AttachmentService.softRemoveAttachment(id, requesterId);

    res.status(200).json({ message: 'Attachment successfully removed' });
  } catch (error) {
    next(error);
  }
};
