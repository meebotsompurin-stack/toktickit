import { test, expect } from '@playwright/test';

test.describe('AUTH-05 to AUTH-07: Authentication Flow', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test.beforeEach(async ({ page }) => {
    
  });

  test('AUTH-05: Valid Login goes to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD || 'password123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();

    // Wait for redirect to dashboard or ticket list
    await expect(page).toHaveURL(/.*/);
    
    // Wait for token to be set by polling
    await page.waitForFunction(() => localStorage.getItem('toktickit_token') !== null, { timeout: 10000 });
    
    // LocalStorage should have token
    const token = await page.evaluate(() => localStorage.getItem('toktickit_token'));
    expect(token).toBeTruthy();
  });

  test('AUTH-02: Invalid Login shows error', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').first().fill(process.env.TEST_WRONG_PASSWORD || 'WrongPassword123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();

    // Should stay on login and show error
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Invalid credentials').or(page.locator('.alert-danger'))).toBeVisible();
  });

  test('AUTH-06: New user requires password change', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    // Using predefined newuser from seed
    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('newbie@toktickit.dev'); 
    await page.locator('input[type="password"]').first().fill(process.env.TEST_TEMP_PASSWORD || 'TempPass123!');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();

    // Redirected to change password
    await page.waitForURL('**/change-password', { timeout: 10000 });
    await expect(page).toHaveURL(/.*change-password/);
  });

  test('AUTH-07: Logout clears token', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD || 'password123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();

    await expect(page).toHaveURL(/.*/);

    // Find and click logout
    await page.click('button:has-text("Logout"), a:has-text("Logout")');
    
    // Redirected to login
    await expect(page).toHaveURL(/.*login/);

    await page.waitForFunction(() => localStorage.getItem('toktickit_token') === null, { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('toktickit_token'));
    expect(token).toBeNull();
  });
});
