import { test, expect } from '@playwright/test';

test.describe('Lab 2: Requester Ticket Flow (Issue 4)', () => {
  // Test file uses localhost:5173 as the frontend URL assuming default Vite dev server port.
  test.use({ baseURL: 'http://localhost:5173' });

  test('Full ticket creation, filtering, and attachment management flow', async ({ page }) => {
    // 1. เข้าหน้าเว็บ เลือก Development Requester
    await page.goto('/');
    
    // รอโหลดหน้า Dev Requester Selector โดยใช้ Role
    await expect(page.getByRole('heading', { name: 'Select Requester (Dev Mode)' })).toBeVisible();
    
    // คลิกปุ่ม Requester ชื่อ "John Doe"
    await page.getByRole('button', { name: 'John Doe' }).click();
    
    // ยืนยันว่าเข้าสู่หน้า My Tickets โดยใช้ getByRole
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible();

    // 2. ไปหน้า Create Ticket, กรอกข้อมูล, แนบไฟล์, และกด Submit
    await page.getByRole('button', { name: '+ Create New Ticket' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Ticket' })).toBeVisible();

    // เลือก Category อันแรก
    await page.getByRole('combobox').nth(0).selectOption({ index: 1 });
    
    // เลือก Related System อันแรก
    await page.getByRole('combobox').nth(1).selectOption({ index: 1 });

    // เลือก Priority
    await page.getByRole('combobox').nth(2).selectOption('Medium');

    // กรอก Summary และ Description โดยใช้ Placeholder
    const uniqueSummary = `E2E Test Ticket ${Date.now()}`;
    await page.getByPlaceholder('Brief summary of the issue (Max 100 chars)').fill(uniqueSummary);
    await page.getByPlaceholder('Detailed description...').fill('This ticket is created by automated E2E test to verify Issue 4.');

    // แนบไฟล์ (จำลองการอัปโหลดไฟล์)
    await page.locator('input[type="file"]').setInputFiles({
      name: 'e2e-test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%EOF\n')
    });

    // กด Submit
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Ticket' }).click();

    // 3. ตรวจสอบว่าระบบพากลับมาหน้า My Tickets
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible();
    
    // 4. ทดสอบพิมพ์คำค้นหา (Search) 
    await page.getByPlaceholder('Search Ticket # or Summary...').fill(uniqueSummary);
    
    // รอ debounce 500ms
    await page.waitForTimeout(600);
    
    // ต้องเจอ Ticket ใหม่ที่เพิ่งสร้างในตาราง (ระบุเป็น td เพื่อป้องกัน Strict Mode Violation กับช่อง Search)
    await expect(page.locator('td').filter({ hasText: uniqueSummary }).first()).toBeVisible();

    // 5. กด View เข้าไปหน้า Ticket Detail
    await page.getByRole('button', { name: 'View' }).first().click();
    await expect(page.getByText(uniqueSummary).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();
    await expect(page.getByText(/\.pdf$/i).first()).toBeVisible();

    // 6. ทดสอบคลิกดาวน์โหลดไฟล์ (เช็คว่าไม่เจอ 403/404)
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    await download.delete();

    // ทดสอบกดลบไฟล์
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).first().click();

    // ตรวจสอบว่าชื่อไฟล์หายไป
    await expect(page.getByText(/\.pdf$/i)).not.toBeVisible();
    await expect(page.getByText('No attachments')).toBeVisible();
  });
});
