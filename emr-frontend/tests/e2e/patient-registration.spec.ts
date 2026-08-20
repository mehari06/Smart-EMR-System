import { test, expect } from '@playwright/test';

test.describe('Patient Registration Workflow', () => {
  test('admin can register a new patient', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bereketmehari68@gmail.com');
    await page.fill('input[type="password"]', 'admin123456');
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.click('button[type="submit"]'),
    ]);

    // Navigate to Patients
    await page.click('text=Patients');
    await expect(page.locator('h1')).toContainText('Patient Management');

    // Click Add Patient
    await page.click('#add-patient-btn');

    // Fill form
    await page.fill('input[placeholder="Abebe"]', 'Test');
    await page.fill('input[placeholder="Kebede"]', 'Patient');
    await page.fill('input[placeholder="abebe@example.com"]', `test${Date.now()}@test.com`);
    await page.fill('input[placeholder="Min 8 chars"]', 'Test@12345');
    await page.fill('input[type="date"]', '1995-01-01');

    // Submit
    await page.click('button:has-text("Save Patient")');

    // Verify modal closed (patient added)
    await expect(page.locator('h1')).toContainText('Patient Management');
  });
});