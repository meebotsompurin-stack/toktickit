import { PrismaClient, Role, TicketStatus, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────
// Helper: hash password with bcrypt (salt=12)
// ─────────────────────────────────────────────
async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Start seeding data (Lab 3 — Idempotent)...\n');

  // ═══════════════════════════════════════════
  // 1. Reference Data: Categories
  // ═══════════════════════════════════════════
  const categoryNames = ['Account and Access', 'Hardware', 'Software', 'Network'];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
  }
  console.log('✅ Categories seeded.');

  // ═══════════════════════════════════════════
  // 2. Reference Data: Related Systems
  // ═══════════════════════════════════════════
  const relatedSystemNames = ['ERP', 'HRIS', 'CRM', 'Email', 'Intranet'];
  const relatedSystems: Record<string, string> = {};
  for (const name of relatedSystemNames) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    relatedSystems[name] = sys.id;
  }
  console.log('✅ Related Systems seeded.');

  // ═══════════════════════════════════════════
  // 3. Legacy Requesters (Lab 1-2 backward compat)
  // ═══════════════════════════════════════════
  const legacyRequesterNames = ['John Doe', 'Jane Smith', 'Bob Admin'];
  for (const name of legacyRequesterNames) {
    const existing = await prisma.requester.findFirst({ where: { name } });
    if (!existing) {
      await prisma.requester.create({ data: { name } });
    }
  }
  console.log('✅ Legacy Requesters seeded (backward compat).');

  // ═══════════════════════════════════════════
  // 4. Users (Lab 3 — Auth & RBAC)
  //    All passwords hashed with bcrypt, salt=12
  //    Default password: "password123"
  // ═══════════════════════════════════════════
  const defaultHash = await hashPassword('password123');
  const tempHash = await hashPassword('TempPass123!');

  // --- 4a. Active Requesters (4) ---
  const requester1 = await prisma.user.upsert({
    where: { email: 'somchai.req@toktickit.dev' },
    update: {},
    create: {
      name: 'Somchai Jai-dee',
      email: 'somchai.req@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.REQUESTER,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  const requester2 = await prisma.user.upsert({
    where: { email: 'siriporn.req@toktickit.dev' },
    update: {},
    create: {
      name: 'Siriporn Bua-kaew',
      email: 'siriporn.req@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.REQUESTER,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  const requester3 = await prisma.user.upsert({
    where: { email: 'wichai.req@toktickit.dev' },
    update: {},
    create: {
      name: 'Wichai Suk-sawat',
      email: 'wichai.req@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.REQUESTER,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  const requester4 = await prisma.user.upsert({
    where: { email: 'nanthida.req@toktickit.dev' },
    update: {},
    create: {
      name: 'Nanthida Wong-urai',
      email: 'nanthida.req@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.REQUESTER,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  // --- 4b. Inactive Requester (1) ---
  const requesterInactive = await prisma.user.upsert({
    where: { email: 'resigned.user@toktickit.dev' },
    update: {},
    create: {
      name: 'Prawit Laa-saed (Resigned)',
      email: 'resigned.user@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.REQUESTER,
      isActive: false,
      requiresPasswordChange: false,
    },
  });

  // --- 4c. Active IT Staff (3) ---
  const staff1 = await prisma.user.upsert({
    where: { email: 'anon.staff@toktickit.dev' },
    update: {},
    create: {
      name: 'Anon Tham-rong',
      email: 'anon.staff@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.IT_STAFF,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'piyanuch.staff@toktickit.dev' },
    update: {},
    create: {
      name: 'Piyanuch Kham-pee',
      email: 'piyanuch.staff@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.IT_STAFF,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  const staff3 = await prisma.user.upsert({
    where: { email: 'chaiyaporn.staff@toktickit.dev' },
    update: {},
    create: {
      name: 'Chaiyaporn Dee-chai',
      email: 'chaiyaporn.staff@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.IT_STAFF,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  // --- 4d. Inactive IT Staff (1) ---
  const staffInactive = await prisma.user.upsert({
    where: { email: 'transferred.staff@toktickit.dev' },
    update: {},
    create: {
      name: 'Surasak Yai-num (Transferred)',
      email: 'transferred.staff@toktickit.dev',
      passwordHash: defaultHash,
      role: Role.IT_STAFF,
      isActive: false,
      requiresPasswordChange: false,
    },
  });

  // --- 4e. Active Administrator (1) ---
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@toktick.dev' },
    update: {
      passwordHash: defaultHash,
      isActive: true,
      requiresPasswordChange: false,
    },
    create: {
      name: 'Supaporn Admin',
      email: 'admin@toktick.dev',
      passwordHash: defaultHash,
      role: Role.ADMINISTRATOR,
      isActive: true,
      requiresPasswordChange: false,
    },
  });

  // --- 4f. New user (requires password change) ---
  const newUser = await prisma.user.upsert({
    where: { email: 'newbie@toktickit.dev' },
    update: {},
    create: {
      name: 'Newbie Intern',
      email: 'newbie@toktickit.dev',
      passwordHash: tempHash,
      role: Role.REQUESTER,
      isActive: true,
      requiresPasswordChange: true,
    },
  });

  console.log('✅ Users seeded (4 Requesters, 1 Inactive Requester, 3 IT Staff, 1 Inactive Staff, 1 Admin, 1 New User).');

  // ═══════════════════════════════════════════
  // 5. Tickets (Lab 3 — mixed statuses, priorities, owners)
  // ═══════════════════════════════════════════
  const ticket1 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-0101' },
    update: {},
    create: {
      ticketNumber: 'TKT-0101',
      categoryId: categories['Network'],
      relatedSystemId: relatedSystems['Intranet'],
      requestedPriority: Priority.HIGH,
      itPriority: Priority.CRITICAL,
      status: TicketStatus.IN_PROGRESS,
      summary: 'VPN disconnects every 30 minutes',
      description: 'VPN connection drops frequently during work hours. Already tried reinstalling the client.',
      requesterId: requester1.id,
      ownerId: staff1.id,
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-0102' },
    update: {},
    create: {
      ticketNumber: 'TKT-0102',
      categoryId: categories['Software'],
      relatedSystemId: relatedSystems['ERP'],
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.MEDIUM,
      status: TicketStatus.OPEN,
      summary: 'ERP report export hangs on large datasets',
      description: 'When exporting reports with more than 10,000 rows, the ERP system freezes and eventually times out.',
      requesterId: requester2.id,
      ownerId: staff2.id,
    },
  });

  const ticket3 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-0103' },
    update: {},
    create: {
      ticketNumber: 'TKT-0103',
      categoryId: categories['Hardware'],
      relatedSystemId: relatedSystems['HRIS'],
      requestedPriority: Priority.LOW,
      itPriority: null,
      status: TicketStatus.NEW,
      summary: 'Request new keyboard (ergonomic)',
      description: 'My keyboard is worn out and I would like to request an ergonomic replacement.',
      requesterId: requester3.id,
      ownerId: null,
    },
  });

  const ticket4 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-0104' },
    update: {},
    create: {
      ticketNumber: 'TKT-0104',
      categoryId: categories['Account and Access'],
      relatedSystemId: relatedSystems['Email'],
      requestedPriority: Priority.HIGH,
      itPriority: Priority.HIGH,
      status: TicketStatus.RESOLVED,
      summary: 'Cannot access shared mailbox after department transfer',
      description: 'After transferring to the Marketing department, I lost access to the shared support@company.com mailbox.',
      requesterId: requester1.id,
      ownerId: staff1.id,
    },
  });

  const ticket5 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-0105' },
    update: {},
    create: {
      ticketNumber: 'TKT-0105',
      categoryId: categories['Software'],
      relatedSystemId: relatedSystems['CRM'],
      requestedPriority: Priority.MEDIUM,
      itPriority: null,
      status: TicketStatus.NEW,
      summary: 'CRM dashboard shows stale data',
      description: 'The sales dashboard in CRM does not update automatically. Data appears to be 24 hours behind.',
      requesterId: requester4.id,
      ownerId: null,
    },
  });

  const ticket6 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-0106' },
    update: {},
    create: {
      ticketNumber: 'TKT-0106',
      categoryId: categories['Network'],
      relatedSystemId: relatedSystems['Intranet'],
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.LOW,
      status: TicketStatus.CLOSED,
      summary: 'Wi-Fi signal weak in Building B, 3rd floor',
      description: 'Multiple employees on the 3rd floor of Building B report intermittent Wi-Fi drops.',
      requesterId: requester2.id,
      ownerId: staff3.id,
    },
  });

  console.log('✅ Tickets seeded (6 tickets with mixed statuses, priorities, and owners).');

  // ═══════════════════════════════════════════
  // 6. Public Comments
  // ═══════════════════════════════════════════
  const comment1Id = 'cmt_pub_seed_001';
  await prisma.publicComment.upsert({
    where: { id: comment1Id },
    update: {},
    create: {
      id: comment1Id,
      ticketId: ticket1.id,
      authorId: requester1.id,
      content: 'I have tried switching between Wi-Fi and LAN cable, but the issue persists on both.',
    },
  });

  const comment2Id = 'cmt_pub_seed_002';
  await prisma.publicComment.upsert({
    where: { id: comment2Id },
    update: {},
    create: {
      id: comment2Id,
      ticketId: ticket1.id,
      authorId: staff1.id,
      content: 'Thank you for the additional info. I am checking the VPN gateway logs now. Will update you shortly.',
    },
  });

  const comment3Id = 'cmt_pub_seed_003';
  await prisma.publicComment.upsert({
    where: { id: comment3Id },
    update: {},
    create: {
      id: comment3Id,
      ticketId: ticket2.id,
      authorId: requester2.id,
      content: 'This happens specifically when I try to export the "Monthly Revenue" report for Q3.',
    },
  });

  const comment4Id = 'cmt_pub_seed_004';
  await prisma.publicComment.upsert({
    where: { id: comment4Id },
    update: {},
    create: {
      id: comment4Id,
      ticketId: ticket4.id,
      authorId: staff1.id,
      content: 'Access has been restored. Please try logging in again and confirm it works.',
    },
  });

  const comment5Id = 'cmt_pub_seed_005';
  await prisma.publicComment.upsert({
    where: { id: comment5Id },
    update: {},
    create: {
      id: comment5Id,
      ticketId: ticket4.id,
      authorId: requester1.id,
      content: 'Confirmed — I can access the shared mailbox now. Thank you!',
    },
  });

  console.log('✅ Public Comments seeded (5 comments across tickets).');

  // ═══════════════════════════════════════════
  // 7. Internal Notes (IT Staff / Admin only)
  // ═══════════════════════════════════════════
  const note1Id = 'cmt_int_seed_001';
  await prisma.internalNote.upsert({
    where: { id: note1Id },
    update: {},
    create: {
      id: note1Id,
      ticketId: ticket1.id,
      authorId: staff1.id,
      content: 'VPN gateway shows session timeout set to 30min by default. Escalating to network team to increase to 8h.',
    },
  });

  const note2Id = 'cmt_int_seed_002';
  await prisma.internalNote.upsert({
    where: { id: note2Id },
    update: {},
    create: {
      id: note2Id,
      ticketId: ticket2.id,
      authorId: staff2.id,
      content: 'ERP vendor confirmed this is a known bug in v4.2. Patch ETA: next Tuesday. Monitor and follow up.',
    },
  });

  const note3Id = 'cmt_int_seed_003';
  await prisma.internalNote.upsert({
    where: { id: note3Id },
    update: {},
    create: {
      id: note3Id,
      ticketId: ticket6.id,
      authorId: staff3.id,
      content: 'Installed 2 additional APs on 3rd floor. Signal coverage verified with heat map. Closing ticket.',
    },
  });

  console.log('✅ Internal Notes seeded (3 notes across tickets).');

  // ═══════════════════════════════════════════
  console.log('\n🎉 Lab 3 seeding completed successfully!');
  console.log('───────────────────────────────────────');
  console.log('   Users:           11 (4 Req + 1 Inactive Req + 3 Staff + 1 Inactive Staff + 1 Admin + 1 Newbie)');
  console.log('   Tickets:          6 (NEW, OPEN, IN_PROGRESS, RESOLVED, CLOSED)');
  console.log('   Public Comments:  5');
  console.log('   Internal Notes:   3');
  console.log('───────────────────────────────────────');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });