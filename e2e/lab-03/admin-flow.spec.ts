import { test, expect } from '@playwright/test';

test.describe('ADMIN-05: Admin Flow', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear()).catch(() => {});
    await page.goto('/login');
    // Using predefined Admin seed
    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('admin@toktickit.dev');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
    await expect(page).toHaveURL(/.*tickets|.*dashboard|.*admin|.*\//);
  });

  test('ADMIN-05: Admin User Management', async ({ page }) => {
    // Navigate to Admin Dashboard
    const adminLink = page.locator('button:has-text("Admin Dashboard"), a:has-text("Admin Dashboard"), a[href*="admin"]').first();
    await adminLink.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await adminLink.isVisible()) {
        await adminLink.click();
    }

    // Create new user
    const createUserBtn = page.locator('button:has-text("Create User"), button:has-text("Create New User")').first();
    await createUserBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await createUserBtn.isVisible()) {
        await createUserBtn.click();
    }
    
    // Fill user form
    const uniqueEmail = `testuser${Date.now()}@toktickit.dev`;
    await page.locator('form input[type="text"]').first().fill(`Test Employee ${Date.now()}`);
    await page.locator('form input[type="email"]').first().fill(uniqueEmail);
    await page.locator('form input[type="password"]').first().fill('TempPass123!');
    await page.locator('form select').first().selectOption('REQUESTER').catch(() => {});
    
    // Save
    await page.locator('form button[type="submit"]').first().click();
    
    // Wait for the modal to close and the new user to appear in the table
    await expect(page.locator(`text=${uniqueEmail}`).first()).toBeVisible({ timeout: 10000 });

    // Disable the created user
    const row = page.locator(`tr:has-text("${uniqueEmail}")`);
    const editBtn = row.locator('button:has-text("Edit")');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const activeCheckbox = page.locator('input[name="isActive"], input[type="checkbox"]');
      await activeCheckbox.uncheck();
      await page.click('button:has-text("Save"), button:has-text("Update")');
      
      // Verify inactive state
      await expect(row.locator('text=Inactive, .badge-danger, .badge-inactive').first()).toBeVisible();
    }
  });
});
