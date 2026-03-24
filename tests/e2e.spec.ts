import { test, expect } from '@playwright/test';

test('unauthenticated landing', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Tachikoma Quest/);
});

test('wallet nonce auth', async ({ page }) => {
  // Test implementation
});
