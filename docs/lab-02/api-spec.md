# Lab 2 API Contract

## Global Headers
*   **Authentication & Security:** ทุก Endpoint ที่ต้องการตรวจสอบสิทธิ์ผู้ใช้งาน จะต้องส่งไอดีผ่าน **HTTP Header** ที่ชื่อว่า `X-Requester-Id` เสมอ (ห้ามส่งผ่าน Request Body หรือ Query Parameters เด็ดขาด) เพื่อป้องกันการสวมรอย
*   **File Upload Security:** ระบบจะใช้ไลบรารี `file-type` ตรวจสอบ MIME Type จากเนื้อหาไฟล์จริงแบบ Magic Bytes (ไม่อนุญาตให้ตรวจสอบแค่จากนามสกุลไฟล์)

## 1. Base API URL
`/api`

## 2. Endpoints
### 2.1 Get Active Categories
*   **Method:** `GET`
*   **Path:** `/categories`
*   **Required Header:** `X-Requester-Id`

### 2.2 Get Active Related Systems
*   **Method:** `GET`
*   **Path:** `/related-systems`
*   **Required Header:** `X-Requester-Id`

### 2.3 Get Active Development Requesters
*   **Method:** `GET`
*   **Path:** `/requesters`

### 2.4 Create a Ticket
*   **Method:** `POST`
*   **Path:** `/tickets`
*   **Required Header:** `X-Requester-Id`
*   **Request Body:** `categoryId`, `relatedSystemId`, `requestedPriority`, `summary`, `description`, `attachmentIds` *(ไม่มี `requesterId`)*

### 2.5 Get My Tickets (List)
*   **Method:** `GET`
*   **Path:** `/tickets`
*   **Required Header:** `X-Requester-Id`
*   **Query Params:** `search`, `categoryId`, `priority`, `status`, `page` (default: 1), `limit` (default: 10, max: 50)

### 2.6 Upload Attachment
*   **Method:** `POST`
*   **Path:** `/tickets/:ticketId/attachments`
*   **Required Header:** `X-Requester-Id`
*   **Request:** `multipart/form-data` (ส่งเฉพาะ field `file` ในรูปแบบ form-data ห้ามส่ง `requesterId` ใน body)
*   **Validation:** Backend ต้องตรวจประเภทไฟล์จาก MIME Type ของไฟล์จริงๆ ไม่อนุญาตให้ตรวจสอบแค่จากนามสกุลไฟล์

### 2.7 Soft-remove Attachment
*   **Method:** `DELETE`
*   **Path:** `/attachments/:id`
*   **Required Header:** `X-Requester-Id`

## 3. Standard Error Responses

### 400 Bad Request (Validation Error)
ตัวอย่าง Schema กรณีที่มี Error รายฟิลด์ (Field-level validation):
```json
{
  "error": "Validation Failed",
  "details": [
    { "field": "summary", "message": "Summary must not exceed 100 characters" },
    { "field": "categoryId", "message": "Category is required" }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "X-Requester-Id header is required or invalid"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

## 4. Pagination Rules (สำหรับ GET /tickets)
*   **Default Params:** `page=1`, `limit=10`
*   **Maximum Limit:** `limit` สูงสุดไม่เกิน `50` ต่อหน้า
*   **Response Metadata:** ต้องส่งกลับมาพร้อม Object ตามรูปแบบ:
```json
{
  "currentPage": 1,
  "itemsPerPage": 10,
  "totalItems": 42,
  "totalPages": 5
}
```

## 5. HTTP Status Codes
| Code | Description |
| :--- | :--- |
| **200 OK** | สำเร็จ |
| **201 Created** | สร้างข้อมูลใหม่สำเร็จ |
| **400 Bad Request** | ข้อมูลไม่ถูกต้อง หรืออัปโหลดไฟล์ผิดประเภท/ขนาดเกิน |
| **401 Unauthorized** | ไม่ได้ส่ง HTTP Header `X-Requester-Id` หรือข้อมูลไม่ถูกต้อง |
| **403 Forbidden** | ไม่มีสิทธิ์เข้าถึง (เช่น ไม่ใช่เจ้าของ Ticket หรือพยายามลบไฟล์ถาวรโดยไม่ใช่ Admin) |
| **404 Not Found** | ไม่พบข้อมูล |