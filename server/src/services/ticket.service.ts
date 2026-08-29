import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const createTicket = async (data: {
  categoryId: string;
  relatedSystemId: string;
  requestedPriority: 'Low' | 'Medium' | 'High';
  summary: string;
  description: string;
  requesterId: string;
}) => {
  // Generate Ticket Number (เช่น TKT-0001)
  // สำหรับ Lab นี้ ใช้วิธีดึงตั๋วล่าสุดมาดูแล้วบวกเลขเพิ่มง่ายๆ ก่อน
  const latestTicket = await prisma.ticket.findFirst({
    orderBy: { ticketNumber: 'desc' },
  });
  
  let nextNumber = 1;
  if (latestTicket && latestTicket.ticketNumber.startsWith('TKT-')) {
    const latestNum = parseInt(latestTicket.ticketNumber.replace('TKT-', ''), 10);
    if (!isNaN(latestNum)) {
      nextNumber = latestNum + 1;
    }
  }
  
  const ticketNumber = `TKT-${String(nextNumber).padStart(4, '0')}`;
  
  // บันทึกลง Database
  const newTicket = await prisma.ticket.create({
    data: {
      ticketNumber,
      categoryId: data.categoryId,
      relatedSystemId: data.relatedSystemId,
      requestedPriority: data.requestedPriority,
      summary: data.summary,
      description: data.description,
      requesterId: data.requesterId,
      status: 'New', // ตั้งค่าเริ่มต้นเป็น New
    },
  });
  
  return newTicket;
};

export const getTickets = async (
  requesterId: string,
  params: {
    search?: string;
    categoryId?: string;
    priority?: string;
    status?: string;
    page: number;
    limit: number;
  }
) => {
  const { search, categoryId, priority, status, page, limit } = params;
  
  const where: Prisma.TicketWhereInput = {
    requesterId, // ดูเฉพาะตั๋วของตัวเองตาม Requester ID
  };
  
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
    where.requestedPriority = priority as any;
  }
  
  if (status) {
    where.status = status as any;
  }
  
  const skip = (page - 1) * limit;
  
  // Query ข้อมูลกับนับจำนวนรวมพร้อมกัน (เพื่อประสิทธิภาพ)
  const [items, totalItems] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
  
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    items,
    metadata: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages: totalPages === 0 ? 1 : totalPages
    }
  };
};

export const getTicketById = async (ticketId: string) => {
  return await prisma.ticket.findUnique({
    where: { id: ticketId }
  });
};

