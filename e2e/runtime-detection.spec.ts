import { test, expect } from '@playwright/test';

test.describe('Runtime Detection', () => {
  test('should display welcome screen on first load', async ({ page }) => {
    await page.goto('/');
    
    // Should show welcome screen
    await expect(page.locator('h1')).toContainText('Welcome to Harbor Master');
    
    // Should have refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test('should detect runtimes when refresh is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    
    // Wait for detection to complete (max 2 seconds)
    await page.waitForTimeout(2000);
    
    // Should show either runtimes or no runtimes message
    const hasRuntimes = await page.locator('[data-testid="runtime-selector"]').isVisible().catch(() => false);
    const hasNoRuntimes = await page.locator('text=No container runtimes detected').isVisible().catch(() => false);
    
    expect(hasRuntimes || hasNoRuntimes).toBeTruthy();
  });

  test('should detect runtimes via keyboard shortcut', async ({ page }) => {
    await page.goto('/');
    
    // Press Cmd+R (Meta+R works on both Mac and other platforms)
    await page.keyboard.press('Meta+R');
    
    // Wait for detection to complete
    await page.waitForTimeout(2000);
    
    // Should show either runtimes or no runtimes message
    const hasRuntimes = await page.locator('[data-testid="runtime-selector"]').isVisible().catch(() => false);
    const hasNoRuntimes = await page.locator('text=No container runtimes detected').isVisible().catch(() => false);
    
    expect(hasRuntimes || hasNoRuntimes).toBeTruthy();
  });

  test('should show toast notification after detection', async ({ page }) => {
    await page.goto('/');
    
    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    
    // Should show a toast notification
    const toast = page.locator('[role="alert"]').or(page.locator('.toast'));
    await expect(toast).toBeVisible({ timeout: 3000 });
    
    // Toast should contain success or info message
    const toastText = await toast.textContent();
    expect(toastText).toMatch(/detected|found|no runtimes/i);
  });

  test('should display runtime information when detected', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    
    // Wait for detection
    await page.waitForTimeout(2000);
    
    // If runtimes are detected, verify they have required information
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]');
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should show runtime type (Docker or Podman)
      const hasDocker = await page.locator('text=/Docker/i').isVisible().catch(() => false);
      const hasPodman = await page.locator('text=/Podman/i').isVisible().catch(() => false);
      
      expect(hasDocker || hasPodman).toBeTruthy();
      
      // Should show version information
      const hasVersion = await page.locator('text=/\\d+\\.\\d+/').isVisible().catch(() => false);
      expect(hasVersion).toBeTruthy();
    }
  });

  test('should handle detection errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    
    // Wait for detection to complete
    await page.waitForTimeout(3000);
    
    // Application should not crash - page should still be responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Should show either runtimes, no runtimes message, or error message
    const hasContent = await page.locator('h1, h2, [role="alert"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });
});
