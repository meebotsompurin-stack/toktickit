# Database Migration Rollback Procedure (Lab 4)

This document specifies the official rollback protocol for reversing Sprint 4 (Lab 4) database schema migrations in the event of an unrecoverable deployment failure or regression.

---

## 1. Overview of Lab 4 Migrations

Lab 4 introduced two sequential migrations:
1. `20261007075259_init_actions_taken`:
   - Creates the `ActionTaken` child table (`id`, `ticketId`, `actionDateTime`, `description`, `result`, `performedById`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `createdAt`, `updatedAt`).
   - Adds indexes on `ticketId` and `performedById`.
   - Establishes foreign keys referencing `Ticket(id)` (CASCADE) and `User(id)` (RESTRICT).
2. `20261010125813_add_ticket_version`:
   - Adds `version Int @default(1)` to `Ticket` and `ActionTaken` for optimistic concurrency locking.

---

## 2. Pre-Rollback Safety Checklist

1. **Stop Application Servers:** Ensure neither the Express backend nor background workers are writing to the database.
2. **Database Backup:** Create a full logical dump of PostgreSQL before executing any DDL:
   ```bash
   pg_dump -U postgres -d toktickit_db > backup_before_lab4_rollback.sql
   ```

---

## 3. Rollback Execution Steps

### Option A: Using the Provided SQL Script (Recommended)
Run the automated down-migration script located at `server/prisma/rollback/rollback-lab4.sql`:

```bash
# Execute down-migration using psql
psql -U postgres -d toktickit_db -f server/prisma/rollback/rollback-lab4.sql
```

The script executes:
```sql
-- 1. Revert Concurrency Versioning
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "version";
ALTER TABLE "ActionTaken" DROP COLUMN IF EXISTS "version";

-- 2. Revert Actions Taken Table and Constraints
DROP TABLE IF EXISTS "ActionTaken" CASCADE;

-- 3. Synchronize Prisma Migration History Table
DELETE FROM "_prisma_migrations"
WHERE "migration_name" IN (
    '20261010125813_add_ticket_version',
    '20261007075259_init_actions_taken'
);
```

### Option B: Using Prisma Migration Resolve
If Prisma CLI is available and you need to mark migrations as rolled back:
```bash
# Mark migrations as rolled back in Prisma
npx prisma migrate resolve --rolled-back 20261010125813_add_ticket_version
npx prisma migrate resolve --rolled-back 20261007075259_init_actions_taken
```

---

## 4. Post-Rollback Verification

1. Verify Prisma migration status:
   ```bash
   npx prisma migrate status
   ```
   *Expected output: Database schema is up to date with `20260914140021_merge_comment_and_add_appears_resolved` (Lab 3 state).*

2. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Run Lab 3 regression tests to verify full backward compatibility:
   ```bash
   npm run test
   ```
