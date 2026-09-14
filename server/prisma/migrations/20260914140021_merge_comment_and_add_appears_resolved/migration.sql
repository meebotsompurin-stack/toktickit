/*
  Warnings:

  - You are about to drop the `InternalNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PublicComment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InternalNote" DROP CONSTRAINT "InternalNote_authorId_fkey";

-- DropForeignKey
ALTER TABLE "InternalNote" DROP CONSTRAINT "InternalNote_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "PublicComment" DROP CONSTRAINT "PublicComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "PublicComment" DROP CONSTRAINT "PublicComment_ticketId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "appearsResolved" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "InternalNote";

-- DropTable
DROP TABLE "PublicComment";

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
