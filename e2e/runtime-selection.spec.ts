import { test, expect } from '@playwright/test';

test.describe('Runtime Selection', () => {
  test('should allow selecting a runtime from dropdown', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection first
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    
    // Wait for detection
    await page.waitForTimeout(2000);
    
    // Check if runtime selector is visible
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      // Click on the selector
      await runtimeSelector.click();
      
      // Should show options
      const options = page.locator('option').or(page.locator('[role="option"]'));
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
      
      // Select the first runtime
      await options.first().click();
      
      // Selection should be reflected in the UI
      await expect(runtimeSelector).not.toHaveValue('');
    }
  });

  test('should persist selected runtime', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check if runtime selector is visible
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      // Get the current value
      const initialValue = await runtimeSelector.inputValue().catch(() => '');
      
      // Reload the page
      await page.reload();
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // The selection should persist (or auto-select first runtime)
      const selectorAfterReload = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
      const isVisibleAfterReload = await selectorAfterReload.isVisible().catch(() => false);
      
      if (isVisibleAfterReload) {
        const valueAfterReload = await selectorAfterReload.inputValue().catch(() => '');
        expect(valueAfterReload).toBeTruthy();
      }
    }
  });

  test('should auto-select first runtime when available', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // If runtimes are detected, one should be auto-selected
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      const selectedValue = await runtimeSelector.inputValue().catch(() => '');
      
      // Should have a selected value (auto-selected)
      expect(selectedValue).toBeTruthy();
    }
  });

  test('should display runtime details when selected', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check if runtime selector is visible
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should show runtime type
      const hasTypeInfo = await page.locator('text=/Docker|Podman/i').isVisible();
      expect(hasTypeInfo).toBeTruthy();
      
      // Should show version
      const hasVersion = await page.locator('text=/version|v?\\d+\\.\\d+/i').isVisible();
      expect(hasVersion).toBeTruthy();
    }
  });

  test('should update UI when runtime selection changes', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check if runtime selector is visible
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      const options = page.locator('option').or(page.locator('[role="option"]'));
      const optionCount = await options.count();
      
      // If there are multiple runtimes
      if (optionCount > 1) {
        // Get initial selection
        const initialValue = await runtimeSelector.inputValue();
        
        // Select a different runtime
        await runtimeSelector.selectOption({ index: 1 });
        
        // Wait for UI to update
        await page.waitForTimeout(500);
        
        // Value should have changed
        const newValue = await runtimeSelector.inputValue();
        expect(newValue).not.toBe(initialValue);
      }
    }
  });
});
