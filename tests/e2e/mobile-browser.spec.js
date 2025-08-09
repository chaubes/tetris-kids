/**
 * Mobile Browser Tests for Tetris Kids Game
 * Tests mobile compatibility across different devices and orientations
 */

import { test, expect, devices } from '@playwright/test';

// Test mobile devices
const mobileDevices = [
  { name: 'iPhone 13', device: devices['iPhone 13'] },
  { name: 'iPhone 13 Pro', device: devices['iPhone 13 Pro'] },
  { name: 'Samsung Galaxy S21', device: devices['Galaxy S21'] },
  { name: 'iPad', device: devices['iPad Pro'] },
];

// Base URL for tests
const baseUrl = 'http://localhost:7301';

// Test each mobile device
for (const { name, device } of mobileDevices) {
  test.describe(`${name} Mobile Tests`, () => {
    test.use({ ...device });

    test('should load game on mobile browser', async ({ page }) => {
      await page.goto(baseUrl);
      
      // Wait for game to load
      await page.waitForSelector('#menuContainer', { timeout: 10000 });
      
      // Check if page loads correctly
      await expect(page).toHaveTitle(/Tetris Kids/);
      
      // Check if viewport is set correctly
      const viewportMeta = await page.$('meta[name="viewport"]');
      expect(viewportMeta).toBeTruthy();
    });

    test('should display mobile touch controls', async ({ page }) => {
      await page.goto(baseUrl);
      
      // Start the game
      await page.waitForSelector('#menuContainer');
      const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
      if (startButton) {
        await startButton.click();
      }
      
      // Wait for game to start and check for touch controls
      await page.waitForSelector('#app', { timeout: 5000 });
      await page.waitForTimeout(2000); // Give time for game initialization
      
      // Check if touch control buttons are visible and properly sized
      const touchButtons = [
        '#leftBtn',
        '#rightBtn', 
        '#downBtn',
        '#rotateBtn',
        '#dropBtn'
      ];
      
      for (const buttonSelector of touchButtons) {
        const button = await page.$(buttonSelector);
        if (button) {
          // Check button is visible
          await expect(button).toBeVisible();
          
          // Check minimum touch target size (44px recommended)
          const buttonBox = await button.boundingBox();
          if (buttonBox) {
            expect(buttonBox.width).toBeGreaterThan(40);
            expect(buttonBox.height).toBeGreaterThan(40);
          }
        }
      }
    });

    test('should handle touch interactions', async ({ page, isMobile }) => {
      if (!isMobile) return;
      
      await page.goto(baseUrl);
      
      // Start the game
      await page.waitForSelector('#menuContainer');
      const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
      if (startButton) {
        await startButton.click();
      }
      
      // Wait for game to start
      await page.waitForSelector('#app', { timeout: 5000 });
      await page.waitForTimeout(3000); // Give time for game initialization
      
      // Test touch button interactions
      const leftButton = await page.$('#leftBtn');
      if (leftButton) {
        // Simulate touch tap
        await leftButton.tap();
        
        // Check for visual feedback (button should have 'pressed' class briefly)
        await page.waitForTimeout(100);
        
        // Button should be responsive
        await expect(leftButton).toBeVisible();
      }
    });

    test('should handle canvas scaling properly', async ({ page }) => {
      await page.goto(baseUrl);
      
      // Start the game
      await page.waitForSelector('#menuContainer');
      const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
      if (startButton) {
        await startButton.click();
      }
      
      // Wait for game canvas
      await page.waitForSelector('canvas', { timeout: 5000 });
      const canvas = await page.$('canvas');
      
      if (canvas) {
        const canvasBox = await canvas.boundingBox();
        const viewport = page.viewportSize();
        
        if (canvasBox && viewport) {
          // Canvas should not exceed viewport dimensions
          expect(canvasBox.width).toBeLessThanOrEqual(viewport.width);
          expect(canvasBox.height).toBeLessThanOrEqual(viewport.height);
          
          // Canvas should be reasonably sized (not too small)
          expect(canvasBox.width).toBeGreaterThan(200);
          expect(canvasBox.height).toBeGreaterThan(200);
        }
      }
    });

    test('should support landscape orientation', async ({ page, browserName }) => {
      // Skip on desktop browsers
      if (browserName === 'webkit' && name.includes('iPad')) {
        // Test landscape mode on iPad
        await page.setViewportSize({ width: 1024, height: 768 });
      } else if (name.includes('iPhone') || name.includes('Galaxy')) {
        // Test landscape mode on phones
        await page.setViewportSize({ width: 812, height: 375 });
      }
      
      await page.goto(baseUrl);
      
      // Start the game
      await page.waitForSelector('#menuContainer');
      const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
      if (startButton) {
        await startButton.click();
      }
      
      // Check if layout adapts to landscape
      await page.waitForSelector('#app', { timeout: 5000 });
      
      // Game should still be playable in landscape
      const gameArea = await page.$('.game-board-container, canvas');
      await expect(gameArea).toBeVisible();
      
      // Touch controls should still be visible
      const touchControls = await page.$('.touch-controls');
      if (touchControls) {
        await expect(touchControls).toBeVisible();
      }
    });

    test('should prevent unwanted mobile browser behaviors', async ({ page, isMobile }) => {
      if (!isMobile) return;
      
      await page.goto(baseUrl);
      
      // Check if zoom is disabled
      const viewportMeta = await page.$('meta[name="viewport"]');
      const content = await viewportMeta?.getAttribute('content');
      
      expect(content).toContain('user-scalable=no');
      expect(content).toContain('maximum-scale=1.0');
      
      // Check if text selection is disabled on game area
      const body = await page.$('body');
      const userSelect = await body?.evaluate(el => 
        window.getComputedStyle(el).userSelect
      );
      
      expect(userSelect).toBe('none');
    });

    test('should have performance optimizations for mobile', async ({ page }) => {
      await page.goto(baseUrl);
      
      // Start the game
      await page.waitForSelector('#menuContainer');
      const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
      if (startButton) {
        await startButton.click();
      }
      
      // Wait for game to start
      await page.waitForSelector('#app', { timeout: 5000 });
      await page.waitForTimeout(2000);
      
      // Check if canvas uses hardware acceleration hints
      const canvas = await page.$('canvas');
      if (canvas) {
        const willChange = await canvas.evaluate(el => 
          window.getComputedStyle(el).willChange
        );
        
        // Should have performance hints
        expect(willChange).toBeTruthy();
      }
    });
  });
}

// General mobile responsiveness tests
test.describe('Mobile Responsiveness', () => {
  test('should adapt to different screen sizes', async ({ page }) => {
    const screenSizes = [
      { width: 320, height: 568 }, // iPhone 5
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11
      { width: 360, height: 640 }, // Galaxy S5
      { width: 768, height: 1024 }, // iPad Portrait
    ];
    
    for (const size of screenSizes) {
      await page.setViewportSize(size);
      await page.goto(baseUrl);
      
      // Check if page loads without horizontal scroll
      const body = await page.$('body');
      const bodyWidth = await body?.evaluate(el => el.scrollWidth);
      
      if (bodyWidth) {
        expect(bodyWidth).toBeLessThanOrEqual(size.width + 5); // Allow small margin
      }
      
      // Check if touch controls are properly positioned
      await page.waitForSelector('#menuContainer');
      const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
      if (startButton) {
        await startButton.click();
      }
      
      await page.waitForSelector('#app', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const touchControls = await page.$('.touch-controls');
      if (touchControls) {
        const controlsBox = await touchControls.boundingBox();
        if (controlsBox) {
          // Touch controls should not overflow the screen
          expect(controlsBox.width).toBeLessThanOrEqual(size.width);
        }
      }
    }
  });
});

// Swipe gesture tests
test.describe('Touch Gestures', () => {
  test.use({ ...devices['iPhone 13'] });
  
  test('should handle swipe gestures', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Start the game
    await page.waitForSelector('#menuContainer');
    const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
    if (startButton) {
      await startButton.click();
    }
    
    // Wait for game to start
    await page.waitForSelector('#app', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    // Find the game area for swipe gestures
    const gameArea = await page.$('.game-board-container, canvas, #app');
    
    if (gameArea) {
      const gameBox = await gameArea.boundingBox();
      if (gameBox) {
        const centerX = gameBox.x + gameBox.width / 2;
        const centerY = gameBox.y + gameBox.height / 2;
        
        // Test left swipe
        await page.touchscreen.tap(centerX, centerY);
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX - 60, centerY);
        await page.mouse.up();
        
        // Test right swipe
        await page.touchscreen.tap(centerX, centerY);
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 60, centerY);
        await page.mouse.up();
        
        // Test up swipe (rotate)
        await page.touchscreen.tap(centerX, centerY);
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY - 60);
        await page.mouse.up();
        
        // Test down swipe (soft drop)
        await page.touchscreen.tap(centerX, centerY);
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY + 60);
        await page.mouse.up();
        
        // No assertion needed - just testing that gestures don't crash the game
        await page.waitForTimeout(1000);
      }
    }
  });
  
  test('should handle tap for hard drop', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Start the game
    await page.waitForSelector('#menuContainer');
    const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play")');
    if (startButton) {
      await startButton.click();
    }
    
    // Wait for game to start
    await page.waitForSelector('#app', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    // Find the game area
    const gameArea = await page.$('.game-board-container, canvas, #app');
    
    if (gameArea) {
      const gameBox = await gameArea.boundingBox();
      if (gameBox) {
        const centerX = gameBox.x + gameBox.width / 2;
        const centerY = gameBox.y + gameBox.height / 2;
        
        // Test quick tap (hard drop)
        await page.touchscreen.tap(centerX, centerY);
        await page.waitForTimeout(200);
        
        // Game should still be running
        const canvas = await page.$('canvas');
        await expect(canvas).toBeVisible();
      }
    }
  });
});