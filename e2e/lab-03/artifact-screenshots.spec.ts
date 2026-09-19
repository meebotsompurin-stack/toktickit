import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const artifactDirs = [
  'artifacts/lab-03/screenshots/authentication',
  'artifacts/lab-03/screenshots/staff-queue',
  'artifacts/lab-03/screenshots/staff-ticket-detail',
  'artifacts/lab-03/screenshots/user-management',
];

test.beforeAll(() => {
  for (const dir of artifactDirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function captureScreenshot(page: Page, flow: string, viewportName: string, stateName: string) {
  const filePath = path.join('artifacts', 'lab-03', 'screenshots', flow, `${viewportName}-${stateName}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
}

// Resilient selectors
const sel = {
  email: 'input[type="email"], input[placeholder*="email" i], input[placeholder*="toktickit.dev"]',
  pass: 'input[type="password"], input[placeholder*="••••"]',
  signIn: 'button:has-text("Sign In"), button:has-text("Sign in"), button[type="submit"]',
  staffQueue: 'button:has-text("Staff Queue"), button:has-text("My Queue"), a:has-text("Staff Queue")',
  adminDash: 'button:has-text("Admin Dashboard"), a:has-text("Admin Dashboard")',
  search: 'input[placeholder*="Ticket #"], input[placeholder*="Summary"], input[type="text"]',
  viewDetails: 'button:has-text("View Details")',
  claim: 'button:has-text("Claim")',
  statusSelect: 'select',
  publicNotes: 'button:has-text("Public Comments")',
  internalNotes: 'button:has-text("Internal Notes"), button:has-text("Internal")'
};

async function doLogin(page: Page, email: string, pass: string) {
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
  await page.goto('/login');
  await page.locator(sel.email).first().waitFor({ state: 'visible', timeout: 10000 });
  await page.locator(sel.email).first().fill(email);
  await page.locator(sel.pass).first().fill(pass);
  await page.locator(sel.signIn).first().click();
}

for (const vp of viewports) {
  test.describe(`Viewport: ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('1. Authentication Flow', async ({ page }) => {
      // 1.1 Invalid Login
      await doLogin(page, 'invalid@toktickit.dev', 'wrongpassword');
      await page.waitForTimeout(1000); 
      await captureScreenshot(page, 'authentication', vp.name, 'invalid-login');

      // 1.2 Mandatory Password Change
      await doLogin(page, 'newbie@toktickit.dev', 'TempPass123!');
      await page.waitForURL('**/change-password', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000); 
      await captureScreenshot(page, 'authentication', vp.name, 'mandatory-password-change');

      // 1.3 Valid Login
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      await page.locator(sel.staffQueue).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'authentication', vp.name, 'valid-login');
    });

    test('2. Staff Queue Flow', async ({ page }) => {
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      const queueBtn = page.locator(sel.staffQueue).first();
      await queueBtn.waitFor({ state: 'visible', timeout: 15000 });
      await queueBtn.click();
      
      await page.waitForTimeout(2000); 
      await captureScreenshot(page, 'staff-queue', vp.name, 'default');

      const searchInput = page.locator(sel.search).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('VPN');
        await page.waitForTimeout(1000);
        await captureScreenshot(page, 'staff-queue', vp.name, 'search');

        await searchInput.fill('NON_EXISTENT_TICKET_9999');
        await page.waitForTimeout(1000);
        await captureScreenshot(page, 'staff-queue', vp.name, 'empty');
      }
    });

    test('3. Staff Ticket Detail Flow', async ({ page }) => {
      await doLogin(page, 'piyanuch.staff@toktickit.dev', 'password123');
      
      const queueBtn = page.locator(sel.staffQueue).first();
      await queueBtn.waitFor({ state: 'visible', timeout: 15000 });
      await queueBtn.click();
      await page.waitForTimeout(2000);

      const viewDetailsBtn = page.locator(sel.viewDetails).first();
      if (await viewDetailsBtn.isVisible()) {
        await viewDetailsBtn.click();
        await page.waitForTimeout(2000); 

        const claimBtn = page.locator(sel.claim).first();
        if (await claimBtn.isVisible()) {
          await captureScreenshot(page, 'staff-ticket-detail', vp.name, 'ticket-claim-available');
          await claimBtn.click();
          await page.waitForTimeout(1000);
          await captureScreenshot(page, 'staff-ticket-detail', vp.name, 'ticket-claim-success');
        }

        const statusSelect = page.locator(sel.statusSelect).first();
        if (await statusSelect.isVisible()) {
          await statusSelect.selectOption({ index: 1 }).catch(() => {});
          await page.waitForTimeout(1000);
          await captureScreenshot(page, 'staff-ticket-detail', vp.name, 'status-update');
        }

        const publicBtn = page.locator(sel.publicNotes).first();
        if (await publicBtn.isVisible()) {
          await publicBtn.click();
          await page.waitForTimeout(500);
        }
        await captureScreenshot(page, 'staff-ticket-detail', vp.name, 'public-notes');

        const internalBtn = page.locator(sel.internalNotes).first();
        if (await internalBtn.isVisible()) {
          await internalBtn.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, 'staff-ticket-detail', vp.name, 'internal-notes');
        }
      }
    });

    test('4. User Management Flow', async ({ page }) => {
      await doLogin(page, 'admin@toktick.dev', 'password123');
      
      const adminDashBtn = page.locator(sel.adminDash).first();
      await adminDashBtn.waitFor({ state: 'visible', timeout: 15000 });
      await adminDashBtn.click();
      await page.waitForTimeout(2000);

      await captureScreenshot(page, 'user-management', vp.name, 'default');

      const createUserBtn = page.locator('button:has-text("Create User"), button:has-text("Create New User")').first();
      if (await createUserBtn.isVisible()) {
        await createUserBtn.click();
        await page.waitForTimeout(1000); 
        
        const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').last();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          await captureScreenshot(page, 'user-management', vp.name, 'creation-validation-error');
        }
      }
    });
  });
}
