# Lab 4 UI Wireframe & State Specification

> **Lab 4 Final Implementation Status:**
> - UI Specification and Design System Established
> - Adheres strictly to "Zen Green" design language and Bootstrap/Tailwind utility conventions

---

## 1. Global UI Rules & Zen Green Design System

### 1.1 Zen Green Principles
TokTickIT retains the calm, professional, and accessible **Zen Green** aesthetic established in Labs 2 and 3:
- **Primary Color Palette:** Sage, emerald, and forest green accents (`bg-emerald-600`, `text-emerald-800`, `border-emerald-500`, `btn-success`) blended with warm neutral grays (`bg-slate-50`, `text-slate-700`).
- **No Custom CSS:** All styling must strictly utilize existing Bootstrap 5 / Tailwind utility classes. Creation of custom CSS files or inline styling hacks is forbidden.
- **Consistent Badges & Status Cues:**
  - Status badges incorporate text labels plus distinct icons or borders to guarantee WCAG compliance (no color-only status encoding).
  - Priority pills: `CRITICAL` (Dark Red), `HIGH` (Amber), `MEDIUM` (Teal), `LOW` (Slate).

### 1.2 Responsive Breakpoints
All interfaces must adapt smoothly across three mandatory test viewports without horizontal scrolling or content clipping:
1. **Desktop Viewport (1280px+):** Multi-column dashboard grid (3–4 metric cards per row), side-by-side detail view.
2. **Tablet Viewport (768px):** 2-column card layout, responsive table wrappers (`overflow-x-auto`).
3. **Mobile Viewport (375px):** Single-column stacked metric cards, card-based list fallback for dense tables, touch-friendly button targets (minimum 44x44px).

### 1.3 Universal Component States
Every dynamic view must explicitly handle four primary states:
- **Loading State:** Semi-transparent placeholder skeleton or localized spinner with `aria-live="polite"`. Never leave a blank white container.
- **Empty State:** Centered card with descriptive text, subtle neutral icon, and relevant call-to-action button (e.g., *"No actions taken yet. Click 'Add Action Taken' to record work."*).
- **Error State:** Dismissible alert banner (`alert-danger` / `bg-red-50 text-red-700`) detailing the problem and providing a *"Retry"* button.
- **Forbidden State (403):** Shield icon, friendly access denied notice, and *"Back to Dashboard"* navigation button.

---

## 2. IT Staff Dashboard Wireframe

### 2.1 Visual Layout (Desktop Viewport)
```
+--------------------------------------------------------------------------------------------------+
| TokTickIT  [Dashboard*]  [Ticket Queue]  [Admin Users]                    [IT Staff: Jane] (Logout)|
+--------------------------------------------------------------------------------------------------+
| IT Operational Dashboard                                                                         |
|                                                                                                  |
| [ Metric Card 1 ]        [ Metric Card 2 ]        [ Metric Card 3 ]        [ Metric Card 4 ]     |
|  Unassigned Tickets       Owned by Me              Recently Updated (7d)    Critical Priority    |
|       [ 5 ]                    [ 8 ]                    [ 12 ]                   [ 2 ]           |
|  -> View Queue            -> View My Queue         -> View Updated          -> View Critical     |
|                                                                                                  |
| +-------------------------------------------------------+ +------------------------------------+ |
| | Tickets by Status                                     | | Tickets by IT Priority             | |
| | - NEW: 3             - WAITING_FOR_REQUESTER: 2       | | [CRITICAL]: 2                      | |
| | - OPEN: 4            - RESOLVED: 5                    | | [HIGH]:     4                      | |
| | - IN_PROGRESS: 6     - CLOSED: 20                     | | [MEDIUM]:   10                     | |
| | - REOPENED: 1        - CANCELLED: 2                   | | [LOW]:      5                      | |
| +-------------------------------------------------------+ +------------------------------------+ |
|                                                                                                  |
| Urgent Tickets Awaiting Action                                                                   |
| +----------+---------------------------------+---------------+-------------+-------------------+ |
| | Number   | Summary                         | IT Priority   | Status      | Action            | |
| +----------+---------------------------------+---------------+-------------+-------------------+ |
| | TKT-0099 | Core switch packet loss         | CRITICAL      | OPEN        | [Open Ticket]     | |
| | TKT-0104 | Database replica out of sync    | HIGH          | IN_PROGRESS | [Open Ticket]     | |
| +----------+---------------------------------+---------------+-------------+-------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### 2.2 Behavior & Drill-Downs
- Clicking any metric card filters and navigates directly to the Staff Ticket Queue pre-filtered by that criterion (e.g., clicking *"Unassigned"* passes filter `owner=null`).
- Clicking *"Open Ticket"* navigates directly to `TicketDetail` view for that ticket.

---

## 3. Requester Dashboard Wireframe

### 3.1 Visual Layout (Desktop / Tablet Viewport)
```
+--------------------------------------------------------------------------------------------------+
| TokTickIT  [My Dashboard*]  [My Tickets]  [+ Create Ticket]             [Requester: Alex] (Logout)|
+--------------------------------------------------------------------------------------------------+
| Welcome back, Alex! Here is a summary of your support requests.                                 |
|                                                                                                  |
| [ Metric Card 1 ]        [ Metric Card 2 ]        [ Metric Card 3 ]        [ Metric Card 4 ]     |
|  Total Open Tickets       Needs Your Attention     Recently Updated (7d)    Recently Resolved    |
|       [ 3 ]                    [ 1 ]                    [ 2 ]                    [ 1 ]           |
|  -> View Open             -> Action Required       -> View Recent           -> View Resolved     |
|                                                                                                  |
| My Recent Support Tickets                                                  [+ New Support Ticket]|
| +----------+----------------------------------+---------------------+--------------+------------+ |
| | Number   | Summary                          | Status              | Updated      | View       | |
| +----------+----------------------------------+---------------------+--------------+------------+ |
| | TKT-0042 | VPN connection drops frequently  | WAITING_FOR_REQ     | 2 hours ago  | [Details]  | |
| | TKT-0045 | Request second monitor for desk  | IN_PROGRESS         | Yesterday    | [Details]  | |
| +----------+----------------------------------+---------------------+--------------+------------+ |
+--------------------------------------------------------------------------------------------------+
```

### 3.2 Requester Isolation & Empty State
- All metrics strictly represent tickets where `requesterId == alex.id`.
- If Alex has 0 tickets, the recent tickets table displays:
  ```
  +-----------------------------------------------------------------------------------+
  |                                 [ Folder Icon ]                                   |
  |                        You have no active support tickets.                        |
  |                  Need technical assistance? Submit a request today.               |
  |                              [+ Create Support Ticket]                            |
  +-----------------------------------------------------------------------------------+
  ```

---

## 4. Actions Taken Area Wireframe (Inside Ticket Detail)

### 4.1 Visual Layout (Ticket Detail Bottom Section)
```
+--------------------------------------------------------------------------------------------------+
| Ticket Detail: TKT-0042 (VPN connection drops frequently)                                        |
| Status: [ IN_PROGRESS v ]   [Save Status]   Priority: HIGH   Requester: Alex   Owner: Jane       |
| [ ] Problem appears resolved (Advisory)                                                          |
+--------------------------------------------------------------------------------------------------+
| [Overview]   [Comments & Notes]   [Actions Taken (3)*]   [Attachments (2)]                       |
|                                                                                                  |
| Actions Taken History                                                    [+ Add Action Taken]    |
| +----------------------------------------------------------------------------------------------+ |
| | 2026-10-07 08:30 | Performed by: Jane Doe (IT Staff)                    [Edit Action]        | |
| | Description: Inspected client VPN logs and re-keyed certificates                             | |
| | Result: Client authenticated successfully but latency remains high                            | |
| | [!] Follow-Up Required: Yes                                                                   | |
| | Follow-Up Note: Check perimeter firewall throughput during peak lunch hours                   | |
| | Attachment Notes: See vpn_debug_0710.log in attachments tab                                  | |
| +----------------------------------------------------------------------------------------------+ |
| | 2026-10-06 14:15 | Performed by: Bob Smith (IT Staff)                     [Edit Action]        | |
| | Description: Reset user network password and cleared AD lockouts                              | |
| | Result: User verified password works on webmail                                               | |
| | Follow-Up Required: No                                                                        | |
| +----------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### 4.2 Modal Form: Add / Edit Action Taken
```
+-----------------------------------------------------------------------------------+
| Record Action Taken                                                         [ X ] |
+-----------------------------------------------------------------------------------+
| Action Date & Time:                                                               |
| [ 2026-10-07 08:30 AM                 ] (Auto-populated with current time)        |
|                                                                                   |
| Performed By:                                                                     |
| [ Jane Doe (Logged-in Staff)          ] (Read-only, derived from JWT)             |
|                                                                                   |
| Action Description (*):                                                           |
| [ Replaced faulty RAM stick in server rack 2                                  ]   |
|                                                                                   |
| Action Result (*):                                                                |
| [ Server booted successfully with 64GB detected                               ]   |
|                                                                                   |
| [X] Follow-Up Required?                                                           |
|                                                                                   |
| Follow-Up Note (* Required when Follow-Up is checked):                            |
| [ Monitor memory error logs for next 24 hours                                 ]   |
|                                                                                   |
| Attachment Notes (Optional):                                                      |
| [ See memory_diag.png attached in ticket                                      ]   |
|                                                                                   |
| +-------------------------------------------------------------------------------+ |
| | [ Cancel ]                                            [ Save Action Taken ]   | |
+-----------------------------------------------------------------------------------+
```

### 4.3 Role-Specific UI Controls
- **IT Staff & Administrator:** See the `[+ Add Action Taken]` button and `[Edit Action]` button on each action card/row.
- **Requester:** The Actions Taken list is visible, but the `[+ Add Action Taken]` button, `[Edit Action]` buttons, and all editing forms are completely hidden.

### 4.4 Workflow Transition Controls & Concurrency Handling
- **Permitted Transitions Dropdown:** The status selector on Ticket Detail only lists transitions permitted by the matrix for the current role from the current ticket status.
- **Double-Click Lock:** On clicking `[Save Status]` or `[Save Action Taken]`, the button transitions to a disabled loading spinner state (`Saving...`) to prevent duplicate requests.
- **Conflict Handling Modal:** If the server returns `409 Conflict`, a warning dialog appears:
  ```
  +-----------------------------------------------------------------------+
  | [!] Concurrent Modification Detected                                  |
  +-----------------------------------------------------------------------+
  | This ticket has been updated by another team member since you loaded  |
  | the page.                                                             |
  |                                                                       |
  | Your changes were not applied to avoid overwriting their work.         |
  |                                                                       |
  |                        [ Refresh Ticket Data ]                        |
  +-----------------------------------------------------------------------+
  ```
