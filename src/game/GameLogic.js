/**
 * GameLogic - Core game logic system for Tetris
 * Manages game board, piece movement, line clearing, and game state transitions
 */

import { BOARD_CONFIG, TIMING, GAME_STATES, FEATURES } from '../core/Constants.js';
import { PieceGenerator } from './PieceGenerator.js';
import { CollisionDetector } from './CollisionDetector.js';

export class GameLogic {
  constructor() {
    this.pieceGenerator = new PieceGenerator();
    this.collisionDetector = new CollisionDetector();

    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.ghostPiece = null;

    // Timing variables
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockDelay = TIMING.LOCK_DELAY;
    this.fallSpeed = TIMING.BASE_FALL_SPEED;

    // Game state
    this.isGameOver = false;
    this.isPaused = false;
    this.canHold = true;
    this.lastRotation = false;

    // Line clearing animation
    this.clearingLines = [];
    this.clearTimer = 0;

    // Statistics and events
    this.eventListeners = new Map();
    this.gameStats = {
      linesCleared: 0,
      piecesPlaced: 0,
      totalDropDistance: 0,
    };
  }

  /**
   * Initialize the game logic system
   * @param {Object} stateManager - Reference to the state manager
   */
  initialize(stateManager) {
    this.stateManager = stateManager;
    this.reset();

    console.log('🎲 GameLogic system initialized');
  }

  /**
   * Create an empty game board
   * @returns {Array} 2D array representing the game board
   */
  createEmptyBoard() {
    return Array(BOARD_CONFIG.HEIGHT)
      .fill()
      .map(() => Array(BOARD_CONFIG.WIDTH).fill(0));
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.board = this.createEmptyBoard();
    this.pieceGenerator.reset();

    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.ghostPiece = null;

    this.fallTimer = 0;
    this.lockTimer = 0;
    this.isGameOver = false;
    this.canHold = true;
    this.lastRotation = false;

    this.clearingLines = [];
    this.clearTimer = 0;

    this.gameStats = {
      linesCleared: 0,
      piecesPlaced: 0,
      totalDropDistance: 0,
    };

    // Generate initial pieces
    this.spawnNewPiece();
  }

  /**
   * Update game logic (called every frame)
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (gameState.gameState !== GAME_STATES.PLAYING || this.isGameOver) {
      return;
    }

    // Update fall speed based on level
    this.fallSpeed = this.stateManager?.getFallSpeed() || TIMING.BASE_FALL_SPEED;

    // Handle line clearing animation
    if (this.clearingLines.length > 0) {
      this.updateLineClearAnimation(deltaTime);
      return;
    }

    // Update piece falling
    this.updatePieceFall(deltaTime);

    // Update lock timer if piece has landed
    if (this.currentPiece && this.collisionDetector.hasLanded(this.currentPiece, this.board)) {
      this.updateLockTimer(deltaTime);
    } else {
      this.lockTimer = 0;
    }

    // Update ghost piece
    this.updateGhostPiece();
  }

  /**
   * Update piece falling logic
   * @param {number} deltaTime - Time elapsed since last update
   */
  updatePieceFall(deltaTime) {
    if (!this.currentPiece) return;

    this.fallTimer += deltaTime;

    if (this.fallTimer >= this.fallSpeed) {
      this.movePiece('down');
      this.fallTimer = 0;
    }
  }

  /**
   * Update lock timer when piece has landed
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateLockTimer(deltaTime) {
    this.lockTimer += deltaTime;

    if (this.lockTimer >= this.lockDelay) {
      this.lockPiece();
    }
  }

  /**
   * Update line clearing animation
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateLineClearAnimation(deltaTime) {
    this.clearTimer += deltaTime;

    if (this.clearTimer >= TIMING.LINE_CLEAR_DELAY) {
      this.completeLinesClearing();
    }
  }

  /**
   * Update ghost piece position
   */
  updateGhostPiece() {
    if (!this.currentPiece || !FEATURES.GHOST_PIECE) {
      this.ghostPiece = null;
      return;
    }

    this.ghostPiece = this.collisionDetector.getGhostPiece(this.currentPiece, this.board);
  }

  /**
   * Spawn a new piece
   */
  spawnNewPiece() {
    // Move next piece to current, generate new next piece
    this.currentPiece = this.nextPiece || this.pieceGenerator.getNextPiece();
    this.nextPiece = this.pieceGenerator.getNextPiece();

    // Reset piece state
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.canHold = true;
    this.lastRotation = false;

    // Check for game over
    if (this.collisionDetector.isGameOver(this.currentPiece, this.board)) {
      this.handleGameOver();
      return;
    }

    // Update ghost piece
    this.updateGhostPiece();

    this.emit('pieceSpawned', {
      piece: this.currentPiece,
      nextPiece: this.nextPiece,
    });
  }

  /**
   * Move the current piece
   * @param {string} direction - Direction to move ('left', 'right', 'down')
   * @returns {boolean} - True if move was successful
   */
  movePiece(direction) {
    if (!this.currentPiece || this.isGameOver) return false;

    const canMove = this.collisionDetector.canMove(this.currentPiece, this.board, direction);

    if (canMove) {
      switch (direction) {
        case 'left':
          this.currentPiece.x--;
          break;
        case 'right':
          this.currentPiece.x++;
          break;
        case 'down':
          this.currentPiece.y++;
          this.gameStats.totalDropDistance++;
          // Award soft drop points
          if (this.stateManager) {
            this.stateManager.updateScore('softDrop');
          }
          break;
      }

      this.lastRotation = false;
      this.updateGhostPiece();

      this.emit('pieceMoved', {
        piece: this.currentPiece,
        direction,
      });

      return true;
    }

    return false;
  }

  /**
   * Rotate the current piece
   * @param {boolean} clockwise - Direction of rotation
   * @returns {boolean} - True if rotation was successful
   */
  rotatePiece(clockwise = true) {
    if (!this.currentPiece || this.isGameOver) return false;

    const rotatedPiece = this.pieceGenerator.rotatePiece(this.currentPiece, clockwise);
    const validPosition = this.collisionDetector.canRotate(
      this.currentPiece,
      this.board,
      rotatedPiece,
      this.pieceGenerator,
    );

    if (validPosition) {
      this.currentPiece = validPosition;
      this.lastRotation = true;
      this.updateGhostPiece();

      this.emit('pieceRotated', {
        piece: this.currentPiece,
        clockwise,
      });

      return true;
    }

    return false;
  }

  /**
   * Hard drop the current piece
   * @returns {number} - Distance dropped
   */
  hardDrop() {
    if (!this.currentPiece || this.isGameOver) return 0;

    const dropDistance = this.collisionDetector.getHardDropDistance(this.currentPiece, this.board);

    if (dropDistance > 0) {
      this.currentPiece.y += dropDistance;
      this.gameStats.totalDropDistance += dropDistance;

      // Award hard drop points
      if (this.stateManager) {
        this.stateManager.updateScore('hardDrop', dropDistance);
      }

      this.emit('pieceHardDropped', {
        piece: this.currentPiece,
        distance: dropDistance,
      });
    }

    // Immediately lock the piece
    this.lockPiece();

    return dropDistance;
  }

  /**
   * Hold the current piece (if feature is enabled)
   * @returns {boolean} - True if hold was successful
   */
  holdPiece() {
    if (!FEATURES.HOLD_PIECE || !this.canHold || !this.currentPiece || this.isGameOver) {
      return false;
    }

    if (this.holdPiece) {
      // Swap current piece with held piece
      const temp = this.currentPiece;
      this.currentPiece = this.holdPiece;
      this.holdPiece = temp;

      // Reset held piece position
      this.currentPiece.x = Math.floor(
        (BOARD_CONFIG.WIDTH - this.currentPiece.shape[0].length) / 2,
      );
      this.currentPiece.y = 0;
      this.currentPiece.rotation = 0;
    } else {
      // Hold current piece, spawn new one
      this.holdPiece = this.currentPiece;
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.pieceGenerator.getNextPiece();
    }

    this.canHold = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.updateGhostPiece();

    this.emit('pieceHeld', {
      heldPiece: this.holdPiece,
      currentPiece: this.currentPiece,
    });

    return true;
  }

  /**
   * Lock the current piece in place
   */
  lockPiece() {
    if (!this.currentPiece) return;

    // Place piece on board
    this.placePieceOnBoard(this.currentPiece);

    // Check for T-Spin if features are enabled
    let tSpinResult = null;
    if (FEATURES.T_SPIN_DETECTION) {
      tSpinResult = this.collisionDetector.checkTSpin(
        this.currentPiece,
        this.board,
        this.lastRotation,
      );
    }

    // Update statistics
    this.gameStats.piecesPlaced++;

    this.emit('pieceLocked', {
      piece: this.currentPiece,
      position: this.currentPiece,
      tSpin: tSpinResult,
    });

    // Check for line clears
    const fullLines = this.collisionDetector.getFullLines(this.board);

    if (fullLines.length > 0) {
      this.startLineClearAnimation(fullLines, tSpinResult);
    } else {
      // No lines to clear, spawn next piece
      this.spawnNewPiece();
    }
  }

  /**
   * Place a piece on the game board
   * @param {Object} piece - The piece to place
   */
  placePieceOnBoard(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;

          if (this.collisionDetector.isWithinBounds(boardX, boardY)) {
            this.board[boardY][boardX] = piece.color;
          }
        }
      }
    }
  }

  /**
   * Start line clearing animation
   * @param {Array} fullLines - Array of line indices to clear
   * @param {Object} tSpinResult - T-Spin detection result
   */
  startLineClearAnimation(fullLines, tSpinResult) {
    this.clearingLines = fullLines;
    this.clearTimer = 0;

    // Determine scoring action
    let action = 'single';
    const lineCount = fullLines.length;

    if (tSpinResult && tSpinResult.isTSpin) {
      action = `tSpin${lineCount === 1 ? 'Single' : lineCount === 2 ? 'Double' : 'Triple'}`;
    } else {
      switch (lineCount) {
        case 1:
          action = 'single';
          break;
        case 2:
          action = 'double';
          break;
        case 3:
          action = 'triple';
          break;
        case 4:
          action = 'tetris';
          break;
      }
    }

    this.emit('linesClearing', {
      lines: fullLines,
      count: lineCount,
      action,
      tSpin: tSpinResult,
    });

    // Update score immediately
    if (this.stateManager) {
      this.stateManager.updateScore(action, lineCount);
    }
  }

  /**
   * Complete the line clearing process
   */
  completeLinesClearing() {
    // Remove cleared lines and add new empty lines at top
    this.clearingLines.sort((a, b) => b - a); // Sort descending

    this.clearingLines.forEach(lineIndex => {
      this.board.splice(lineIndex, 1);
      this.board.unshift(Array(BOARD_CONFIG.WIDTH).fill(0));
    });

    this.gameStats.linesCleared += this.clearingLines.length;

    this.emit('linesCleared', {
      count: this.clearingLines.length,
      totalLines: this.gameStats.linesCleared,
    });

    // Reset clearing state
    this.clearingLines = [];
    this.clearTimer = 0;

    // Spawn next piece
    this.spawnNewPiece();
  }

  /**
   * Handle game over
   */
  handleGameOver() {
    this.isGameOver = true;

    this.emit('gameOver', {
      finalScore: this.stateManager?.getState().score || 0,
      stats: this.gameStats,
    });

    if (this.stateManager) {
      this.stateManager.gameOver();
    }
  }

  /**
   * Get preview of next pieces
   * @param {number} count - Number of pieces to preview
   * @returns {Array} - Array of next pieces
   */
  getNextPieces(count = 3) {
    return this.pieceGenerator.previewNext(count);
  }

  /**
   * Get current game board state
   * @returns {Array} - Copy of the game board
   */
  getBoardState() {
    return this.board.map(row => [...row]);
  }

  /**
   * Get current piece positions for rendering
   * @returns {Array} - Array of piece positions with colors
   */
  getCurrentPiecePositions() {
    if (!this.currentPiece) return [];
    return this.pieceGenerator.getPiecePositions(this.currentPiece);
  }

  /**
   * Get ghost piece positions for rendering
   * @returns {Array} - Array of ghost piece positions
   */
  getGhostPiecePositions() {
    if (!this.ghostPiece) return [];
    return this.pieceGenerator.getPiecePositions(this.ghostPiece);
  }

  /**
   * Get lines currently being cleared (for animation)
   * @returns {Array} - Array of line indices being cleared
   */
  getClearingLines() {
    return [...this.clearingLines];
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, ...args) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in GameLogic ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get debug information
   * @returns {Object} - Debug information
   */
  getDebugInfo() {
    return {
      boardState: this.getBoardState(),
      currentPiece: this.currentPiece,
      nextPiece: this.nextPiece,
      holdPiece: this.holdPiece,
      ghostPiece: this.ghostPiece,
      fallTimer: this.fallTimer,
      lockTimer: this.lockTimer,
      fallSpeed: this.fallSpeed,
      isGameOver: this.isGameOver,
      clearingLines: this.clearingLines,
      gameStats: this.gameStats,
      pieceGeneratorStats: this.pieceGenerator.getStats(),
    };
  }
}
