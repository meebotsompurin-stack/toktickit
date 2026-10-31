# Lab 4 Sprint Engineering Specification

> **Lab 4 Final Implementation Status:**
> - Sprint 4 Contract Established (Spec DD phase)
> - Ready for Red-Test Scaffolding and Implementation

---

## 1. Sprint Goal
Deliver an enterprise-grade Ticket Resolution and Operational Intelligence increment for TokTickIT. This includes an append-only Actions Taken audit history, strict role-governed ticket workflow transitions with optimistic concurrency protection, authoritative role dashboards (Requester and IT Staff) with drill-down metrics, and full regression hardening preserving all Lab 1–3 capabilities under the Zen Green design system.

---

## 2. Stakeholder Request Interpretation
The IT Service department requires operational transparency into how tickets are resolved, accountability for technical actions performed by different team members, prevention of conflicting concurrent ticket updates, and proactive role-specific dashboards. The solution must integrate seamlessly into the existing TokTickIT architecture without discarding legacy data or compromising role-based security.

---

## 3. Scope

### 3.1 Included
- **Actions Taken Module:** Full schema evolution, REST API, and frontend integration for recording technical interventions on tickets.
- **Workflow & Status Transition Engine:** Strict 8-state transition matrix enforced by the backend and reflected dynamically in the UI.
- **Concurrency Control:** Optimistic locking via integer versioning to detect stale updates on tickets and actions, returning `409 Conflict`.
- **Role Dashboards:** Authoritative server-calculated metrics for Requester and IT Staff with interactive drill-down navigation.
- **Zen Green UI Polish & Accessibility:** Consistent badge, card, form, and table styling with responsive support (Desktop, Tablet, Mobile) and WCAG non-color cues.
- **Technical Debt & Regression Hardening:** Resolution of Labs 1–3 debts (TD-01 to TD-15) and comprehensive test suite validation.

### 3.2 Excluded
- Time-sheet billing, payroll, or labor-cost calculations.
- Multi-level hierarchical approval workflows or digital cryptographic signatures.
- Advanced third-party business intelligence (BI) integration, external report builders, or data warehousing exports.
- Multi-tenant organizational isolation or cloud clustering operations.
- Unapproved feature scope beyond Sprint 4 engineering contract.

---

## 4. Functional Requirements (FR)

### 4.1 Actions Taken
- **FR-01 (Create Action Taken):** Authorized IT Staff and Administrators can record an Action Taken on an accessible ticket with timestamp, description, result, follow-up flags, and attachment notes.
- **FR-02 (Update Action Taken):** Authorized IT Staff and Administrators can edit the description, result, follow-up note, and attachment notes of an existing Action Taken.
- **FR-03 (View Actions Taken):** Users can view all Actions Taken associated with a ticket they have permission to access. Requesters have read-only access strictly to tickets they own.
- **FR-04 (Performer Identity):** The system automatically derives `performedById` from the authenticated session (JWT) without trusting client-submitted identities.
- **FR-05 (Action Taken Validation):** The system enforces mandatory fields and conditional requirements (`followUpNote` required when `followUpRequired=true`), returning `422 Unprocessable Entity` on failure.

### 4.2 Ticket Workflow & Concurrency
- **FR-06 (Permitted Transitions):** The backend validates and enforces allowed ticket status transitions across the 8 defined states. Invalid transitions are rejected with `422 Unprocessable Entity`.
- **FR-07 (Transition Authorization):** Status changes are restricted to authorized roles according to the transition matrix. Unauthorized attempts return `403 Forbidden`.
- **FR-08 (Advisory Requester Feedback):** The system records `appearsResolved` submitted by Requesters as advisory metadata without automatically mutating the ticket status to `RESOLVED`.
- **FR-09 (Optimistic Concurrency Detection):** Mutating endpoints check the entity version. If the submitted version does not match the database state, the operation is aborted with `409 Conflict`.
- **FR-10 (Double-Click Prevention):** Client-side action buttons disable immediately upon submission to prevent duplicate concurrent API requests.

### 4.3 Role Dashboards
- **FR-11 (Requester Dashboard Metrics):** The backend computes and returns summary metrics strictly scoped to the authenticated Requester: Total Open Tickets, Tickets Waiting for Requester, Recently Updated Tickets (7 days), and Recently Resolved Tickets.
- **FR-12 (IT Staff Dashboard Metrics):** The backend computes and returns queue metrics for IT Staff/Admin: Unassigned Tickets, Tickets Owned by Current User, Breakdown by Status, Breakdown by IT Priority, and Recently Updated Tickets (7 days).
- **FR-13 (Concise Aggregation):** Dashboard endpoints return lightweight summary JSON objects rather than complete ticket collections.
- **FR-14 (Drill-Down Navigation):** Dashboard cards provide actionable links to navigate directly to filtered ticket views.

### 4.4 Regression & Hardening
- **FR-15 (Legacy Preservation):** All routes, ticket attachments, public comments, internal notes, and administrative user controls from Labs 1–3 remain functional.
- **FR-16 (Singleton Database Client):** All backend controllers and services interact with PostgreSQL through a single exported `PrismaClient` instance (`lib/db.ts`).

---

## 5. Business Rules (BR)

- **BR-01 (Single Ticket Association):** An Action Taken belongs to exactly one Ticket and cannot be detached or transferred to another ticket.
- **BR-02 (Performer Independence):** While the Ticket Owner coordinates the ticket, an Action Taken may be created or updated by any authorized IT Staff member, even if they are not the designated Ticket Owner.
- **BR-03 (Performer Immutability):** The `performedById` field is automatically set from the authenticated JWT user and cannot be altered during subsequent updates.
- **BR-04 (Follow-up Note Requirement):** When `followUpRequired` is `true`, `followUpNote` must be non-empty and contain meaningful text.
- **BR-05 (Requester Read-Only Access):** Requesters have read-only access to Actions Taken on their owned tickets. Any create, edit, or delete attempt by a Requester must be rejected with `403 Forbidden`.
- **BR-06 (Strict Transition Adherence):** Ticket status progression must follow the Status Transition Matrix. Jumping states (e.g., `NEW` $\rightarrow$ `CLOSED`) or modifying a terminal state is strictly prohibited.
- **BR-07 (Advisory Resolution Decoupling):** A Requester's indication that a problem `appearsResolved` is strictly advisory. Only authorized IT Staff or Administrators can officially mark a ticket as `RESOLVED`.
- **BR-08 (Optimistic Locking & Versioning):** Every Ticket entity maintains an integer `version`. Mutations must provide the current `version`. If the database `version` differs, the request is rejected with `409 Conflict`.
- **BR-09 (Authoritative Server Aggregations):** Dashboard metrics must be computed via database aggregate queries. Raw collections must never be transferred to the client for client-side summation.
- **BR-10 (Requester Data Isolation):** Requester metrics are strictly filtered by `requesterId = req.user.id`. Access to other requesters' metrics is forbidden.
- **BR-11 (Rolling 7-Day Window):** Metrics designated as "Recently Updated" or "Recently Resolved" evaluate a strict 7-day rolling window (`updatedAt >= NOW() - 7 days`).
- **BR-12 (Empty State Backfill Compatibility):** Legacy tickets created in Labs 1–3 with zero Actions Taken remain valid and display standard empty states without throwing errors.

---

## 6. Authorization Matrix (RBAC)

| Resource / Action | Requester | IT Staff | Administrator | Details / Conditions |
| :--- | :---: | :---: | :---: | :--- |
| **View Actions Taken** | ✔ (Owned) | ✔ | ✔ | Requester restricted to tickets where `requesterId == req.user.id`. |
| **Create Action Taken** | ❌ | ✔ | ✔ | Requires valid payload; `performedById` bound to session. |
| **Update Action Taken** | ❌ | ✔ | ✔ | Allowed for accessible tickets; checks version concurrency. |
| **View Requester Dashboard** | ✔ | ❌ | ❌ | Scoped strictly to own tickets (`/api/tickets/dashboard/requester`). |
| **View IT Staff Dashboard** | ❌ | ✔ | ✔ | Access to operational queue metrics (`/api/staff/dashboard`). |
| **Change Status: Normal Flow** | ❌ | ✔ | ✔ | Per Status Transition Matrix. |
| **Change Status: Close/Reopen** | ✔ (Conditional) | ✔ | ✔ | Requester can confirm `RESOLVED` $\rightarrow$ `CLOSED` or `REOPENED` on owned tickets. |
| **Set appearsResolved Flag** | ✔ (Owned) | ❌ | ❌ | Advisory only; available on owned tickets. |

---

## 7. Database Changes (Schema Evolution)

### 7.1 New Model: `ActionTaken`
```prisma
model ActionTaken {
  id               String   @id @default(cuid())
  ticketId         String
  ticket           Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime   DateTime @default(now())
  description      String   @db.VarChar(1000)
  result           String   @db.VarChar(1000)
  performedById    String
  performedBy      User     @relation(fields: [performedById], references: [id])
  followUpRequired Boolean  @default(false)
  followUpNote     String?  @db.VarChar(1000)
  attachmentNotes  String?  @db.VarChar(500)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
}
```

### 7.2 Updated Model: `Ticket`
- Add `version Int @default(1)` for optimistic concurrency tracking.
- Add relation `actionsTaken ActionTaken[]`.

### 7.3 Architectural Decisions Justification
1. **Separation of Actions Taken from Comments:** Actions Taken represent formal, operational technical actions with structured fields (`result`, `followUpRequired`, `attachmentNotes`), distinct from conversational `TicketComment` entries. Storing them in a dedicated model preserves auditing integrity and query efficiency.
2. **Optimistic Locking via Integer Versioning:** Implementing `version Int @default(1)` on the `Ticket` model prevents lost updates during concurrent edits by multiple IT Staff members without introducing blocking table locks.

---

## 8. Status Transition Matrix

TokTickIT enforces 8 distinct statuses:
1. `NEW`
2. `OPEN`
3. `IN_PROGRESS`
4. `WAITING_FOR_REQUESTER`
5. `RESOLVED`
6. `CLOSED`
7. `REOPENED`
8. `CANCELLED`

### 8.1 Permitted Transitions Table

| Current Status | Permitted Next Status | Authorized Roles | Business Condition / Purpose |
| :--- | :--- | :--- | :--- |
| **`NEW`** | `OPEN` | IT Staff, Administrator | Ticket acknowledged and triaged. |
| **`NEW`** | `CANCELLED` | Requester, IT Staff, Admin | Requester cancels unhandled ticket, or staff rejects invalid ticket. |
| **`OPEN`** | `IN_PROGRESS` | IT Staff, Administrator | Staff begins active investigation/work. |
| **`OPEN`** | `WAITING_FOR_REQUESTER` | IT Staff, Administrator | Staff requests additional info from Requester. |
| **`OPEN`** | `CANCELLED` | IT Staff, Administrator | Ticket deemed duplicate or invalid during triage. |
| **`IN_PROGRESS`** | `WAITING_FOR_REQUESTER` | IT Staff, Administrator | Work paused pending user clarification or confirmation. |
| **`IN_PROGRESS`** | `RESOLVED` | IT Staff, Administrator | Technical solution applied and verified by staff. |
| **`IN_PROGRESS`** | `OPEN` | IT Staff, Administrator | Work unassigned or deprioritized back to queue. |
| **`IN_PROGRESS`** | `CANCELLED` | IT Staff, Administrator | Work aborted by staff/admin. |
| **`WAITING_FOR_REQUESTER`** | `IN_PROGRESS` | Requester, IT Staff, Admin | Requester provides information or staff resumes work. |
| **`WAITING_FOR_REQUESTER`** | `RESOLVED` | IT Staff, Administrator | Staff determines issue resolved without further input. |
| **`WAITING_FOR_REQUESTER`** | `CANCELLED` | IT Staff, Administrator | Abandoned or unresponsive requester. |
| **`RESOLVED`** | `CLOSED` | Requester, IT Staff, Admin | Resolution confirmed by user or staff auto-closure. |
| **`RESOLVED`** | `REOPENED` | Requester, IT Staff, Admin | Problem recurs or resolution was unsuccessful. |
| **`CLOSED`** | `REOPENED` | IT Staff, Administrator | Reopened by administrative discretion only. |
| **`REOPENED`** | `IN_PROGRESS` | IT Staff, Administrator | Work resumed on reopened ticket. |
| **`REOPENED`** | `WAITING_FOR_REQUESTER` | IT Staff, Administrator | Staff requests new details on recurring problem. |
| **`REOPENED`** | `CANCELLED` | IT Staff, Administrator | Reopening dismissed. |
| **`CANCELLED`** | *(None)* | *(None)* | **Terminal State.** No transitions allowed. |

---

## 9. Acceptance Criteria (AC)

- **AC-01 (Create Action Taken):** Given an authenticated IT Staff or Administrator and valid payload, when creating an Action Taken, it is saved under the target Ticket with `performedById` set to the authenticated user and returned with status `201 Created`.
- **AC-02 (Action Taken Validation):** Given an Action Taken payload where `followUpRequired = true` and `followUpNote` is empty or whitespace, when submitted, the backend rejects with `422 Unprocessable Entity`.
- **AC-03 (Action Taken RBAC):** Given an authenticated Requester, when attempting to create or update an Action Taken, the backend rejects with `403 Forbidden`.
- **AC-04 (Performer Independence):** Given an IT Staff member who is not the Ticket Owner, when creating an Action Taken on an accessible ticket, the operation succeeds (`201 Created`).
- **AC-05 (Update Action Taken):** Given an authorized IT Staff or Administrator and existing Action Taken, when updating `description`, `result`, `followUpRequired`, `followUpNote`, or `attachmentNotes`, the changes persist and return `200 OK`.
- **AC-06 (Actions Taken UI):** Given any authenticated user viewing Ticket Detail, all associated Actions Taken render in a structured table displaying all required fields, with Create/Edit buttons hidden for Requesters.
- **AC-07 (Status Transition Matrix Enforcement):** Given a ticket status update request, if the transition is defined in the matrix for the user's role, it succeeds (`200 OK`); if the transition is invalid or role unauthorized, it is rejected with `422` or `403`.
- **AC-08 (Advisory Requester Resolution):** Given an owned ticket, when a Requester sets `appearsResolved = true`, the flag updates to `true` while the ticket `status` remains unchanged.
- **AC-09 (Optimistic Concurrency Protection):** Given concurrent updates on a Ticket or Action Taken with a mismatched `version`, the backend rejects the stale request with `409 Conflict`.
- **AC-10 (Workflow UI Controls):** Given the Ticket Detail page, the status dropdown displays only permitted next transitions for the current role, disables double-click submission, and auto-refreshes ticket details upon success.
- **AC-11 (Requester Dashboard Metrics):** Given an authenticated Requester, `GET /api/tickets/dashboard/requester` returns metrics strictly calculated from the user's owned tickets.
- **AC-12 (IT Staff Dashboard Metrics):** Given an authenticated IT Staff or Admin, `GET /api/staff/dashboard` returns operational metrics (unassigned, owned by me, status breakdown, IT priority breakdown, recently updated 7 days).
- **AC-13 (Dashboard UI & Drill-Down):** Given the Dashboard views, all metrics display as Zen Green cards with loading/empty states and clickable drill-down navigation to filtered queues.
- **AC-14 (Full Regression Preservation):** Given existing Lab 1–3 automated test suites, all tests continue to pass without regression.
- **AC-15 (Hardening & Quality Assurance):** Given concurrent ticket creation, ticket numbers are generated uniquely without collision (TD-05), and all code adheres to singleton database client standards (TD-03).

---

## 10. Product Definition of Done (DoD)

- [ ] All 4 engineering documents in `docs/lab-04/` (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) are complete and committed prior to implementation code.
- [ ] Prisma migration applies cleanly, preserves all Labs 1–3 data, and idempotently seeds realistic sample records.
- [ ] All 41 planned test cases (`ACTION-01` to `REGRESS-10`) are implemented and passing (100% Green).
- [ ] No regression failures across Lab 1, 2, or 3 test suites.
- [ ] Zero TypeScript compiler errors and zero console errors on production build (`npm run build`).
- [ ] Responsive design verified on Mobile (375px), Tablet (768px), and Desktop (1280px).
- [ ] Peer review completed and documented in `docs/lab-04/reviewer.md`.
- [ ] Final PDF generated adhering to the 9-part format.
