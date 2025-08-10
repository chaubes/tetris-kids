/**
 * GameEngine - Main game engine that orchestrates all game systems
 * Handles the game loop, coordination between systems, and main game logic
 */

import { StateManager } from './StateManager.js';
import { GAME_STATES, TIMING, KEYS } from './Constants.js';
import { GameLogic } from '../game/GameLogic.js';
import { ScoreManager } from '../game/ScoreManager.js';

export class GameEngine {
  constructor() {
    this.stateManager = new StateManager();
    this.systems = new Map();
    this.isRunning = false;
    this.lastTime = 0;
    this.frameId = null;

    // Game timing
    this.accumulator = 0;
    this.fixedTimeStep = 1000 / 60; // 60 FPS

    // Core game systems
    this.gameLogic = new GameLogic();
    this.scoreManager = new ScoreManager();

    // Input handling
    this.inputBuffer = [];
    this.keyStates = new Map();

    this.setupEventListeners();
    this.setupInputHandlers();
  }

  /**
   * Initialize the game engine with required systems
   */
  initialize(systems = {}) {
    // Register core game systems first
    this.registerSystem('gameLogic', this.gameLogic);
    this.registerSystem('scoreManager', this.scoreManager);

    // Register additional systems
    Object.entries(systems).forEach(([name, system]) => {
      this.registerSystem(name, system);
    });

    // Initialize all systems
    this.systems.forEach(system => {
      if (system.initialize) {
        system.initialize(this.stateManager);
      }
    });

    // Setup cross-system event listeners
    this.setupSystemInteractions();

    console.log('🎮 Game Engine initialized with systems:', Array.from(this.systems.keys()));
  }

  /**
   * Register a game system
   */
  registerSystem(name, system) {
    if (this.systems.has(name)) {
      console.warn(`System '${name}' is already registered`);
      return;
    }

    this.systems.set(name, system);

    // Provide system access to engine and state manager
    system.engine = this;
    system.stateManager = this.stateManager;
  }

  /**
   * Get a registered system
   */
  getSystem(name) {
    return this.systems.get(name);
  }

  /**
   * Setup event listeners for game state changes
   */
  setupEventListeners() {
    this.stateManager.on('gameStarted', () => this.start());
    this.stateManager.on('pauseToggled', isPaused => {
      if (isPaused) {
        this.pause();
      } else {
        this.resume();
      }
    });
    this.stateManager.on('gameOver', () => this.handleGameOver());

    // Setup visibility change listeners (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    window.addEventListener('blur', () => this.handleFocusChange(false));
    window.addEventListener('focus', () => this.handleFocusChange(true));
  }

  /**
   * Start the game engine
   */
  start() {
    if (this.isRunning) {
      console.warn('Game engine is already running');
      return;
    }

    console.log('🚀 Starting game engine');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Pause the game engine
   */
  pause() {
    console.log('⏸️ Pausing game engine');
    this.isRunning = false;

    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Resume the game engine
   */
  resume() {
    if (this.isRunning) {
      console.warn('Game engine is already running');
      return;
    }

    console.log('▶️ Resuming game engine');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game engine completely
   */
  stop() {
    console.log('⏹️ Stopping game engine');
    this.isRunning = false;

    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    // Notify all systems that the engine is stopping
    this.systems.forEach(system => {
      if (system.onStop) {
        system.onStop();
      }
    });
  }

  /**
   * Main game loop using fixed timestep with accumulator
   */
  gameLoop() {
    if (!this.isRunning) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 100); // Cap at 100ms
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Variable timestep rendering
    const interpolation = this.accumulator / this.fixedTimeStep;
    this.render(interpolation);

    this.frameId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update all game systems
   */
  update(deltaTime) {
    const state = this.stateManager.getState();

    // Only update if the game is in a playing state
    if (state.gameState !== GAME_STATES.PLAYING) {
      return;
    }

    // Update all systems in order
    this.systems.forEach((system, name) => {
      if (system.update) {
        try {
          system.update(deltaTime, state);
        } catch (error) {
          console.error(`Error updating system '${name}':`, error);
        }
      }
    });

    // Process input buffer
    this.processInput();

    // Check for achievements after all systems have updated
    this.stateManager.checkAchievements();
  }

  /**
   * Render all game systems
   */
  render(interpolation) {
    const state = this.stateManager.getState();

    // Render all systems
    this.systems.forEach((system, name) => {
      if (system.render) {
        try {
          system.render(interpolation, state);
        } catch (error) {
          console.error(`Error rendering system '${name}':`, error);
        }
      }
    });
  }

  /**
   * Handle game over state
   */
  handleGameOver() {
    console.log('💀 Game Over!');

    // Stop the game loop but don't destroy systems
    this.pause();

    // Notify systems about game over
    this.systems.forEach(system => {
      if (system.onGameOver) {
        system.onGameOver();
      }
    });

    // Schedule transition to game over screen after delay
    setTimeout(() => {
      this.showGameOverScreen();
    }, TIMING.GAME_OVER_DELAY);
  }

  /**
   * Show the game over screen
   */
  showGameOverScreen() {
    const state = this.stateManager.getState();

    // Get the UI system to show game over screen
    const uiSystem = this.getSystem('ui');
    if (uiSystem && uiSystem.showGameOver) {
      uiSystem.showGameOver({
        score: state.score,
        level: state.level,
        lines: state.lines,
        isNewRecord: state.score === state.personalBest,
      });
    }
  }

  /**
   * Restart the game
   */
  restart() {
    console.log('🔄 Restarting game');

    // Stop current game
    this.stop();

    // Clear input buffer and key states
    this.inputBuffer = [];
    this.keyStates.clear();

    // Reset state
    this.stateManager.startGame();

    // Notify systems about restart
    this.systems.forEach(system => {
      if (system.onRestart) {
        system.onRestart();
      }
    });
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return {
      isRunning: this.isRunning,
      fps: Math.round(1000 / this.fixedTimeStep),
      systems: Array.from(this.systems.keys()),
      gameState: this.stateManager.getState().gameState,
    };
  }

  /**
   * Handle window visibility changes (pause when tab is hidden)
   */
  handleVisibilityChange() {
    if (document.hidden && this.isRunning) {
      const state = this.stateManager.getState();
      if (state.gameState === GAME_STATES.PLAYING) {
        this.stateManager.togglePause();
      }
    }
  }

  /**
   * Handle window focus changes
   */
  handleFocusChange(hasFocus) {
    if (!hasFocus && this.isRunning) {
      const state = this.stateManager.getState();
      if (state.gameState === GAME_STATES.PLAYING) {
        this.stateManager.togglePause();
      }
    }
  }

  /**
   * Clean up and destroy the engine
   */
  destroy() {
    console.log('🧹 Destroying game engine');

    this.stop();

    // Cleanup all systems
    this.systems.forEach(system => {
      if (system.destroy) {
        system.destroy();
      }
    });

    this.systems.clear();
    this.stateManager.reset();
  }

  /**
   * Setup input handlers for keyboard controls
   * Note: Touch input is now handled by the InputController system
   */
  setupInputHandlers() {
    // Only setup keyboard event listeners here
    // Touch input is handled by the dedicated InputController
    document.addEventListener('keydown', event => this.handleKeyDown(event));
    document.addEventListener('keyup', event => this.handleKeyUp(event));

    // Note: Touch event listeners are NOT added here to avoid conflicts
    // with the InputController system which handles touch input properly
  }

  /**
   * Handle keyboard key down events
   */
  handleKeyDown(event) {
    const key = event.code || event.key;

    // Prevent default behavior for game keys
    if (Object.values(KEYS).includes(key)) {
      event.preventDefault();
    }

    // Track key state
    this.keyStates.set(key, true);

    // Add to input buffer with timestamp
    this.inputBuffer.push({
      type: 'keydown',
      key,
      timestamp: performance.now(),
    });
  }

  /**
   * Handle keyboard key up events
   */
  handleKeyUp(event) {
    const key = event.code || event.key;

    // Update key state
    this.keyStates.set(key, false);

    // Add to input buffer
    this.inputBuffer.push({
      type: 'keyup',
      key,
      timestamp: performance.now(),
    });
  }

  /**
   * Handle touch events (basic mobile support)
   * Note: This method is deprecated in favor of InputController
   */
  handleTouch(event, phase) {
    // This method is now handled by InputController
    // Keeping for compatibility but not actively used
    console.warn('GameEngine.handleTouch() called - should use InputController instead');
  }

  /**
   * Process input buffer and send commands to game systems
   * Note: Touch input is now processed via InputController events
   */
  processInput() {
    const state = this.stateManager.getState();

    // Only process input during gameplay
    if (state.gameState !== GAME_STATES.PLAYING) {
      this.inputBuffer = [];
      return;
    }

    const gameLogic = this.getSystem('gameLogic');
    if (!gameLogic) {
      this.inputBuffer = [];
      return;
    }

    // Process keyboard input events from the buffer
    this.inputBuffer.forEach(input => {
      if (input.type === 'keydown') {
        this.handleGameInput(input.key, gameLogic);
      }
      // Touch input is handled by InputController events, not buffer
    });

    // Clear input buffer
    this.inputBuffer = [];
  }

  /**
   * Handle game-specific input commands from keyboard
   * Touch input commands are handled via InputController events in main.js
   */
  handleGameInput(key, gameLogic) {
    switch (key) {
      case KEYS.LEFT:
        gameLogic.movePiece('left');
        break;
      case KEYS.RIGHT:
        gameLogic.movePiece('right');
        break;
      case KEYS.DOWN:
        gameLogic.movePiece('down');
        break;
      case KEYS.UP:
        gameLogic.rotatePiece(true); // Clockwise rotation
        break;
      case KEYS.SPACE:
        gameLogic.hardDrop();
        break;
      case 'KeyZ':
        gameLogic.rotatePiece(false); // Counter-clockwise rotation
        break;
      case 'KeyC':
        gameLogic.holdPiece();
        break;
      case KEYS.P:
      case KEYS.ESCAPE:
        this.stateManager.togglePause();
        break;
      case KEYS.M:
        this.stateManager.toggleMute();
        break;
    }
  }

  /**
   * Setup interactions between game systems
   */
  setupSystemInteractions() {
    const gameLogic = this.getSystem('gameLogic');
    const scoreManager = this.getSystem('scoreManager');

    if (gameLogic && scoreManager) {
      // Connect game logic events to score manager
      gameLogic.on('linesClearing', data => {
        const scoreResult = scoreManager.updateScore(data.action, data.count, {
          tSpin: data.tSpin,
        });

        // Emit combined event for UI systems
        this.emit('scoreUpdated', scoreResult);
      });

      gameLogic.on('pieceHardDropped', data => {
        scoreManager.updateDropScore('hard', data.distance);
      });

      gameLogic.on('gameOver', data => {
        const finalStats = scoreManager.calculateFinalStats(this.stateManager.getState().totalTime);

        this.emit('gameOverComplete', {
          ...data,
          finalStats,
        });
      });
    }

    // Connect score manager events to state manager
    if (scoreManager) {
      scoreManager.on('scoreUpdated', data => {
        // Update state manager with new score data
        this.stateManager.setState({
          score: data.totalScore,
          level: data.level,
          lines: data.totalLines,
        });
      });

      scoreManager.on('levelUp', data => {
        this.emit('levelUp', data);
      });

      scoreManager.on('achievementUnlocked', achievement => {
        this.emit('achievementUnlocked', achievement);
      });
    }
  }

  /**
   * Get current game data for rendering systems
   */
  getGameData() {
    const gameLogic = this.getSystem('gameLogic');
    const scoreManager = this.getSystem('scoreManager');

    // Provide default data even if gameLogic is not available
    const defaultBoard = Array(20).fill().map(() => Array(10).fill(0));
    
    if (!gameLogic) {
      console.warn('GameLogic system not available, returning default data');
      return {
        board: defaultBoard,
        currentPiece: [],
        ghostPiece: [],
        nextPieces: [],
        holdPiece: null,
        clearingLines: [],
        score: scoreManager ? scoreManager.getScoreData() : { score: 0, lines: 0, level: 1 },
      };
    }

    try {
      return {
        board: gameLogic.getBoardState() || defaultBoard,
        currentPiece: gameLogic.getCurrentPiecePositions() || [],
        ghostPiece: gameLogic.getGhostPiecePositions() || [],
        nextPieces: gameLogic.getNextPieces(3) || [],
        holdPiece: gameLogic.holdPiece || null,
        clearingLines: gameLogic.getClearingLines() || [],
        score: scoreManager ? scoreManager.getScoreData() : { score: 0, lines: 0, level: 1 },
      };
    } catch (error) {
      console.error('Error getting game data:', error);
      return {
        board: defaultBoard,
        currentPiece: [],
        ghostPiece: [],
        nextPieces: [],
        holdPiece: null,
        clearingLines: [],
        score: { score: 0, lines: 0, level: 1 },
      };
    }
  }

  /**
   * Start a new game
   */
  startNewGame() {
    console.log('🎮 Starting new game');

    // Reset all game systems
    this.systems.forEach(system => {
      if (system.reset) {
        system.reset();
      }
    });

    // Start the game through state manager
    this.stateManager.startGame();
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key) {
    return this.keyStates.get(key) === true;
  }

  /**
   * Event emission system for engine-level events
   */
  emit(event, ...args) {
    // Emit to all systems that have event listeners
    this.systems.forEach(system => {
      if (system.on && typeof system.on === 'function') {
        try {
          system.emit?.(event, ...args);
        } catch (error) {
          // Ignore systems that don't support event emission
        }
      }
    });
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    const gameLogic = this.getSystem('gameLogic');
    const scoreManager = this.getSystem('scoreManager');

    return {
      engine: {
        isRunning: this.isRunning,
        lastTime: this.lastTime,
        accumulator: this.accumulator,
        fixedTimeStep: this.fixedTimeStep,
        inputBufferSize: this.inputBuffer.length,
        keyStatesCount: this.keyStates.size,
      },
      systems: Array.from(this.systems.entries()).map(([name, system]) => ({
        name,
        hasUpdate: typeof system.update === 'function',
        hasRender: typeof system.render === 'function',
        hasInitialize: typeof system.initialize === 'function',
      })),
      gameData: this.getGameData(),
      gameLogicDebug: gameLogic ? gameLogic.getDebugInfo() : null,
      scoreData: scoreManager ? scoreManager.getScoreData() : null,
      state: this.stateManager.getDisplayState(),
    };
  }
}
