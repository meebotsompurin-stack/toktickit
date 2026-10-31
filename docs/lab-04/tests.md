# Lab 4 Test Plan and Results

> **Lab 4 Final Implementation Status:**
> - Test Strategy Formally Established
> - 41 Test IDs planned across 4 categories (`ACTION`, `WORK`, `DASH`, `REGRESS`)
> - 100% Traceability to Sprint 4 Acceptance Criteria (AC-01 to AC-15)

---

## 1. Test Strategy

TokTickIT utilizes a comprehensive multi-layered testing pyramid adhering strictly to Test-Driven Development (Test DD / Red-Green-Refactor):

```
                   ┌──────────────┐
                   │  E2E Flows   │  ← Playwright (e2e/lab-04/*.spec.ts)
                   │   (10 tests) │
                 ┌─┴──────────────┴─┐
                 │    API / Int.    │  ← Vitest + Supertest (server/tests/lab-04/*.api.test.ts)
                 │    (20 tests)    │
               ┌─┴──────────────────┴─┐
               │    Unit / Component   │  ← Vitest + Testing Library (server/src/__tests__/, client/src/__tests__/)
               │       (11 tests)      │
               └───────────────────────┘
```

1. **Unit Tests (Fast Feedback):** Validate pure functions, validation rules, state transition matrices, and isolated React components.
2. **API Integration Tests (Contract Verification):** Validate HTTP endpoints, JWT authentication, RBAC authorization, standard error shapes, status codes, and database mutations.
3. **End-to-End Tests (User Flow Verification):** Automate full browser journeys from login to ticket creation, action logging, workflow transition, and dashboard drill-down under real browser environments.

---

## 2. Test Execution Matrix (Traceability)

| Test ID | Type | AC ref | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ACTION-01** | API | AC-01 | Create Action Taken with valid payload by IT Staff | 201 Created, stored under ticket, performer bound from JWT | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-02** | API | AC-02 | Create Action Taken with `followUpRequired=true` but missing `followUpNote` | 422 Unprocessable Entity with validation details | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-03** | API | AC-03 | Requester attempts to create Action Taken | 403 Forbidden with standard error shape | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-04** | API | AC-04 | IT Staff creates Action Taken on ticket owned by another staff member | 201 Created (BR-02 Performer != Owner permitted) | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-05** | API | AC-05 | Update existing Action Taken fields (description, result, follow-up) | 200 OK, updated fields persist, performer unchanged | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-06** | API | AC-03 | Requester views Actions Taken for their owned ticket | 200 OK, returns list of action records | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-07** | API | AC-03 | Requester attempts to view Actions Taken for ticket owned by another user | 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACTION-08** | Unit | AC-15 | Verify singleton `PrismaClient` exported from `lib/db.ts` | Same instance returned across all modules (TD-03) | `server/src/__tests__/db-singleton.test.ts` | Planned |
| **ACTION-09** | UI | AC-06 | `ActionsTaken` component renders list with all columns | Table columns visible, action text and results displayed | `client/src/__tests__/ActionsTaken.test.tsx` | Planned |
| **ACTION-10** | UI | AC-01 | IT Staff submits new Action Taken form | Form submits, calls API, displays success feedback | `client/src/__tests__/ActionsTaken.test.tsx` | Planned |
| **ACTION-11** | UI | AC-02 | `followUpRequired` checked without note in form | Shows required validation message, prevents submission | `client/src/__tests__/ActionsTaken.test.tsx` | Planned |
| **ACTION-12** | UI | AC-03 | Requester view of `ActionsTaken` component | Add Action button and Edit buttons are completely hidden | `client/src/__tests__/ActionsTaken.test.tsx` | Planned |
| **ACTION-13** | UI | AC-06 | `ActionsTaken` empty state with zero records | Renders friendly empty state: "No actions taken yet" | `client/src/__tests__/ActionsTaken.test.tsx` | Planned |
| **ACTION-14** | E2E | AC-01 | Full user flow: Staff login, open ticket, add action, verify display | Action appears in ticket audit history | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **WORK-01** | API | AC-07 | Valid status transitions per matrix (e.g., NEW $\rightarrow$ OPEN) | 200 OK, status updated in database | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WORK-02** | API | AC-07 | Illegal status transition (e.g., NEW $\rightarrow$ CLOSED directly) | 422 Unprocessable Entity | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WORK-03** | API | AC-07 | Status transition requested by unauthorized role | 403 Forbidden | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WORK-04** | API | AC-08 | Requester sets `appearsResolved=true` | 200 OK, flag saved, ticket status remains unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WORK-05** | API | AC-09 | Concurrent status update with stale `version` | 409 Conflict with server version details | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WORK-06** | API | AC-09 | Concurrent action update with stale `version` | 409 Conflict | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WORK-07** | UI | AC-10 | Status dropdown shows only permitted next statuses | Options match matrix for current ticket status and role | `client/src/__tests__/TicketWorkflow.test.tsx` | Planned |
| **WORK-08** | UI | AC-10 | Double-click prevention on status change button | Button disables on click, single network request sent | `client/src/__tests__/TicketWorkflow.test.tsx` | Planned |
| **DASH-01** | API | AC-11 | Requester dashboard metrics query | Returns totalOpen, waiting, recentlyUpdated for own tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-02** | API | AC-11 | Requester dashboard for user with 0 tickets | Returns `{ totalOpen: 0, ... }` without errors | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-03** | API | AC-12 | IT Staff dashboard operational metrics query | Returns unassigned, ownedByMe, byStatus, byItPriority | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-04** | API | AC-12 | Staff dashboard recently updated 7-day filter window | Only tickets updated within 7 days counted | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-05** | API | AC-12 | Requester attempts to access staff dashboard endpoint | 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-06** | UI | AC-12 | `StaffDashboard` renders all metric cards and urgent list | Cards display accurate values from API response | `client/src/__tests__/StaffDashboard.test.tsx` | Planned |
| **DASH-07** | UI | AC-11 | `RequesterDashboard` renders personal metrics and tickets | Only requester's own activity shown | `client/src/__tests__/RequesterDashboard.test.tsx` | Planned |
| **DASH-08** | UI | AC-13 | Drill-down click on metric card | Navigates to queue with matching query filter applied | `client/src/__tests__/StaffDashboard.test.tsx` | Planned |
| **DASH-09** | UI | AC-13 | Empty state rendering when all metric counts are zero | Clean empty state with helpful guidance displayed | `client/src/__tests__/StaffDashboard.test.tsx` | Planned |
| **REGRESS-01** | E2E | AC-14 | Lab 2 Requester ticket flow (fixed with JWT auth) | Full ticket creation and detail flow passes (TD-02) | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **REGRESS-02** | E2E | AC-14 | Lab 3 Authentication & session flow | Login, password change, and logout pass | `e2e/lab-03/auth-flow.spec.ts` | Planned |
| **REGRESS-03** | E2E | AC-14 | Lab 3 Requester ticket management & comments | Requester features pass | `e2e/lab-03/requester-flow.spec.ts` | Planned |
| **REGRESS-04** | E2E | AC-14 | Lab 3 Staff queue and claim flow with valid transitions | Staff flow passes under new transition matrix | `e2e/lab-03/staff-flow.spec.ts` | Planned |
| **REGRESS-05** | E2E | AC-14 | Lab 3 Admin user management flow | Admin features pass | `e2e/lab-03/admin-flow.spec.ts` | Planned |
| **REGRESS-06** | E2E | AC-01 | Lab 4 Actions Taken complete lifecycle flow | Create, view, edit action in browser | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **REGRESS-07** | E2E | AC-14 | Lab 4 Status transitions and conflict notification | Permitted transition flow and conflict handling pass | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **REGRESS-08** | E2E | AC-13 | Lab 4 Dashboards metrics view and drill-down | Dashboard cards load and navigate to queues | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **REGRESS-09** | API | AC-15 | Concurrent ticket creation generates unique ticket numbers | No duplicate ticket numbers generated under load (TD-05) | `server/tests/lab-04/ticket-concurrency.api.test.ts` | Planned |
| **REGRESS-10** | API | AC-15 | Legacy endpoint `GET /api/requesters/active` security guard | 401 Unauthorized without auth or deprecated cleanly (TD-07) | `server/tests/lab-04/legacy-routes.api.test.ts` | Planned |

---

## 3. Test Execution Environment & Prerequisites

### 3.1 Setup Instructions
Ensure the PostgreSQL database is running and environment variables are loaded:
```bash
cd toktickit
npm install
cd server && npx prisma migrate reset --force
npm run seed
```

### 3.2 Running Backend Unit & API Tests
```bash
cd toktickit/server
# Run all server unit and integration tests
npx vitest run

# Run only Lab 4 API contract tests
npx vitest run tests/lab-04/
```

### 3.3 Running Frontend Unit Tests
```bash
cd toktickit/client
# Run React component tests
npx vitest run
```

### 3.4 Running Playwright End-to-End Tests
```bash
cd toktickit
# Run all E2E suites including regression
npx playwright test

# Run Lab 4 E2E suites only
npx playwright test e2e/lab-04/
```
