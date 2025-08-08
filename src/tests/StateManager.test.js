/**
 * Tests for StateManager
 */

import { StateManager } from '../core/StateManager.js';
import { GAME_STATES } from '../core/Constants.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  test('should initialize with default state', () => {
    const state = stateManager.getState();

    expect(state.gameState).toBe(GAME_STATES.MENU);
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.lines).toBe(0);
    expect(state.isPaused).toBe(false);
    expect(state.isGameOver).toBe(false);
  });

  test('should start a new game', () => {
    stateManager.startGame();
    const state = stateManager.getState();

    expect(state.gameState).toBe(GAME_STATES.PLAYING);
    expect(state.startTime).not.toBeNull();
  });

  test('should update score correctly', () => {
    stateManager.updateScore('single', 1);
    const state = stateManager.getState();

    expect(state.score).toBe(100); // SCORING.SINGLE = 100, level 1 multiplier
    expect(state.lines).toBe(1);
  });

  test('should level up after clearing enough lines', () => {
    let levelUpTriggered = false;
    stateManager.on('levelUp', () => {
      levelUpTriggered = true;
    });

    // Clear 10 lines to trigger level up
    stateManager.updateScore('single', 10);
    const state = stateManager.getState();

    expect(state.level).toBe(2);
    expect(levelUpTriggered).toBe(true);
  });

  test('should toggle pause state', () => {
    stateManager.startGame();

    stateManager.togglePause();
    let state = stateManager.getState();
    expect(state.gameState).toBe(GAME_STATES.PAUSED);
    expect(state.isPaused).toBe(true);

    stateManager.togglePause();
    state = stateManager.getState();
    expect(state.gameState).toBe(GAME_STATES.PLAYING);
    expect(state.isPaused).toBe(false);
  });

  test('should handle game over', () => {
    stateManager.startGame();
    stateManager.updateScore('tetris', 4);

    let gameOverData = null;
    stateManager.on('gameOver', data => {
      gameOverData = data;
    });

    stateManager.gameOver();
    const state = stateManager.getState();

    expect(state.gameState).toBe(GAME_STATES.GAME_OVER);
    expect(state.isGameOver).toBe(true);
    expect(gameOverData).not.toBeNull();
    expect(gameOverData.score).toBeGreaterThan(0);
  });

  test('should calculate fall speed correctly', () => {
    const baseSpeed = stateManager.getFallSpeed(); // Level 1

    stateManager.updateScore('single', 10); // Level up to 2
    const fasterSpeed = stateManager.getFallSpeed(); // Level 2

    expect(fasterSpeed).toBeLessThan(baseSpeed);
  });

  test('should toggle mute state', () => {
    let muteToggled = false;
    stateManager.on('muteToggled', () => {
      muteToggled = true;
    });

    stateManager.toggleMute();
    const state = stateManager.getState();

    expect(state.isMuted).toBe(true);
    expect(muteToggled).toBe(true);
  });

  test('should create empty board', () => {
    const board = stateManager.createEmptyBoard();

    expect(board).toHaveLength(20);
    expect(board[0]).toHaveLength(10);
    expect(board[0][0]).toBe(0);
  });

  test('should format time correctly', () => {
    const timeString = stateManager.formatTime(125000); // 2 minutes, 5 seconds
    expect(timeString).toBe('2:05');
  });

  test('should emit events correctly', () => {
    let eventData = null;

    stateManager.on('testEvent', data => {
      eventData = data;
    });

    stateManager.emit('testEvent', 'test data');
    expect(eventData).toBe('test data');
  });

  test('should remove event listeners', () => {
    let callCount = 0;
    const listener = () => callCount++;

    stateManager.on('testEvent', listener);
    stateManager.emit('testEvent');
    expect(callCount).toBe(1);

    stateManager.off('testEvent', listener);
    stateManager.emit('testEvent');
    expect(callCount).toBe(1); // Should not increment
  });

  test('should reset state correctly', () => {
    stateManager.startGame();
    stateManager.updateScore('tetris', 4);

    stateManager.reset();
    const state = stateManager.getState();

    expect(state.gameState).toBe(GAME_STATES.MENU);
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.lines).toBe(0);
  });
});
