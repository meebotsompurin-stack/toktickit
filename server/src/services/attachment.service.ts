import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadAttachment = async (data: {
  ticketId: string;
  filename: string;
  mimetype: string;
  size: number;
}) => {
  return await prisma.attachment.create({
    data: {
      ticketId: data.ticketId,
      filename: data.filename,
      mimetype: data.mimetype,
      size: data.size,
    }
  });
};

export const softRemoveAttachment = async (attachmentId: string, requesterId: string) => {
  return await prisma.attachment.update({
    where: { id: attachmentId },
    data: {
      isRemoved: true,
      deletedBy: requesterId,
      deletedAt: new Date()
    }
  });
};

// ดึงข้อมูล Attachment เพื่อมาเช็ค Ownership
export const getAttachmentWithTicket = async (attachmentId: string) => {
  return await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { ticket: true }
  });
};
