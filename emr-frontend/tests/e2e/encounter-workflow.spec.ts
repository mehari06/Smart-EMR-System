import { test, expect } from '@playwright/test';

test.describe('Clinical Encounter Workflow', () => {
  test('doctor can view encounters', async ({ page }) => {
    // Login as doctor
    await page.goto('/login');
    await page.fill('input[type="email"]', 'doctor@test.com');
    await page.fill('input[type="password"]', 'Doctor@123');
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.click('button[type="submit"]'),
    ]);

    // Navigate to Encounters
    await page.click('text=Encounters');

    // Verify encounters page
    await expect(page.locator('h1')).toContainText('Clinical Encounters');
  });
});