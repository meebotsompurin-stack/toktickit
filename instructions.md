# Antigravity Development Rules 

## Tech Stack
- Backend: Node.js with TypeScript
- Framework: Express.js
- Database: PostgreSQL
- ORM: Prisma
- Storage: Local File System (Multer for file uploads)

## Coding Standards & Architecture
1. **Strict TypeScript:** Use strict typing. Avoid `any` whenever possible. Define clear Interfaces/Types for requests and responses.
2. **Modular Architecture:** Separate concerns. Use routes, controllers, and services (e.g., `ticket.routes.ts`, `ticket.controller.ts`, `ticket.service.ts`).
3. **Error Handling:** Use a centralized error-handling middleware. Always return errors in standard JSON format.
4. **API Compliance:** You MUST strictly follow the exact endpoints, request parameters, and response schemas defined in `docs/lab-02/api-spec.md`.
5. **Business Rules:** You MUST strictly enforce all rules defined in `docs/lab-02/specification.md` (e.g., Soft-removal, MIME type checking, Required headers).

## Security & Validation Rules
- All protected endpoints must validate the `X-Requester-Id` header.
- File uploads MUST be validated using real MIME type checking (e.g., `file-type` library), NOT just file extensions.
- Soft-deleted attachments must be completely hidden from normal GET requests.