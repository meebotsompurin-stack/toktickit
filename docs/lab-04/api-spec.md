# Lab 4 API Contract & Specification

> **Lab 4 Final Implementation Status:**
> - API Contract Formally Specified
> - Ready for TDD and Implementation

---

## 1. Global Authentication & Security Strategy

### 1.1 Authentication Protocol
All protected endpoints require a signed JSON Web Token (JWT) transmitted via standard HTTP Authorization headers:
```http
Authorization: Bearer <JWT_TOKEN>
```
The legacy `X-Requester-Id` header is strictly deprecated and prohibited. User identity (`userId`), role (`role`), and permissions must be extracted exclusively from verified JWT tokens on the server.

### 1.2 Route Namespaces & RBAC
- `/api/auth/*`: Public authentication endpoints (login, password change, token validation).
- `/api/admin/*`: Restricted strictly to `ADMINISTRATOR` role.
- `/api/staff/*`: Restricted to `IT_STAFF` and `ADMINISTRATOR` roles.
- `/api/tickets/*`: Shared ticket access with ownership checks enforced at controller/service level.

---

## 2. Standard Error Responses

### 2.1 Standard JSON Error Shape
All error responses (4xx and 5xx) must adhere to the standardized TokTickIT error contract:

```json
{
  "error": "ErrorType",
  "message": "Human-readable explanation of the error",
  "statusCode": 400,
  "details": []
}
```

### 2.2 Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Malformed JSON or invalid syntax.
- `401 Unauthorized`: Missing or invalid JWT Bearer token.
- `403 Forbidden`: Authenticated user lacks permission for the requested resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Optimistic locking collision / stale-update detected.
- `422 Unprocessable Entity`: Semantic validation failed (e.g., missing conditional field or illegal status transition).
- `500 Internal Server Error`: Unhandled server exception.

### 2.3 Concurrency Conflict Contract (409 Conflict)
When a client submits an update with a mismatched `version`, the server returns `409 Conflict` with current server state:

```json
{
  "error": "Conflict",
  "message": "This record has been modified by another user. Please refresh and try again.",
  "statusCode": 409,
  "details": [
    {
      "field": "version",
      "expectedVersion": 2,
      "currentServerVersion": 3
    }
  ]
}
```

---

## 3. Actions Taken Endpoints

### 3.1 Create Action Taken
`POST /api/staff/tickets/:ticketId/actions`
- **Description:** Records a new technical action taken on a ticket.
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
  ```json
  {
    "actionDateTime": "2026-10-07T08:30:00.000Z",
    "description": "Replaced faulty RAM stick in server rack 2",
    "result": "Server booted successfully with 64GB detected",
    "followUpRequired": true,
    "followUpNote": "Monitor memory logs for 24 hours",
    "attachmentNotes": "Memory diagnostics log uploaded as attachment #2"
  }
  ```
- **Validation Rules:**
  - `description`: String (1-1000 chars), required.
  - `result`: String (1-1000 chars), required.
  - `followUpRequired`: Boolean, optional (default `false`).
  - `followUpNote`: String (1-1000 chars). **Required if `followUpRequired = true`**, otherwise optional.
  - `attachmentNotes`: String (max 500 chars), optional.
- **Success Response (201 Created):**
  ```json
  {
    "id": "cuid-action-123",
    "ticketId": "uuid-ticket-456",
    "actionDateTime": "2026-10-07T08:30:00.000Z",
    "description": "Replaced faulty RAM stick in server rack 2",
    "result": "Server booted successfully with 64GB detected",
    "performedById": "cuid-user-staff-789",
    "performedBy": {
      "id": "cuid-user-staff-789",
      "name": "Jane Doe",
      "email": "jane@toktickit.com"
    },
    "followUpRequired": true,
    "followUpNote": "Monitor memory logs for 24 hours",
    "attachmentNotes": "Memory diagnostics log uploaded as attachment #2",
    "createdAt": "2026-10-07T08:31:00.000Z",
    "updatedAt": "2026-10-07T08:31:00.000Z"
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Not logged in.
  - `403 Forbidden`: Requester role attempting to create action.
  - `404 Not Found`: Ticket does not exist.
  - `422 Unprocessable Entity`: Validation failure (e.g., missing `followUpNote`).

---

### 3.2 Update Action Taken
`PATCH /api/staff/tickets/:ticketId/actions/:actionId`
- **Description:** Updates details, results, follow-up, or attachment notes of an existing Action Taken.
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
  ```json
  {
    "description": "Replaced faulty RAM stick in server rack 2 and updated BIOS",
    "result": "System running stably, memory test 100% pass",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Log updated",
    "version": 1
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "id": "cuid-action-123",
    "ticketId": "uuid-ticket-456",
    "actionDateTime": "2026-10-07T08:30:00.000Z",
    "description": "Replaced faulty RAM stick in server rack 2 and updated BIOS",
    "result": "System running stably, memory test 100% pass",
    "performedById": "cuid-user-staff-789",
    "performedBy": {
      "id": "cuid-user-staff-789",
      "name": "Jane Doe",
      "email": "jane@toktickit.com"
    },
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Log updated",
    "createdAt": "2026-10-07T08:31:00.000Z",
    "updatedAt": "2026-10-07T09:15:00.000Z"
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Requester role attempting edit.
  - `404 Not Found`: Action or Ticket does not exist.
  - `409 Conflict`: Stale update conflict.
  - `422 Unprocessable Entity`: Validation failed.

---

### 3.3 List Actions Taken for Ticket
`GET /api/tickets/:ticketId/actions`
- **Description:** Retrieves all Actions Taken on the specified ticket in chronological order.
- **Auth Required:** Yes (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Access Rule:** Requesters may only view actions if `ticket.requesterId == req.user.id`.
- **Success Response (200 OK):**
  ```json
  [
    {
      "id": "cuid-action-123",
      "ticketId": "uuid-ticket-456",
      "actionDateTime": "2026-10-07T08:30:00.000Z",
      "description": "Replaced faulty RAM stick",
      "result": "Server booted successfully",
      "performedById": "cuid-user-staff-789",
      "performedBy": {
        "id": "cuid-user-staff-789",
        "name": "Jane Doe"
      },
      "followUpRequired": true,
      "followUpNote": "Monitor memory logs",
      "attachmentNotes": "Log #2",
      "createdAt": "2026-10-07T08:31:00.000Z"
    }
  ]
  ```
- **Error Responses:**
  - `403 Forbidden`: Requester accessing another user's ticket actions.
  - `404 Not Found`: Ticket not found.

---

## 4. Ticket Workflow Endpoints

### 4.1 Update Ticket Status
`PATCH /api/staff/tickets/:ticketId/status`
- **Description:** Advances ticket status per the Status Transition Matrix.
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
  ```json
  {
    "status": "IN_PROGRESS",
    "version": 1
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "id": "uuid-ticket-456",
    "ticketNumber": "TKT-0042",
    "status": "IN_PROGRESS",
    "version": 2,
    "updatedAt": "2026-10-07T09:30:00.000Z"
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Unauthorized role for transition.
  - `409 Conflict`: Concurrency version mismatch.
  - `422 Unprocessable Entity`: Illegal transition (e.g., `NEW` -> `CLOSED`).

---

### 4.2 Set Requester Advisory Resolution Flag
`PATCH /api/tickets/:ticketId/requester-resolution`
- **Description:** Allows Requester to mark advisory flag indicating the problem appears resolved.
- **Auth Required:** Yes (`REQUESTER` - owned ticket only)
- **Request Body:**
  ```json
  {
    "appearsResolved": true
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "id": "uuid-ticket-456",
    "appearsResolved": true,
    "status": "IN_PROGRESS",
    "message": "Advisory status updated. Ticket remains in current workflow state until staff resolution."
  }
  ```

---

### 4.3 Requester Close or Reopen Ticket
`PATCH /api/tickets/:ticketId/close-reopen`
- **Description:** Allows Requester to finalize a `RESOLVED` ticket to `CLOSED` or return to `REOPENED`.
- **Auth Required:** Yes (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
  ```json
  {
    "status": "CLOSED",
    "version": 3
  }
  ```
- **Permitted Targets from `RESOLVED`:** `CLOSED` or `REOPENED`.
- **Success Response (200 OK):** Returns updated ticket.

---

## 5. Dashboard Endpoints

### 5.1 Requester Dashboard
`GET /api/tickets/dashboard/requester`
- **Description:** Returns summary metrics and recent activity strictly for the authenticated Requester.
- **Auth Required:** Yes (`REQUESTER`)
- **Success Response (200 OK):**
  ```json
  {
    "metrics": {
      "totalOpen": 3,
      "waitingForRequester": 1,
      "recentlyUpdated": 2,
      "recentlyResolved": 1
    },
    "recentTickets": [
      {
        "id": "uuid-ticket-456",
        "ticketNumber": "TKT-0042",
        "summary": "VPN connection drops frequently",
        "status": "IN_PROGRESS",
        "requestedPriority": "HIGH",
        "updatedAt": "2026-10-07T09:30:00.000Z"
      }
    ]
  }
  ```
- **Empty State Behavior:**
  When requester has no tickets, returns `0` for all counts and empty array `[]` for `recentTickets`.

---

### 5.2 IT Staff Dashboard
`GET /api/staff/dashboard`
- **Description:** Returns operational metrics for IT Staff and Administrators.
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Success Response (200 OK):**
  ```json
  {
    "metrics": {
      "unassigned": 5,
      "ownedByMe": 8,
      "recentlyUpdated": 12,
      "byStatus": {
        "NEW": 3,
        "OPEN": 4,
        "IN_PROGRESS": 6,
        "WAITING_FOR_REQUESTER": 2,
        "RESOLVED": 5,
        "CLOSED": 20,
        "REOPENED": 1,
        "CANCELLED": 2
      },
      "byItPriority": {
        "CRITICAL": 2,
        "HIGH": 4,
        "MEDIUM": 10,
        "LOW": 5
      }
    },
    "urgentTickets": [
      {
        "id": "uuid-ticket-999",
        "ticketNumber": "TKT-0099",
        "summary": "Core switch packet loss",
        "status": "OPEN",
        "itPriority": "CRITICAL",
        "ownerName": "Unassigned",
        "updatedAt": "2026-10-07T09:00:00.000Z"
      }
    ]
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Requesters attempting to view staff dashboard.
