-- ============================================================================
-- TokTickIT Lab 4 Database Rollback Script
-- Reverts Lab 4 schema additions back to Lab 3 state
-- ============================================================================

-- 1. Revert Concurrency Versioning (Migration 20261010125813_add_ticket_version)
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "version";
ALTER TABLE "ActionTaken" DROP COLUMN IF EXISTS "version";

-- 2. Revert Actions Taken Table and Constraints (Migration 20261007075259_init_actions_taken)
DROP TABLE IF EXISTS "ActionTaken" CASCADE;

-- 3. Synchronize Prisma Migration History Table
DELETE FROM "_prisma_migrations"
WHERE "migration_name" IN (
    '20261010125813_add_ticket_version',
    '20261007075259_init_actions_taken'
);
