# TokTickIT — IT Service Desk Platform (Lab 4)

TokTickIT is a full-stack, enterprise-grade IT Service Desk and Ticket Tracking platform built using React, TypeScript, Express, PostgreSQL, Prisma ORM, Tailwind CSS (Zen Green theme), and Playwright. 

This repository represents the completed **Lab 4 (Sprint 4)** increment, adding parent-child **Actions Taken** audit trails, an authoritative **8-State Ticket Workflow Engine** with optimistic concurrency protection (HTTP 409), **Role Dashboards** (Requester, IT Staff, Administrator) with drill-down metrics, and comprehensive regression hardening across Labs 1 through 4.

---

## 1. System Requirements & Prerequisites

* **Node.js:** `v20.x` or `v22.x` (LTS recommended)
* **npm:** `v10.x` or later
* **PostgreSQL:** `v15.x` or `v16.x`
* **Operating System:** Cross-platform (Windows, macOS, Linux)

---

## 2. Step-by-Step Installation & Setup

### 2.1 Clone Repository
```bash
git clone https://github.com/meebotsompurin-stack/toktickit.git
cd toktickit
```

### 2.2 Root & Dependencies Installation
Install dependencies for both root (Playwright E2E), backend (`server`), and frontend (`client`):
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 2.3 Environment Configuration

#### Backend Environment
In `server/`:
```bash
cp server/.env.example server/.env
```
Ensure your `DATABASE_URL` and `JWT_SECRET` are correctly configured:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit_db?schema=public"
JWT_SECRET="super-secret-jwt-key-replace-in-production"
```

#### Frontend Environment
In `client/`:
The frontend automatically proxies `/api` to `http://localhost:3000` via Vite development server (`vite.config.ts`). A safe `client/.env.example` is provided for reference.

### 2.4 Database Migration & Seeding
Run Prisma migrations and populate the database with idempotent seed data:
```bash
cd server
npx prisma migrate dev
npx prisma db seed
cd ..
```

---

## 3. Running the Application

### Development Mode (Concurrent)
You can run both backend and frontend concurrently in two terminal windows:

* **Terminal 1 (Backend Server):**
  ```bash
  cd server
  npm run dev
  # Server runs on http://localhost:3000
  ```

* **Terminal 2 (Frontend Client):**
  ```bash
  cd client
  npm run dev
  # Client runs on http://localhost:5173
  ```

Visit **`http://localhost:5173`** in your browser.

---

## 4. Demo Accounts (Seed Data)

> [!NOTE]
> All seed accounts use the default password `password123` for demonstration and grading purposes only.

| Role | Email | Password | Name / Description |
| :--- | :--- | :--- | :--- |
| **Requester** | `somchai.req@toktickit.dev` | `password123` | Somchai Jai-dee (Default Requester) |
| **Requester** | `siriporn.req@toktickit.dev` | `password123` | Siriporn Bua-kaew |
| **IT Staff** | `piyanuch.staff@toktickit.dev` | `password123` | Piyanuch Kham-pee (Staff Technician) |
| **IT Staff** | `thanawat.staff@toktickit.dev` | `password123` | Thanawat Sorn-ram |
| **Administrator** | `admin@toktickit.dev` | `password123` | Admin TokTickIT (Full Admin Access) |
| **Inactive User** | `kamon.inactive@toktickit.dev` | `password123` | Kamon (Used for RBAC rejection tests) |

---

## 5. Role Walkthroughs & Core Capabilities

### 5.1 Requester Experience
* **Requester Dashboard:** Summary metric cards showing Total Open Tickets, Tickets Waiting for Requester, Recently Updated (7 days), and Recently Resolved.
* **My Tickets:** Filterable, searchable list of tickets owned strictly by the authenticated requester.
* **Create Ticket:** Form with Category selection, Priority, Summary, Description, and Attachment upload.
* **Actions Taken Visibility:** Requesters can inspect technical steps taken by IT Staff on their tickets in read-only mode.

### 5.2 IT Staff Experience
* **IT Operational Dashboard:** 4 actionable metric cards (Unassigned Tickets, My Assigned, Open Status, High/Critical Priority). Clicking any card navigates to the Staff Queue with pre-populated filters.
* **Staff Ticket Queue:** Global queue allowing assignment, claim, priority sorting, and status filtering.
* **Actions Taken Recording:** Record detailed interventions (Action DateTime, Description, Result, Follow-Up Required/Note, Attachment Notes) directly in `TicketDetail`.
* **State Machine & Resolution Gate:** Permits transitions according to the 8-status matrix. Transitioning to `RESOLVED` strictly requires at least 1 recorded `ActionTaken`.

### 5.3 Administrator Experience
* **Admin Dashboard:** Extends IT Staff dashboard with a 5th metric card (**Total User Accounts**) and quick navigation to User Management.
* **User Management:** Create new users, reset passwords, change user roles, and activate/deactivate accounts.

---

## 6. Testing & Quality Assurance

TokTickIT enforces a strict 3-tier testing pyramid with **100% pass rate**:

### 6.1 Backend API & Unit Tests (Vitest)
```bash
cd server
npm test
# Runs 60 tests across authentication, RBAC, workflows, actions taken, and dashboards
```

### 6.2 Frontend Component Tests (Vitest + RTL)
```bash
cd client
npm test
# Runs 13 tests verifying ActionsTaken, RequesterDashboard, StaffDashboard, and TicketWorkflow
```

### 6.3 End-to-End Test Suite (Playwright)
```bash
# Run all 37 E2E tests headless across Lab 2, 3, and 4 flows
npx playwright test

# Run specifically Lab 4 E2E flows
npx playwright test e2e/lab-04/

# Capture visual QA screenshots across 3 viewports (Desktop, Tablet, Mobile)
npx playwright test e2e/lab-04/artifact-screenshots.spec.ts
```

---

## 7. Database Rollback Procedures

If a schema rollback of Lab 4 is required, execute the down-migration script:
```bash
psql -U postgres -d toktickit_db -f server/prisma/rollback/rollback-lab4.sql
```
Detailed step-by-step documentation is available in [`server/prisma/rollback/README.md`](server/prisma/rollback/README.md).

---

## 8. Repository Structure

```text
toktickit/
├── docs/lab-04/              # Sprint 4 Specifications & Evidence
│   ├── specification.md      # Engineering Spec, FRs, BRs, ACs, DoD
│   ├── api-spec.md           # REST API Contract & Schemas
│   ├── ui-spec.md            # Zen Green Design System & Responsive Rules
│   ├── tests.md              # Test Strategy & 41-case Traceability Matrix
│   ├── reviewer.md           # Peer Review logs (PR #52-#58 and friend's PR #66-#70)
│   └── ai-use.md             # 10 Key Prompts & AI Reflection
├── server/                   # Express Backend & Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (ActionTaken, Ticket version)
│   │   ├── seed.ts           # Idempotent seed data
│   │   └── rollback/         # Database rollback script & instructions
│   ├── src/
│   │   ├── controllers/      # Route controllers (Staff, Ticket, User, Dashboard)
│   │   ├── middlewares/      # JWT Auth, RBAC, Safe upload middlewares
│   │   └── lib/              # State transitions engine & DB singleton
│   └── tests/lab-04/         # Backend Vitest test suites
├── client/                   # Vite + React Frontend (Zen Green Tailwind UI)
│   ├── src/
│   │   ├── components/       # ActionsTaken.tsx, TicketDetail.tsx, AppShell
│   │   └── pages/            # StaffDashboard, RequesterDashboard, StaffQueue
│   └── src/__tests__/        # Frontend component unit tests
├── e2e/lab-04/               # Playwright End-to-End test suites
└── artifacts/lab-04/screenshots/ # Multi-viewport visual QA artifacts (18 screenshots)
```
