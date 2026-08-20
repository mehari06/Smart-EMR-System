import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login shows dashboard content', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'bereketmehari68@gmail.com');
    await page.fill('input[type="password"]', 'admin123456');
    
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('wrong password stays on login page', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'bereketmehari68@gmail.com');
    await page.fill('input[type="password"]', 'WrongPassword123');
    
    await page.click('button[type="submit"]');
    
    // Just verify we're still on login page
    await expect(page).toHaveURL(/login/);
  });
});