/**
 * Simple Mobile Browser Test for Tetris Kids Game
 * Tests basic mobile functionality
 */

import { test, expect, devices } from '@playwright/test';

// Configure for iPhone 13 mobile testing
test.use(devices['iPhone 13']);

const baseUrl = 'http://localhost:7301';

test.describe('Mobile Browser Functionality', () => {
  test('should load game on mobile browser', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Wait for game to load
    await page.waitForSelector('#menuContainer', { timeout: 10000 });
    
    // Check if page loads correctly
    await expect(page).toHaveTitle(/Tetris Kids/);
    
    // Check mobile viewport
    const viewportMeta = await page.$('meta[name="viewport"]');
    expect(viewportMeta).toBeTruthy();
    
    const content = await viewportMeta?.getAttribute('content');
    expect(content).toContain('user-scalable=no');
  });

  test('should display mobile touch controls', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Start the game
    await page.waitForSelector('#menuContainer');
    
    // Look for start/play button
    const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play"), button:has-text("Start")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(2000); // Wait for game to initialize
    }
    
    // Check if touch control buttons exist and are visible
    const touchButtons = [
      '#leftBtn',
      '#rightBtn', 
      '#downBtn',
      '#rotateBtn',
      '#dropBtn'
    ];
    
    let foundButtons = 0;
    for (const buttonSelector of touchButtons) {
      const button = await page.$(buttonSelector);
      if (button) {
        const isVisible = await button.isVisible();
        if (isVisible) {
          foundButtons++;
          
          // Check minimum touch target size
          const buttonBox = await button.boundingBox();
          if (buttonBox) {
            expect(buttonBox.width).toBeGreaterThan(35);
            expect(buttonBox.height).toBeGreaterThan(35);
          }
        }
      }
    }
    
    // Should have at least some touch buttons
    expect(foundButtons).toBeGreaterThan(0);
  });

  test('should handle touch button interactions', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Start the game
    await page.waitForSelector('#menuContainer');
    const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play"), button:has-text("Start")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(3000); // Wait for game initialization
    }
    
    // Test touch button interaction
    const leftButton = await page.$('#leftBtn');
    if (leftButton && await leftButton.isVisible()) {
      // Simulate touch tap
      await leftButton.tap();
      await page.waitForTimeout(100);
      
      // Button should be responsive
      await expect(leftButton).toBeVisible();
    }
    
    // Test another button
    const rotateButton = await page.$('#rotateBtn');
    if (rotateButton && await rotateButton.isVisible()) {
      await rotateButton.tap();
      await page.waitForTimeout(100);
    }
  });

  test('should have proper canvas scaling', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Start the game
    await page.waitForSelector('#menuContainer');
    const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play"), button:has-text("Start")');
    if (startButton) {
      await startButton.click();
    }
    
    // Wait for game canvas
    await page.waitForTimeout(3000);
    const canvas = await page.$('canvas');
    
    if (canvas) {
      const canvasBox = await canvas.boundingBox();
      const viewport = page.viewportSize();
      
      if (canvasBox && viewport) {
        // Canvas should not exceed viewport dimensions
        expect(canvasBox.width).toBeLessThanOrEqual(viewport.width);
        expect(canvasBox.height).toBeLessThanOrEqual(viewport.height * 0.9); // Allow for UI elements
        
        // Canvas should be reasonably sized
        expect(canvasBox.width).toBeGreaterThan(150);
        expect(canvasBox.height).toBeGreaterThan(150);
      }
    }
  });

  test('should prevent mobile browser annoyances', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Check viewport configuration
    const viewportMeta = await page.$('meta[name="viewport"]');
    const content = await viewportMeta?.getAttribute('content');
    
    expect(content).toContain('user-scalable=no');
    expect(content).toContain('maximum-scale=1.0');
    
    // Check if text selection is disabled
    const body = await page.$('body');
    const userSelect = await body?.evaluate(el => 
      window.getComputedStyle(el).userSelect
    );
    
    expect(userSelect).toBe('none');
  });

  test('should handle basic touch gestures', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Start the game
    await page.waitForSelector('#menuContainer');
    const startButton = await page.$('button:has-text("Start Game"), button:has-text("Play"), button:has-text("Start")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Find a game area to perform gestures
    const gameArea = await page.$('.game-board-container, canvas, #app');
    
    if (gameArea) {
      const gameBox = await gameArea.boundingBox();
      if (gameBox) {
        const centerX = gameBox.x + gameBox.width / 2;
        const centerY = gameBox.y + gameBox.height / 2;
        
        // Test simple tap
        await page.touchscreen.tap(centerX, centerY);
        await page.waitForTimeout(200);
        
        // Game should still be functional
        const canvas = await page.$('canvas');
        if (canvas) {
          await expect(canvas).toBeVisible();
        }
      }
    }
  });
});