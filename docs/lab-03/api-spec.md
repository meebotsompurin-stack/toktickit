# Lab 3 API Contract & Specification

> **Lab 3 Final Implementation Status:**
> - **Authentication:** Upgraded seamlessly from Lab 2's fake `X-Requester-Id` header to a real Bearer Token (JWT) session flow.
> - **Authorization Matrix:** Namespace routes (`/api/staff/*`, `/api/admin/*`) strictly enforce permissions for `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR` via middleware.

## 1. Global Authentication & Security Strategy

### 1.1 Bearer Token Strategy
*   **Header Name:** `Authorization`
*   **Format:** `Bearer <JWT_ACCESS_TOKEN>`
*   **Token Storage (Frontend):** จัดเก็บไว้ใน `localStorage` (`toktickit_token`)
*   **Token Payload Schema:**
    ```json
    {
      "sub": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "username": "somchai.it",
      "name": "Somchai Jaidee",
      "role": "ITStaff",
      "requiresPasswordChange": false,
      "iat": 1789210000,
      "exp": 1789296400
    }
    ```
*   **Deprecated Headers:** ยกเลิกการส่งและเชื่อถือ Header `X-Requester-Id` จากฝั่ง Client โดยสิ้นเชิง Backend จะดึง User ID และสิทธิ์ต่างๆ จาก JWT Payload เท่านั้น

### 1.2 Namespace Routing Architecture
ระบบแบ่ง Route ออกตามขอบเขตของบทบาท (Role-based Namespaces) อย่างชัดเจน:
*   `/api/auth/*` : สำหรับการยืนยันตัวตน ตรวจสอบ Session และจัดการรหัสผ่าน
*   `/api/admin/*` : สงวนสิทธิ์เฉพาะผู้ใช้บทบาท `Administrator` เท่านั้น
*   `/api/staff/*` : สงวนสิทธิ์เฉพาะบทบาท `ITStaff` และ `Administrator` เท่านั้น
*   `/api/tickets/*` : Endpoint ใช้งานร่วมกันสำหรับ Requester, IT Staff และ Admin (คัดกรองข้อมูลตามสิทธิ์ของผู้ร้องขอ)

---

## 2. Standard Error Responses

ระบบส่งคืนโครงสร้าง Error Response แบบเดียวกันทั่วทั้งระบบ:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource",
  "statusCode": 403,
  "details": []
}
```

### Standard Status Codes
*   **401 Unauthorized:** ไม่ได้แนบ Bearer Token, Token หมดอายุ หรือไม่สามารถยืนยันความถูกต้องของ Token ได้
*   **403 Forbidden:** ผู้ใช้ไม่มีสิทธิ์เข้าถึงทรัพยากรนั้น (เช่น Requester เรียก API ของ `/api/admin/*`, หรือเข้าดูตั๋วของผู้อื่น, หรือบัญชียังติดแฟล็ก `requiresPasswordChange = true`)
*   **404 Not Found:** ไม่พบทรัพยากร (User, Ticket หรือ Attachment) ที่ระบุ
*   **409 Conflict:** เกิดความขัดแย้งของข้อมูล (เช่น การสร้าง User ด้วย `username` ที่มีอยู่ในระบบแล้ว)
*   **422 Unprocessable Entity:** ข้อมูลที่ส่งมาใน Request ไม่ผ่านเงื่อนไข Validation (เช่น รหัสผ่านใหม่สั้นเกินไป, รูปแบบ Role ไม่ถูกต้อง)

---

## 3. Auth Endpoints (`/api/auth`)

### 3.1 POST `/api/auth/login`
เข้าสู่ระบบด้วย Username และ Password

*   **Auth Required:** No (Public)
*   **Request Body:**
    ```json
    {
      "username": "somchai.it",
      "password": "Password123!"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "username": "somchai.it",
        "name": "Somchai Jaidee",
        "role": "ITStaff",
        "requiresPasswordChange": false
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Username หรือ Password ไม่ถูกต้อง (`"Invalid credentials"`)
    *   `403 Forbidden`: บัญชีถูกปิดการใช้งาน (`"Account is deactivated"`)

---

### 3.2 POST `/api/auth/logout`
ออกจากระบบและล้างสถานะ

*   **Auth Required:** Yes (`Bearer <token>`)
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

---

### 3.3 GET `/api/auth/me`
ดึงข้อมูล Profile ของผู้ใช้ปัจจุบันที่กำลังล็อกอิน

*   **Auth Required:** Yes (`Bearer <token>`)
*   **Success Response (200 OK):**
    ```json
    {
      "user": {
        "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "username": "somchai.it",
        "name": "Somchai Jaidee",
        "role": "ITStaff",
        "requiresPasswordChange": false
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Token ไม่ถูกต้องหรือหมดอายุ
    *   `403 Forbidden`: บัญชีผู้ใช้ถูกปิดการใช้งาน

---

### 3.4 POST `/api/auth/change-password`
เปลี่ยนรหัสผ่านของผู้ใช้ (ใช้สำหรับทั้งกรณีบังคับเปลี่ยนครั้งแรกและผู้ใช้เปลี่ยนเอง)

*   **Auth Required:** Yes (`Bearer <token>`)
*   **Request Body:**
    ```json
    {
      "currentPassword": "TempPassword123!",
      "newPassword": "NewSecurePassword456!"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Password changed successfully",
      "user": {
        "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "username": "somchai.it",
        "name": "Somchai Jaidee",
        "role": "ITStaff",
        "requiresPasswordChange": false
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: รหัสผ่านปัจจุบัน (`currentPassword`) ไม่ถูกต้อง
    *   `422 Unprocessable Entity`: รหัสผ่านใหม่ไม่ตรงตามข้อกำหนดความปลอดภัย (เช่น ความยาวน้อยกว่า 8 ตัวอักษร)

---

## 4. Admin Endpoints (`/api/admin`)
*ทุก Endpoint ในส่วนนี้ต้องแนบ Bearer Token และผู้ใช้ต้องมีบทบาท `Administrator` เท่านั้น*

### 4.1 GET `/api/admin/users`
ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ พร้อมรองรับการค้นหาและแบ่งหน้า

*   **Query Parameters:**
    *   `search` (string, optional): ค้นหาจาก username หรือ name
    *   `role` (string, optional): `Requester`, `ITStaff`, `Administrator`
    *   `isActive` (boolean, optional): `true` หรือ `false`
    *   `page` (integer, optional, default: 1)
    *   `limit` (integer, optional, default: 10, max: 50)
*   **Success Response (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "username": "john.doe",
          "name": "John Doe",
          "role": "Requester",
          "isActive": true,
          "requiresPasswordChange": false,
          "createdAt": "2026-08-30T14:20:00.000Z"
        }
      ],
      "meta": {
        "currentPage": 1,
        "itemsPerPage": 10,
        "totalItems": 45,
        "totalPages": 5
      }
    }
    ```

---

### 4.2 POST `/api/admin/users`
สร้างผู้ใช้ใหม่ในระบบ

*   **Request Body:**
    ```json
    {
      "username": "suda.admin",
      "name": "Suda Admin",
      "role": "Administrator",
      "temporaryPassword": "InitialPass123!"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "id": "usr_c34eef5a-8f90-4c12-98ab-3c4d5e6f7a8b",
      "username": "suda.admin",
      "name": "Suda Admin",
      "role": "Administrator",
      "isActive": true,
      "requiresPasswordChange": true,
      "createdAt": "2026-09-12T10:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `409 Conflict`: Username นี้มีอยู่แล้วในระบบ (`"Username already exists"`)
    *   `422 Unprocessable Entity`: ข้อมูลที่ส่งมาไม่ถูกต้อง

---

### 4.3 PATCH `/api/admin/users/:id`
อัปเดตข้อมูลผู้ใช้ หรือเปิด/ปิดการใช้งานบัญชี (`isActive`)

*   **Request Body:**
    ```json
    {
      "name": "Suda Admin (Superuser)",
      "role": "Administrator",
      "isActive": false
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": "usr_c34eef5a-8f90-4c12-98ab-3c4d5e6f7a8b",
      "username": "suda.admin",
      "name": "Suda Admin (Superuser)",
      "role": "Administrator",
      "isActive": false,
      "requiresPasswordChange": true
    }
    ```

---

### 4.4 PATCH `/api/admin/users/:id/password`
แอดมินทำการรีเซ็ตรหัสผ่านของผู้ใช้

*   **Request Body:**
    ```json
    {
      "newPassword": "ResetPass999!"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Password reset successfully. User must change password upon next login.",
      "requiresPasswordChange": true
    }
    ```

---

## 5. IT Staff Endpoints (`/api/staff`)
*ทุก Endpoint ในส่วนนี้ต้องแนบ Bearer Token และผู้ใช้ต้องมีบทบาท `ITStaff` หรือ `Administrator` เท่านั้น*

### 5.1 GET `/api/staff/tickets`
ดึงรายการตั๋วทั้งหมดในระบบสำหรับหน้า IT Staff Queue

*   **Query Parameters:**
    *   `search` (string, optional): ค้นหาจาก ticketNumber หรือ summary
    *   `status` (string, optional): `New`, `Open`, `InProgress`, `Resolved`, `Closed`
    *   `priority` (string, optional): `Low`, `Medium`, `High`
    *   `ownerId` (string, optional): คัดกรองตามเจ้าของตั๋ว
    *   `unassigned` (boolean, optional): ถ้าเป็น `true` จะดึงเฉพาะตั๋วที่ยังไม่มีเจ้าของ (`ownerId IS NULL`)
    *   `page` (integer, optional, default: 1)
    *   `limit` (integer, optional, default: 10, max: 50)
*   **Success Response (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "tkt_12345678",
          "ticketNumber": "TKT-0042",
          "summary": "VPN connection drops frequently",
          "status": "Open",
          "requestedPriority": "Medium",
          "itPriority": "High",
          "owner": {
            "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            "name": "Somchai Jaidee"
          },
          "requester": {
            "id": "usr_11112222-3333-4444-5555-666677778888",
            "name": "John Doe"
          },
          "category": { "id": "cat_1", "name": "Network" },
          "relatedSystem": { "id": "sys_1", "name": "Cisco AnyConnect" },
          "createdAt": "2026-09-12T08:30:00.000Z"
        }
      ],
      "meta": {
        "currentPage": 1,
        "itemsPerPage": 10,
        "totalItems": 18,
        "totalPages": 2
      }
    }
    ```

---

### 5.2 GET `/api/staff/tickets/:id`
ดึงข้อมูลรายละเอียดตั๋วสำหรับเจ้าหน้าที่ไอที (รวมไฟล์แนบ ประวัติ และข้อมูลเจ้าของ)

*   **Success Response (200 OK):** คืนค่าข้อมูล Ticket อย่างละเอียด พร้อมข้อมูล Requester, Owner, Category, RelatedSystem และ Attachments ทั้งหมด

---

### 5.3 PATCH `/api/staff/tickets/:id/owner`
เคลมตั๋วเป็นของตนเอง หรือส่งต่องานให้เจ้าหน้าที่ไอทีท่านอื่น

*   **Request Body:**
    ```json
    {
      "ownerId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": "tkt_12345678",
      "ticketNumber": "TKT-0042",
      "ownerId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "status": "Open"
    }
    ```

---

### 5.4 PATCH `/api/staff/tickets/:id/priority`
ปรับระดับความสำคัญของตั๋วตามมุมมองของไอที (`itPriority`)

*   **Request Body:**
    ```json
    {
      "itPriority": "High"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": "tkt_12345678",
      "ticketNumber": "TKT-0042",
      "itPriority": "High"
    }
    ```

---

### 5.5 PATCH `/api/staff/tickets/:id/status`
ปรับสถานะวงจรการทำงานของตั๋ว

*   **Request Body:**
    ```json
    {
      "status": "Resolved"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": "tkt_12345678",
      "ticketNumber": "TKT-0042",
      "status": "Resolved"
    }
    ```

---

## 6. Shared & Requester Ticket Endpoints (`/api/tickets`)

### 6.1 GET `/api/tickets/:id/comments`
ดึงรายการความคิดเห็นและบันทึกช่วยจำของตั๋ว
*   **Security Gating (BR-04):**
    *   **Requester:** จะได้รับเฉพาะคอมเมนต์ที่มี `type: "PUBLIC"` เท่านั้น (บันทึกที่เป็น `INTERNAL` จะถูกคัดกรองทิ้งออกจาก SQL Query)
    *   **IT Staff & Admin:** จะได้รับทั้ง `type: "PUBLIC"` และ `type: "INTERNAL"`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "cmt_11223344",
        "ticketId": "tkt_12345678",
        "type": "PUBLIC",
        "content": "เจ้าหน้าที่กำลังตรวจสอบการเชื่อมต่อที่ Core Switch ครับ",
        "author": {
          "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "name": "Somchai Jaidee",
          "role": "ITStaff"
        },
        "createdAt": "2026-09-12T09:15:00.000Z"
      },
      {
        "id": "cmt_55667788",
        "ticketId": "tkt_12345678",
        "type": "INTERNAL",
        "content": "Switch port 12 มีสัญญาณ CRC Error สูง อาจต้องเปลี่ยนสาย Patch Cord",
        "author": {
          "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "name": "Somchai Jaidee",
          "role": "ITStaff"
        },
        "createdAt": "2026-09-12T09:16:00.000Z"
      }
    ]
    ```

---

### 6.2 POST `/api/tickets/:id/comments`
สร้างความคิดเห็นใหม่บนตั๋ว
*   **Security Rules:**
    *   Requester สามารถสร้างได้เฉพาะ `type: "PUBLIC"` บนตั๋วของตนเองเท่านั้น
    *   IT Staff และ Admin สามารถสร้างได้ทั้ง `type: "PUBLIC"` และ `type: "INTERNAL"`
    *   หาก Requester พยายามส่ง Request ด้วย `type: "INTERNAL"` ระบบจะตอบกลับ `403 Forbidden` ทันที
*   **Request Body:**
    ```json
    {
      "content": "ได้ลองรีสตาร์ท Router แล้ว แต่ยังใช้งานไม่ได้ครับ",
      "type": "PUBLIC"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "id": "cmt_99001122",
      "ticketId": "tkt_12345678",
      "type": "PUBLIC",
      "content": "ได้ลองรีสตาร์ท Router แล้ว แต่ยังใช้งานไม่ได้ครับ",
      "author": {
        "id": "usr_11112222-3333-4444-5555-666677778888",
        "name": "John Doe",
        "role": "Requester"
      },
      "createdAt": "2026-09-12T09:20:00.000Z"
    }
    ```

---

### 6.3 PATCH `/api/tickets/:id/resolution-flag`
Requester ส่งสัญญาณว่าปัญหาได้รับการแก้ไขแล้ว ("Appears Resolved") ตามเงื่อนไข BR-05
*   **Auth Required:** Yes (เฉพาะ Requester เจ้าของตั๋ว)
*   **Request Body:**
    ```json
    {
      "appearsResolved": true
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": "tkt_12345678",
      "ticketNumber": "TKT-0042",
      "appearsResolved": true,
      "message": "Resolution confirmed by requester"
    }
    ```
