# Sprint Peer Review Summary - Lab 3

This document summarizes the GitHub Pull Request peer review process between `meebotsompurin-stack` (Author) and `poom2548` (Reviewer), and vice versa, during the Lab 3 sprint. 

---

## Section 1: My Pull Requests
**Repository:** [meebotsompurin-stack/toktickit](https://github.com/meebotsompurin-stack/toktickit)  
**Author:** `meebotsompurin-stack` | **Reviewer:** `poom2548`

### PR #34: Docs/1 lab3 sprint contract
- **Reviewer's Feedback:** The reviewer checked the document files and confirmed they were complete.
- **Author's Fixes:** No fixes required.
- **Final Status:**  **Approved & Merged**

### PR #35: feat: implement database evolution and core authentication
- **Reviewer's Feedback:** 
  1. Requested the full `schema.prisma` diff for easier review.
  2. Missing `appearsResolved` field in the schema and migration.
  3. Suggested merging `PublicComment` and `InternalNote` into a single `TicketComment` table.
  4. Enforce AC-04 in `authenticate` middleware (block routes if `requiresPasswordChange` is true).
  5. Check `isActive` status before verifying the password with bcrypt.
  6. Missing tests for AC-04 and the Logout system.
- **Author's Fixes:** Implemented all requested changes, adjusting the authentication flow and adding the necessary test cases.
- **Final Status:**  **Approved & Merged**

### PR #36: feat: implement admin user management dashboard and security fixes
- **Reviewer's Feedback:**
  1. **Incorrect API Routes:** Placed at `/api/users` instead of `/api/admin/users`, and used `POST` instead of `PATCH` for password reset.
  2. **Missing Feature:** Missing the "Create User" API, duplicate email 409 conflict handling, and the Frontend UI Modal for creation.
  3. **UI Mismatch:** Did not use the colored badges (Purple/Blue/Gray) for roles as specified in the UI requirements.
  4. **Missing Tests:** Missing `admin-users.test.ts` and `admin-rbac.test.ts`.
- **Author's Fixes:** Corrected the endpoint paths to `/api/admin/users`, implemented the Create User modal with 409 conflict checks, styled the role badges properly, and added the missing test suites.
- **Final Status:**  **Approved & Merged**

### PR #38: feat: implement real session auth, public comments, and resolved flag
- **Reviewer's Feedback:**
  1. Internal Notes data leaked inside the `GET /api/tickets/:id` response instead of being isolated.
  2. Used the wrong route `/resolved-status` instead of `/resolution-flag`.
  3. Missing `comments.test.ts` and `requester-actions.test.ts`.
  4. A follow-up review caught a frontend bug where the UI was still mapping over the old `ticket.comments` instead of fetching from the dedicated API state.
- **Author's Fixes:** Isolated the comments API to prevent data leaks, renamed the route to `/resolution-flag`, added the missing unit tests, and correctly wired the React UI state to fetch and map the separated comments.
- **Final Status:**  **Approved & Merged**

### PR #39: feat: implement IT Staff ticket detail workflows (Issue #32)
- **Reviewer's Feedback:**
  1. Missing Staff Queue API and UI page.
  2. Endpoint violation: squashed claim, priority, and status updates into a single `PATCH /api/tickets/:ticketId` instead of splitting them.
  3. RBAC security was handled via hardcoded `403` blocks in the controller instead of proper Middleware routing under `/api/staff/*`.
  4. Layout mismatch: UI used side-by-side columns instead of a true Tabbed layout for Comments/Notes.
  5. The test file was named incorrectly.
  6. A follow-up review noted the Frontend API wiring was missing in `api.ts`.
- **Author's Fixes:** Created the GET queue API, split the endpoints (`/claim`, `/owner`, `/status`), moved them under the `/api/staff` router to utilize proper RBAC middleware, implemented true Tabbed UI state in React, added the missing fetch functions in `api.ts`, and renamed the test file to `staff-ticket.test.ts`.
- **Final Status:**  **Approved & Merged**

---

## Section 2: Friend's Pull Requests
**Repository:** [poom2548/toktickit](https://github.com/poom2548/toktickit)  
**Author:** `poom2548` | **Reviewer:** `meebotsompurin-stack`

### PR #33: lab3 issue1 specification doc and others
- **Reviewer's Feedback:** Documentation was thoroughly reviewed and deemed complete.
- **Author's Fixes:** No fixes required.
- **Final Status:**  **Approved & Merged**

### PR #35: Issue 2 - Database Evolution and Migration
- **Reviewer's Feedback:** Code was well-structured and met the criteria for database evolution. 
- **Author's Fixes:** No fixes required.
- **Final Status:**  **Approved & Merged**

### PR #37: Issue 3 authentication
- **Reviewer's Feedback:** 
  1. Suggested adding `JWT_SECRET` to `.env.example` to prevent setup issues.
  2. Noted a typo in `token.ts` where the fallback expiry was hardcoded to `24h` instead of correctly utilizing the environment variable fallback pattern.
- **Author's Fixes:** Acknowledged the feedback and adjusted environment setups.
- **Final Status:**  **Approved & Merged**

### PR #39: issue-4-Requester Regression & Public Comments
- **Reviewer's Feedback:** 
  1. Suggested tightening the HTTP status codes for Internal Notes to explicitly return `403 Forbidden` if a requester attempts access.
  2. Advised double-checking the Prisma data type for `requesterId` in the controller logic.
  3. Recommended adding backend test coverage specifically for the new comment systems.
- **Author's Fixes:** Acknowledged recommendations for future tightening.
- **Final Status:**  **Approved & Merged**

### PR #41: Issue 5 - IT Staff Ticket Queue
- **Reviewer's Feedback:** Approved the PR, confirming Pagination, Search/Filter, Sorting, and Skeleton Loaders worked perfectly. 
  - *Suggestion:* Added a recommendation to use `.trim()` on filter inputs to prevent whitespace errors, and suggested adding Database Indexes on `status`, `createdAt`, and `ticketNumber` for future scalability.
- **Author's Fixes:** Acknowledged the optimizations.
- **Final Status:**  **Approved & Merged**

### PR #42: Issue 6: Staff Ticket Detail Operations
- **Reviewer's Feedback:**
  1. **Description Mismatch:** The PR description mistakenly referenced Issue 5 (Queue) instead of Issue 6 (Detail).
  2. **Missing CSS:** UI Badges (Status, Priority) lacked the specific Zen Green Theme styling.
  3. **Loading State:** The `.loading-skeleton` class lacked actual CSS, resulting in a blank white screen during data fetching.
  4. **TypeScript Safety:** The `OperationalSection.tsx` component was using `any` instead of the proper `TicketDetail` interface.
  5. *Follow-up:* The applied badge colors were hardcoded hex values instead of utilizing the global Zen Green Theme variables.
- **Author's Fixes:** Corrected the PR description, implemented `badges.css` with proper theme variables, added a pulse animation for the loading skeleton, and replaced `any` with strict TypeScript interfaces.
- **Final Status:**  **Approved & Merged**

### PR #45: Issue#7: Administrator user management
- **Reviewer's Feedback:** Checked the Administrator workflows and confirmed they meet the requirements.
- **Author's Fixes:** No fixes required.
- **Final Status:**  **Approved & Merged**

### PR #47: Issue8: Zen Green Visual QA & Responsive Polish
- **Reviewer's Feedback:** Checked the UI responsiveness across all viewports and verified the Zen Green visual themes were uniformly applied. 
- **Author's Fixes:** No fixes required.
- **Final Status:**  **Approved & Merged**
