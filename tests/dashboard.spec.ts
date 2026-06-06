import { test, expect } from '@playwright/test';

test.describe('Genius Board - Core Authentication & Routing', () => {
  test('should redirect from root (/) to login page and render title', async ({ page }) => {
    // Navigate to root route
    await page.goto('/');

    // Check redirection to /login
    await expect(page).toHaveURL(/.*\/login/);

    // Verify main app heading is present (CardTitle renders as a div)
    const heading = page.locator('div', { hasText: 'Genius Board' }).first();
    await expect(heading).toBeVisible();
  });

  test('should display translation matching the selected language', async ({ page }) => {
    await page.goto('/login');

    // Default language is English. Check standard English labels.
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toHaveText('Email Address');

    // Open language dropdown
    await page.click('button:has-text("EN")');
    
    // Select Myanmar language (MM)
    await page.click('span:has-text("MM")');

    // Confirm that the UI switches and shows Burmese translation (Email Address -> အီးမေးလ် လိပ်စာ)
    await expect(emailLabel).toHaveText('အီးမေးလ် လိပ်စာ');
  });

  test('should validate input fields on form submission', async ({ page }) => {
    await page.goto('/login');

    // Clear inputs in case autocomplete or default values filled them
    await page.fill('#email', '');
    await page.fill('#password', '');
    await page.fill('#geminiKey', '');

    // Click submit button directly without filling values
    await page.click('button[type="submit"]');

    // Assert validation errors display
    const emailError = page.locator('p:has-text("Email is required")');
    const passwordError = page.locator('p:has-text("Password is required")');
    const keyError = page.locator('p:has-text("Gemini API Key is required")');

    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
    await expect(keyError).toBeVisible();
  });
});
