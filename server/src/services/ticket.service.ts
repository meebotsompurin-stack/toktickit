import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';

export const createTicket = async (data: {
  categoryId: string;
  relatedSystemId: string;
  requestedPriority: string;
  summary: string;
  description: string;
  requesterId: string;
}) => {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Query tickets to find current max numeric sequence
        const tickets = await tx.ticket.findMany({
          where: { ticketNumber: { startsWith: 'TKT-' } },
          select: { ticketNumber: true },
        });

        let maxNumber = 0;
        for (const t of tickets) {
          const match = t.ticketNumber.match(/^TKT-(\d+)$/);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }

        const nextNumber = maxNumber + 1;
        const ticketNumber = `TKT-${String(nextNumber).padStart(4, '0')}`;

        return await tx.ticket.create({
          data: {
            ticketNumber,
            categoryId: data.categoryId,
            relatedSystemId: data.relatedSystemId,
            requestedPriority: data.requestedPriority.toUpperCase() as any,
            summary: data.summary,
            description: data.description,
            requesterId: data.requesterId,
            status: 'NEW',
          },
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err: any) {
      if (
        attempt < maxRetries - 1 &&
        (err.code === 'P2002' || err.code === 'P2034' || err.message?.includes('could not serialize') || err.message?.includes('deadlock'))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
};

export const getTickets = async (
  requesterId: string | undefined,
  params: {
    search?: string;
    categoryId?: string;
    priority?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
  }
) => {
  const { search, categoryId, priority, status, sortBy = 'createdAt', sortOrder = 'desc', page, limit } = params;
  
  const where: Prisma.TicketWhereInput = {};
  if (requesterId) {
    where.requesterId = requesterId;
  }
  
  if (search) {
    where.OR = [
      { ticketNumber: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  if (priority) {
    where.requestedPriority = priority.toUpperCase() as any;
  }
  
  if (status) {
    where.status = status.toUpperCase() as any;
  }
  
  const skip = (page - 1) * limit;

  // จัดเรียง
  const orderBy: Prisma.TicketOrderByWithRelationInput = {
    [sortBy]: sortOrder
  };
  
  // Query ข้อมูลกับนับจำนวนรวมพร้อมกัน (เพื่อประสิทธิภาพ)
  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: true,
        relatedSystem: true,
        attachments: {
          where: { isRemoved: false } // กรองไฟล์ที่ลบออกแล้ว
        }
      }
    }),
    prisma.ticket.count({ where })
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: totalPages === 0 ? 1 : totalPages
    }
  };
};

export const getTicketById = async (ticketId: string) => {
  return await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      relatedSystem: true,
      attachments: {
        where: { isRemoved: false }
      }
    }
  });
};

