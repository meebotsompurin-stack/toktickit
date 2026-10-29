import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

const artifactDirs = [
  'artifacts/lab-04/screenshots/staff-dashboard',
  'artifacts/lab-04/screenshots/staff-queue',
  'artifacts/lab-04/screenshots/action-taken-form',
  'artifacts/lab-04/screenshots/ticket-resolution',
  'artifacts/lab-04/screenshots/admin-dashboard',
  'artifacts/lab-04/screenshots/requester-dashboard',
];

test.beforeAll(() => {
  for (const dir of artifactDirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function captureScreenshot(page: Page, flow: string, viewportName: string, stateName: string) {
  const filePath = path.join('artifacts', 'lab-04', 'screenshots', flow, `${viewportName}-${stateName}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function doLogin(page: Page, email: string, pass: string) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/login');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(pass);
  await page.locator('button:has-text("Sign In")').first().click();
}

for (const vp of viewports) {
  test.describe(`Lab 4 Visual QA - Viewport: ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('1. Staff Dashboard (Operational & Admin)', async ({ page }) => {
      // 1.1 IT Staff Operational Dashboard
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      const dashNav = page.locator('button:has-text("Dashboard")').first();
      await dashNav.waitFor({ state: 'visible', timeout: 10000 });
      await dashNav.click();
      await expect(page.getByRole('heading', { name: 'IT Operational Dashboard' })).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, 'staff-dashboard', vp.name, 'operational-overview');

      // 1.2 Administrator Dashboard with 5th Card
      await doLogin(page, 'admin@toktickit.dev', 'password123');
      const adminDashNav = page.locator('button:has-text("Dashboard")').first();
      await adminDashNav.waitFor({ state: 'visible', timeout: 10000 });
      await adminDashNav.click();
      await expect(page.getByRole('heading', { name: 'Administrator Dashboard' })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('TOTAL USER ACCOUNTS')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, 'admin-dashboard', vp.name, 'admin-overview');
    });

    test('2. Staff Queue with Applied Drill-Down Filter', async ({ page }) => {
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      const dashNav = page.locator('button:has-text("Dashboard")').first();
      await dashNav.waitFor({ state: 'visible', timeout: 10000 });
      await dashNav.click();

      // Click Unassigned Tickets drill-down
      await page.locator('button:has-text("View Queue")').first().click();
      await expect(page.getByRole('heading', { name: 'Staff Ticket Queue' })).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(800);
      await captureScreenshot(page, 'staff-queue', vp.name, 'filtered-unassigned');
    });

    test('3. Action Taken Form in Ticket Detail', async ({ page }) => {
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      const queueNav = page.locator('button:has-text("Staff Queue"), a:has-text("Staff Queue")').first();
      await queueNav.waitFor({ state: 'visible', timeout: 10000 });
      await queueNav.click();

      const viewDetailsBtn = page.locator('button:has-text("View Details")').first();
      await viewDetailsBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailsBtn.click();

      // Open Action Taken Form
      const recordBtn = page.locator('button:has-text("Record Action Taken")');
      await recordBtn.waitFor({ state: 'visible', timeout: 10000 });
      await recordBtn.click();

      // Pre-populate fields for visual verification
      await page.locator('#action-description').fill('Replaced high-speed transceiver on Core Switch 2.');
      await page.locator('#action-result').fill('Link restored at 10 Gbps with 0 error frames.');
      await page.locator('#action-followup-req').check();
      await page.locator('#action-followup-note').fill('Monitor CRC error counters over the weekend.');
      await page.locator('#action-attachment-notes').fill('syslog_capture.pcap attached');

      await page.waitForTimeout(500);
      await captureScreenshot(page, 'action-taken-form', vp.name, 'record-action-form');
    });

    test('4. Ticket Detail with Resolution and Conflict Alert', async ({ page }) => {
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      const queueNav = page.locator('button:has-text("Staff Queue"), a:has-text("Staff Queue")').first();
      await queueNav.waitFor({ state: 'visible', timeout: 10000 });
      await queueNav.click();

      const viewDetailsBtn = page.locator('button:has-text("View Details")').first();
      await viewDetailsBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailsBtn.click();

      // Simulate 409 Conflict Response to capture resolution alert
      await page.route('**/api/staff/tickets/*/status', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Concurrent modification conflict: version mismatch' }),
        });
      });

      const statusSelect = page.locator('#ticket-status-select');
      await statusSelect.waitFor({ state: 'visible', timeout: 10000 });
      const currentStatus = await statusSelect.inputValue();
      const allOptions = await statusSelect.locator('option').allInnerTexts();
      const targetOption = allOptions.find((o) => o !== currentStatus) || allOptions[0];
      await statusSelect.selectOption(targetOption);

      const conflictAlert = page.locator('div[role="alert"]').filter({ hasText: 'Concurrent Update Conflict' });
      await expect(conflictAlert).toBeVisible({ timeout: 10000 });

      await page.waitForTimeout(500);
      await captureScreenshot(page, 'ticket-resolution', vp.name, 'conflict-alert');

      await page.unroute('**/api/staff/tickets/*/status');
    });

    test('5. Requester Dashboard', async ({ page }) => {
      await doLogin(page, 'somchai.req@toktickit.dev', 'password123');
      const dashNav = page.locator('button:has-text("Dashboard")').first();
      await dashNav.waitFor({ state: 'visible', timeout: 10000 });
      await dashNav.click();
      await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, 'requester-dashboard', vp.name, 'requester-overview');
    });
  });
}
