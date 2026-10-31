# AI Usage & Reflection (Lab 4)

## 1. LLMs Used

- **Gemini (Context Service Agent):** Utilized for high-level architectural planning, macro sprint scheduling, cross-file impact analysis, specification drafting, and peer-review auditing.
- **GitHub Copilot / Cursor AI (Coding & Execution Agents):** Utilized for test-driven code generation, TypeScript refactoring, Playwright locator synchronization, and test suite execution directly within the workspace.

---

## 2. Selected Key Prompts (Prompts 1–10)

The following 10 prompts represent the core engineering prompts utilized throughout Sprint 4, demonstrating our progression from initial contract definition through backend/frontend implementation, security hardening, peer-review auditing, and multi-viewport regression testing:

### Prompt 1 (ISSUE-01: Specification & Contract Alignment)
> *"We are kicking off Sprint 4 (Lab 4). Review the Labsheet requirements regarding Actions Taken (§4.3), Status Transitions (§4.5), Concurrency Control (§6.1), and Role Dashboards (§4.6). Draft our formal engineering specifications in `toktickit/docs/lab-04/`: `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md`. Ensure that: (1) All 8 ticket statuses and valid transition rules are mathematically defined; (2) The optimistic locking strategy using integer `version` returning HTTP 409 Conflict is explicitly detailed with sample error JSON; (3) All test IDs map 1:1 with acceptance criteria without gaps; and (4) Strict whitelists and DoD are established for every subsequent feature issue."*
- **Outcome:** Formulated complete, unambiguous engineering contracts that served as the foundational source of truth for all subsequent code generation and verification.

### Prompt 2 (ISSUE-02: Prisma Schema Evolution & Actions Taken Backend)
> *"Implement the backend foundation for Actions Taken in `server/prisma/schema.prisma` and Express routers. Specifically: (1) Create the `ActionTaken` model with fields `id`, `ticketId`, `actionDateTime`, `description`, `result`, `performedById`, `followUpRequired`, `followUpNote`, and `attachmentNotes`; (2) Add `version Int @default(1)` to `Ticket` model; (3) Generate the Prisma migration cleanly; (4) Implement singleton database connection in `server/src/lib/db.ts`; (5) Implement `POST /api/staff/tickets/:ticketId/actions` and `GET /api/staff/tickets/:ticketId/actions` in `staff.controller.ts` with strict RBAC (`IT_STAFF`, `ADMINISTRATOR`) and conditional validation: `followUpNote` must not be empty when `followUpRequired = true`."*
- **Outcome:** Established database schema evolution, migration, singleton Prisma client, and robust REST endpoints with rigorous input validation.

### Prompt 3 (ISSUE-03: Actions Taken UI & Inline Conflict Handling)
> *"Develop the frontend component `client/src/components/ActionsTaken.tsx` and integrate it into `TicketDetail.tsx`. Requirements: (1) Render a responsive list showing technical actions with timestamps, technician names, description, result, and follow-up badges; (2) Provide an inline form for recording and editing actions with validation feedback; (3) Ensure that if a submission fails (e.g. HTTP 409, 422, or 500), the form preserves the user's entered text instead of resetting; (4) Disable submission buttons while in-flight to prevent duplicate posts; (5) Hide create/edit action buttons completely when the authenticated user role is `REQUESTER`."*
- **Outcome:** Delivered a clean, responsive UI component with robust draft retention and role-based action gating.

### Prompt 4 (ISSUE-04: Server-Driven Workflow & Resolution Gate)
> *"Implement the server-driven state machine and resolution validation in `server/src/controllers/staff.controller.ts` and `ticket.routes.ts`. Requirements: (1) Enforce the 8-state transition matrix strictly on the server; (2) Implement the Resolution Gate rule: transitioning a ticket from `IN_PROGRESS` to `RESOLVED` must verify that at least one `ActionTaken` record exists for that ticket, returning HTTP 422 if no action has been recorded; (3) Implement optimistic locking by verifying incoming `version`; if `body.version !== ticket.version`, reject with HTTP 409 Conflict; (4) Implement Requester advisory resolution toggle via `PATCH /api/tickets/:ticketId/requester-resolution` modifying `appearsResolved` without mutating the ticket's formal workflow state."*
- **Outcome:** Enforced business rules, audit trail prerequisites, and concurrency control at the API level with zero reliance on client trust.

### Prompt 5 (ISSUE-05 & Peer Review: Role Dashboards & PR Audit)
> *"I need to conduct a thorough code review on my teammate's PR #66 (`feature/issue-6-lab4-dashboards-api`). Act as a Staff Software Engineer and audit the PR diff against our `api-spec.md` and test independence guidelines. Pay particular attention to: (1) Test Oracle Independence: Are tests asserting behavior through public HTTP endpoints and independent assertions, or are they spying on internal production service methods? (2) HTTP Header Compliance: Do 405 Method Not Allowed fallback handlers correctly emit `Cache-Control: no-store`? (3) Concurrency & Flakiness: Are database queries in parallel tests isolated? Formulate a clear, actionable review comment categorized by [Critical] and [Important] severity."*
- **Outcome:** Uncovered the `dashboardService` spy leakage in `server/tests/lab-04/helpers.ts` and missing `no-store` headers, leading directly to the fixes applied in PR #66.

### Prompt 6 (ISSUE-04: Exhaustive 256-Case State Machine Matrix Tests)
> *"Generate an exhaustive automated test suite for our Ticket Workflow state machine in `server/tests/lab-04/ticket-workflow.api.test.ts`. The system defines 8 distinct ticket statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`. Construct an 8x8 transition test matrix across all 64 status pairs. For each combination, verify the transition permissions under three user roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`): valid transitions defined in our `STATUS_TRANSITIONS` table must return HTTP 200 with an incremented version number, whereas any disallowed transition must be strictly rejected with HTTP 422 Unprocessable Entity and an explanatory error message without modifying the database record."*
- **Outcome:** Produced comprehensive test matrix coverage verifying all legal transitions while guaranteeing zero unauthorized or illegal status leaps (e.g., preventing `NEW` from skipping directly to `CLOSED`).

### Prompt 7 (ISSUE-06: Security Hardening — Eliminating Technical Debt & Insecure Fallbacks)
> *"Execute Phase 1 of ISSUE-06: Resolve all critical security vulnerabilities and hardcoded defaults in the backend. Specifically: (1) In `server/src/middlewares/auth.middleware.ts` and `server/src/controllers/auth.controller.ts`, remove all hardcoded fallback secrets (e.g., `\|\| 'fallback-secret'`). Enforce that the server throws a fatal startup error if `process.env.JWT_SECRET` is undefined; (2) In `server/src/controllers/user.controller.ts`, remove the hardcoded `'password123'` fallback; generate a cryptographically random temporary password and mark `requiresPasswordChange: true`; (3) In `server/src/controllers/attachment.controller.ts`, replace `eval('import("file-type")')` with a standard dynamic `await import('file-type')` to eliminate arbitrary code execution risks; (4) Ensure all tests pass with zero TypeScript compilation errors."*
- **Outcome:** Cleanly remediated TD-08, TD-09, and TD-10 without introducing regressions to existing authentication or attachment flows.

### Prompt 8 (ISSUE-06: Database Transactions — Ticket Number Race Condition & Backoff)
> *"In `server/src/services/ticket.service.ts`, resolve technical debt TD-05 regarding ticket number generation. Currently, counting existing records and formatting `TKT-${String(count + 1)}` outside of an atomic transaction causes duplicate ticket number collisions under concurrent requests. Refactor ticket creation into a `prisma.$transaction` utilizing `Serializable` isolation level. If Prisma throws a concurrency conflict (`P2034`), catch the error and execute an exponential backoff retry (up to 3 attempts) before failing. Verify with concurrent load tests that ticket creation remains strictly sequential and idempotent."*
- **Outcome:** Completely eliminated ticket collision risks during high-frequency ticket submissions while maintaining clean error isolation.

### Prompt 9 (ISSUE-05: Drill-Down & State Synchronization Between Dashboard and Queue)
> *"We identified a frontend state disconnection between `StaffDashboard.tsx` and `StaffQueuePage.tsx`. When staff click a metric card (e.g., 'Unassigned Tickets', 'Critical Priority', or 'Recently Updated'), the dashboard calls `onNavigate('queue', filters)`. However, `StaffQueuePage.tsx` currently fails to parse these incoming filter props upon mounting, defaulting back to an unfiltered queue. Update `StaffQueuePage.tsx` to read `initialFilters` and URL search parameters, initialize the corresponding state dropdowns (`statusFilter`, `priorityFilter`, `ownerFilter`, `recentlyUpdated`), and automatically filter the ticket table to match the clicked metric card."*
- **Outcome:** Seamlessly unified the operational dashboard with the queue view, allowing IT staff to drill down directly into unassigned or critical backlogs with a single click.

### Prompt 10 (ISSUE-06: Playwright E2E & Multi-Viewport Visual QA)
> *"Create an end-to-end Playwright test suite in `e2e/lab-04/` covering our three Lab 4 flows: `actions-taken-flow.spec.ts` (REGRESS-06), `ticket-resolution.spec.ts` (REGRESS-07), and `dashboards.spec.ts` (REGRESS-08). Additionally, create `e2e/lab-04/artifact-screenshots.spec.ts` to capture full-page visual screenshots across three distinct viewport dimensions: Desktop (`1280x720`), Tablet (`768x1024`), and Mobile (`375x667`). Crucial constraints: (1) Do NOT use `.skip()` or `test.fixme()`; (2) Ensure selectors match actual DOM components (e.g., 'User Management' button instead of legacy 'Admin Dashboard'); (3) Save screenshots into `artifacts/lab-04/screenshots/` grouped by feature."*
- **Outcome:** Generated 37/37 passing E2E tests and captured 15 clean responsive artifact screenshots covering all required submission views.

---

## 3. Reflection on AI Usage

### Specification-Driven Development (Spec DD) as Anti-Hallucination Guardrails
Sprint 4 provided definitive evidence that **Specification-Driven Development** is the single most critical practice when working with generative AI. In early iterations where prompts left UI details underspecified, the AI generated superficial decorative badges (e.g. hardcoded labels like "Active" or "Urgent") instead of wiring up live database aggregation metrics. By enforcing complete contract documents (`specification.md`, `api-spec.md`, and `ui-spec.md`) before writing functional code, we established firm mathematical and behavioral guardrails. The AI was constrained to follow explicit status transition graphs, exact JSON payload shapes, and standardized HTTP error structures, effectively eliminating speculative hallucinations.

### File Whitelist Enforcement & Scope Containment
A major operational lesson from Sprint 3 was the risk of AI agents modifying unrelated files across the workspace when attempting broad refactors. In Sprint 4, we strictly enforced **File Whitelists** in every work order prompt. By explicitly naming allowed files and forbidding edits outside of each issue's scope, we prevented regressions in previously merged components. When combined with atomic Git branches (`feature/issue-0X`), this discipline ensured that each Pull Request remained focused, easily reviewable, and free of merge conflicts.

### Collaborative Peer Review & Human-in-the-Loop Oversight
While AI drastically accelerated implementation velocity, human peer review remained indispensable for catching subtle boundary bugs:
- **Our Own Submissions:** Teammate review (`@poom2548`) on PR #57 caught a critical TypeScript argument omission in `TicketDetail.tsx` (`downloadAttachment` missing filename) and a Playwright compound selector parsing error in `admin-flow.spec.ts` (`text=Inactive, ...`). Both issues were caught before merging to staging.
- **Teammate Submissions:** When reviewing our partner's PRs (#66 to #70), we utilized AI to cross-reference their code diffs against the Labsheet rubric. This human-AI synergy successfully detected architectural subtleties—such as production service leakage in test helpers (`vi.spyOn(dashboardService)` violating Test Oracle Independence) and missing `Cache-Control: no-store` headers on 405 error responses.

### Automated Testing as the Uncompromising Safety Net
The requirement to maintain an uncompromising test suite (60 Vitest tests and 37 Playwright E2E tests with zero `.skip()` or `test.fixme()` allowances) transformed testing into an active development compass. Every time an agent introduced subtle layout breakage on mobile viewports or attempted shortcuts in concurrency handling, the automated test suite failed instantly. Pair programming with AI is not about delegating critical thinking to the model; rather, it is about leveraging AI for rapid synthesis while using rigorous specs, peer review, and automated testing to guarantee production-grade software quality.
