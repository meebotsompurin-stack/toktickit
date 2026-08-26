# Lab 2 API Contract

## Global Headers
*   **Authentication:** ทุก API Request ต้องส่ง HTTP Header ชื่อ `X-Requester-Id` เสมอ เพื่อระบุตัวตนและป้องกันการสวมรอย (Spoofing)

## 1. Base API URL
`/api`

## 2. Endpoints
### 2.1 Get Active Categories
*   **Method:** `GET`
*   **Path:** `/categories`
*   **Response (200 OK):** คืนค่ารายการ Category ทั้งหมดที่ใช้งานได้

### 2.2 Get Active Related Systems
*   **Method:** `GET`
*   **Path:** `/related-systems`
*   **Response (200 OK):** คืนค่ารายการ Related System ทั้งหมดที่ใช้งานได้

### 2.3 Get Active Development Requesters
*   **Method:** `GET`
*   **Path:** `/requesters`
*   **Response (200 OK):** คืนค่ารายการ Development Requesters ทั้งหมดที่ Status = Active เพื่อนำไปแสดงในหน้าเลือก User

### 2.4 Create a Ticket
*   **Method:** `POST`
*   **Path:** `/tickets`
*   **Request Body:** `categoryId`, `relatedSystemId`, `requestedPriority`, `summary`, `description`, `attachmentIds`
*   **Response (201 Created):** คืนค่าข้อมูล Ticket ที่ถูกสร้างสำเร็จ พร้อม `ticketNumber` ที่ระบบเจนให้
*   **Response (400 Bad Request):** คืนค่าเมื่อข้อมูลไม่ครบหรือไม่ผ่าน Validation

### 2.5 Get My Tickets (List)
*   **Method:** `GET`
*   **Path:** `/tickets`
*   **Query Params:** `search`, `categoryId`, `priority`, `status`, `page` (default: 1), `limit` (default: 10, max: 50)
*   **Response (200 OK):** คืนค่ารายการ Ticket แบบมี Pagination

## 3. Standard Error Responses

### 400 Bad Request (Validation Error)
```json
{
  "error": "Validation Failed",
  "details": [
    { "field": "summary", "message": "Summary must not exceed 100 characters" }
  ]
}