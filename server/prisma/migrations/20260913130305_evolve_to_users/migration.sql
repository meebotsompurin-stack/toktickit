-- =============================================================================
-- Lab 3 Migration: evolve_to_users
-- Zero Data Loss Migration (AC-DB-04)
--
-- Execution Order:
--   1. Create new Enums (Role, TicketStatus, Priority)
--   2. Evolve existing Category table (int id → text id, add updatedAt)
--   3. Create new tables (User, Requester, RelatedSystem, Ticket, Attachment,
--      PublicComment, InternalNote)
--   4. Create indexes and foreign keys
--
-- SAFETY: This migration does NOT drop the Category table.
--         It ALTERs the existing Category table in-place preserving all rows.
--         All other tables are new creations (they don't exist in the DB yet).
-- =============================================================================

-- ─────────────────────────────────────────────
-- PHASE 1: Create New Enums
-- ─────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ─────────────────────────────────────────────
-- PHASE 2: Evolve existing Category table
--   Current state: id SERIAL (int), name TEXT (unique), createdAt TIMESTAMP
--   Target state:  id TEXT (uuid), name TEXT (unique), createdAt, updatedAt
--
--   Strategy:
--     a) Add updatedAt column with a safe default
--     b) Add a temporary text column for the new UUID
--     c) Populate it with gen_random_uuid()
--     d) Drop the old integer PK, swap in the text column
--     e) Clean up
-- ─────────────────────────────────────────────

-- 2a. Add updatedAt (default to createdAt value for existing rows, then NOW())
ALTER TABLE "Category"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Back-fill updatedAt with createdAt for existing rows so they make sense
UPDATE "Category" SET "updatedAt" = "createdAt";

-- 2b. Add temp text column for UUID-based id
ALTER TABLE "Category" ADD COLUMN "id_new" TEXT;

-- 2c. Populate every existing row with a fresh UUID
UPDATE "Category" SET "id_new" = gen_random_uuid()::TEXT;

-- 2d. Make the new column NOT NULL (all rows now have values)
ALTER TABLE "Category" ALTER COLUMN "id_new" SET NOT NULL;

-- 2e. Drop old primary key constraint, old id column, rename new column
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey";
ALTER TABLE "Category" DROP COLUMN "id";
ALTER TABLE "Category" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "Category" ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

-- Drop the old auto-increment sequence (no longer needed)
DROP SEQUENCE IF EXISTS "Category_id_seq";

-- ─────────────────────────────────────────────
-- PHASE 3: Create new User table
-- ─────────────────────────────────────────────

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresPasswordChange" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ─────────────────────────────────────────────
-- PHASE 4: Create legacy Requester table
--   (Kept for backward-compat with Lab 1-2 seed data)
-- ─────────────────────────────────────────────

CREATE TABLE "Requester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Requester_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- PHASE 5: Create RelatedSystem table
-- ─────────────────────────────────────────────

CREATE TABLE "RelatedSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatedSystem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RelatedSystem_name_key" ON "RelatedSystem"("name");

-- ─────────────────────────────────────────────
-- PHASE 6: Create Ticket table
--   (New table — no existing rows to migrate)
--   Includes Lab 3 fields: ownerId, itPriority,
--   legacyRequesterId, and new Enum-based status/priority
-- ─────────────────────────────────────────────

CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "relatedSystemId" TEXT NOT NULL,
    "requestedPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "itPriority" "Priority",
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "summary" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "requesterId" TEXT,
    "ownerId" TEXT,
    "legacyRequesterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");
CREATE INDEX "Ticket_ownerId_idx" ON "Ticket"("ownerId");
CREATE INDEX "Ticket_legacyRequesterId_idx" ON "Ticket"("legacyRequesterId");

-- ─────────────────────────────────────────────
-- PHASE 7: Create Attachment table
-- ─────────────────────────────────────────────

CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- PHASE 8: Create PublicComment table
-- ─────────────────────────────────────────────

CREATE TABLE "PublicComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicComment_ticketId_idx" ON "PublicComment"("ticketId");

-- ─────────────────────────────────────────────
-- PHASE 9: Create InternalNote table
-- ─────────────────────────────────────────────

CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalNote_ticketId_idx" ON "InternalNote"("ticketId");

-- ─────────────────────────────────────────────
-- PHASE 10: Add all Foreign Keys
-- ─────────────────────────────────────────────

-- Ticket → Category
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ticket → RelatedSystem
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_relatedSystemId_fkey"
  FOREIGN KEY ("relatedSystemId") REFERENCES "RelatedSystem"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ticket → User (Requester, Lab 3 auth-based)
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Ticket → User (Owner / IT Staff assignment)
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Ticket → Requester (Legacy backward-compat)
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_legacyRequesterId_fkey"
  FOREIGN KEY ("legacyRequesterId") REFERENCES "Requester"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Attachment → Ticket
ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- PublicComment → Ticket
ALTER TABLE "PublicComment"
  ADD CONSTRAINT "PublicComment_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- PublicComment → User (Author)
ALTER TABLE "PublicComment"
  ADD CONSTRAINT "PublicComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- InternalNote → Ticket
ALTER TABLE "InternalNote"
  ADD CONSTRAINT "InternalNote_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- InternalNote → User (Author)
ALTER TABLE "InternalNote"
  ADD CONSTRAINT "InternalNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
