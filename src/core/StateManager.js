/**
 * StateManager - Centralized state management for the Tetris game
 * Handles all game state, score, level, and game progression
 */

import { GAME_STATES, SCORING, LINES_PER_LEVEL, TIMING } from './Constants.js';

export class StateManager {
  constructor() {
    this.reset();
    this.listeners = new Map();
  }

  /**
   * Reset the game state to initial values
   */
  reset() {
    this.state = {
      // Core game state
      gameState: GAME_STATES.MENU,

      // Game progression
      score: 0,
      level: 1,
      lines: 0,

      // Performance tracking
      totalPieces: 0,
      totalTime: 0,
      startTime: null,

      // Current game session
      currentPiece: null,
      nextPiece: null,
      holdPiece: null,

      // Game board state
      board: this.createEmptyBoard(),
      fallingPiece: null,
      ghostPiece: null,

      // Game mechanics
      isPaused: false,
      isGameOver: false,
      canHold: true,
      lockTimer: 0,
      fallTimer: 0,

      // Settings
      isMuted: false,
      difficulty: 'NORMAL',
      showGhostPiece: true,

      // Statistics
      linesCleared: {
        single: 0,
        double: 0,
        triple: 0,
        tetris: 0,
      },

      // Achievements
      achievements: [],
      personalBest: this.loadPersonalBest(),
    };
  }

  /**
   * Create an empty game board
   */
  createEmptyBoard() {
    return Array(20)
      .fill()
      .map(() => Array(10).fill(0));
  }

  /**
   * Load personal best score from localStorage
   */
  loadPersonalBest() {
    try {
      const saved = localStorage.getItem('tetris-kids-best-score');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.warn('Could not load personal best:', error);
      return 0;
    }
  }

  /**
   * Save personal best score to localStorage
   */
  savePersonalBest() {
    try {
      if (this.state.score > this.state.personalBest) {
        this.state.personalBest = this.state.score;
        localStorage.setItem('tetris-kids-best-score', this.state.score.toString());
        this.emit('personalBestUpdated', this.state.personalBest);
      }
    } catch (error) {
      console.warn('Could not save personal best:', error);
    }
  }

  /**
   * Get current game state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set game state
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.emit('stateChanged', this.state, oldState);
  }

  /**
   * Update score based on action
   */
  updateScore(action, linesCleared = 0) {
    let points = 0;

    switch (action) {
      case 'single':
        points = SCORING.SINGLE;
        this.state.linesCleared.single++;
        break;
      case 'double':
        points = SCORING.DOUBLE;
        this.state.linesCleared.double++;
        break;
      case 'triple':
        points = SCORING.TRIPLE;
        this.state.linesCleared.triple++;
        break;
      case 'tetris':
        points = SCORING.TETRIS;
        this.state.linesCleared.tetris++;
        break;
      case 'softDrop':
        points = SCORING.SOFT_DROP;
        break;
      case 'hardDrop':
        points = SCORING.HARD_DROP;
        break;
      default:
        return;
    }

    // Apply level multiplier
    points *= this.state.level;

    // Update score and lines
    this.state.score += points;
    if (linesCleared > 0) {
      this.state.lines += linesCleared;
      this.checkLevelUp();
    }

    this.emit('scoreUpdated', {
      action,
      points,
      totalScore: this.state.score,
      linesCleared,
    });
  }

  /**
   * Check if player should level up
   */
  checkLevelUp() {
    const newLevel = Math.floor(this.state.lines / LINES_PER_LEVEL) + 1;

    if (newLevel > this.state.level) {
      const oldLevel = this.state.level;
      this.state.level = newLevel;
      this.emit('levelUp', {
        oldLevel,
        newLevel,
        fallSpeed: this.getFallSpeed(),
      });
    }
  }

  /**
   * Get current fall speed based on level
   */
  getFallSpeed() {
    const baseSpeed = TIMING.BASE_FALL_SPEED;
    const speedDecrease = TIMING.SPEED_INCREASE * (this.state.level - 1);
    return Math.max(TIMING.MIN_FALL_SPEED, baseSpeed - speedDecrease);
  }

  /**
   * Start a new game
   */
  startGame() {
    this.reset();
    this.state.gameState = GAME_STATES.PLAYING;
    this.state.startTime = Date.now();
    this.emit('gameStarted', this.state);
  }

  /**
   * Pause/unpause the game
   */
  togglePause() {
    if (this.state.gameState === GAME_STATES.PLAYING) {
      this.state.gameState = GAME_STATES.PAUSED;
      this.state.isPaused = true;
    } else if (this.state.gameState === GAME_STATES.PAUSED) {
      this.state.gameState = GAME_STATES.PLAYING;
      this.state.isPaused = false;
    }

    this.emit('pauseToggled', this.state.isPaused);
  }

  /**
   * End the game
   */
  gameOver() {
    this.state.gameState = GAME_STATES.GAME_OVER;
    this.state.isGameOver = true;
    this.state.totalTime = Date.now() - (this.state.startTime || Date.now());

    // Save personal best
    this.savePersonalBest();

    // Calculate final statistics
    const stats = this.calculateFinalStats();

    this.emit('gameOver', {
      score: this.state.score,
      level: this.state.level,
      lines: this.state.lines,
      time: this.state.totalTime,
      stats,
      isNewRecord: this.state.score === this.state.personalBest,
    });
  }

  /**
   * Calculate final game statistics
   */
  calculateFinalStats() {
    const timeInMinutes = this.state.totalTime / (1000 * 60);

    return {
      piecesPerMinute: timeInMinutes > 0 ? (this.state.totalPieces / timeInMinutes).toFixed(1) : 0,
      linesPerMinute: timeInMinutes > 0 ? (this.state.lines / timeInMinutes).toFixed(1) : 0,
      accuracy: this.calculateAccuracy(),
      efficiency: this.calculateEfficiency(),
      timeString: this.formatTime(this.state.totalTime),
    };
  }

  /**
   * Calculate gameplay accuracy (placeholder for future implementation)
   */
  calculateAccuracy() {
    // Could track misdrops, rotation errors, etc.
    return 100; // Default to 100% for now
  }

  /**
   * Calculate efficiency rating
   */
  calculateEfficiency() {
    const totalLines = this.state.lines;
    if (totalLines === 0) return 0;

    const tetrisRatio = (this.state.linesCleared.tetris * 4) / totalLines;
    return Math.round(tetrisRatio * 100);
  }

  /**
   * Format time in MM:SS format
   */
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    this.emit('muteToggled', this.state.isMuted);
  }

  /**
   * Check for achievements
   */
  checkAchievements() {
    const achievements = [];

    // First Tetris
    if (this.state.linesCleared.tetris === 1 && !this.hasAchievement('firstTetris')) {
      achievements.push({
        id: 'firstTetris',
        name: 'First Tetris!',
        description: 'Clear 4 lines at once',
        icon: '🎉',
      });
    }

    // Speed Demon (reach level 10)
    if (this.state.level >= 10 && !this.hasAchievement('speedDemon')) {
      achievements.push({
        id: 'speedDemon',
        name: 'Speed Demon',
        description: 'Reach level 10',
        icon: '⚡',
      });
    }

    // Line Master (clear 100 lines)
    if (this.state.lines >= 100 && !this.hasAchievement('lineMaster')) {
      achievements.push({
        id: 'lineMaster',
        name: 'Line Master',
        description: 'Clear 100 lines',
        icon: '🏆',
      });
    }

    // Add new achievements to state
    achievements.forEach(achievement => {
      this.state.achievements.push(achievement);
      this.emit('achievementUnlocked', achievement);
    });
  }

  /**
   * Check if player has specific achievement
   */
  hasAchievement(achievementId) {
    return this.state.achievements.some(a => a.id === achievementId);
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get formatted state for UI display
   */
  getDisplayState() {
    return {
      score: this.state.score.toLocaleString(),
      level: this.state.level,
      lines: this.state.lines,
      personalBest: this.state.personalBest.toLocaleString(),
      timeString: this.formatTime(this.state.totalTime),
      gameState: this.state.gameState,
      isPaused: this.state.isPaused,
      isMuted: this.state.isMuted,
    };
  }
}
