/**
 * ScoreManager - Kid-friendly scoring system for Tetris
 * Features simplified scoring, encouraging messages, and achievement tracking
 */

import { SCORING, LINES_PER_LEVEL, TIMING } from '../core/Constants.js';

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.personalBest = this.loadPersonalBest();

    // Kid-friendly features
    this.consecutiveTetris = 0;
    this.consecutiveClears = 0;
    this.perfectClears = 0;
    this.encouragementStreak = 0;

    // Detailed statistics
    this.stats = {
      single: 0,
      double: 0,
      triple: 0,
      tetris: 0,
      totalPieces: 0,
      totalTime: 0,
      averageSpeed: 0,
    };

    // Achievements system
    this.achievements = [];
    this.sessionAchievements = [];

    // Event listeners
    this.eventListeners = new Map();

    // Kid-friendly messages
    this.encouragementMessages = [
      'Awesome job! 🌟',
      "You're doing great! 🎉",
      'Super move! ⭐',
      'Fantastic! 🎊',
      'Way to go! 🏆',
      'Brilliant! ✨',
      'Keep it up! 🚀',
      'Amazing! 🌈',
      'Perfect! 💎',
      'Outstanding! 🎯',
    ];

    this.levelUpMessages = [
      "Level up! You're getting faster! 🚀",
      'Wow! Moving to level {level}! 🌟',
      'Incredible! Level {level} unlocked! 🎉',
      "You're on fire! Level {level}! 🔥",
      'Super speed! Welcome to level {level}! ⚡',
    ];

    this.tetrisMessages = [
      'TETRIS! Four lines at once! 🎊',
      "Amazing TETRIS! You're a superstar! ⭐",
      'Incredible TETRIS! Keep going! 🚀',
      'Perfect TETRIS! You rock! 🎸',
      'Outstanding TETRIS! Fantastic! 🎯',
    ];
  }

  /**
   * Initialize the score manager
   * @param {Object} stateManager - Reference to the state manager
   */
  initialize(stateManager) {
    this.stateManager = stateManager;
    this.reset();

    console.log('🎯 ScoreManager system initialized');
  }

  /**
   * Reset scoring system to initial state
   */
  reset() {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.consecutiveTetris = 0;
    this.consecutiveClears = 0;
    this.perfectClears = 0;
    this.encouragementStreak = 0;

    this.stats = {
      single: 0,
      double: 0,
      triple: 0,
      tetris: 0,
      totalPieces: 0,
      totalTime: 0,
      averageSpeed: 0,
    };

    this.sessionAchievements = [];
  }

  /**
   * Calculate score for line clears with kid-friendly bonuses
   * @param {string} action - Type of action ('single', 'double', 'triple', 'tetris')
   * @param {number} linesCleared - Number of lines cleared
   * @param {Object} extras - Additional scoring factors (tSpin, consecutive, etc.)
   * @returns {Object} - Scoring result with points and messages
   */
  calculateScore(action, linesCleared, extras = {}) {
    let basePoints = 0;
    let bonusPoints = 0;
    const messages = [];

    // Base scoring (simplified for kids)
    switch (action) {
      case 'single':
        basePoints = SCORING.SINGLE;
        this.stats.single++;
        this.consecutiveTetris = 0;
        break;
      case 'double':
        basePoints = SCORING.DOUBLE;
        this.stats.double++;
        bonusPoints += 50; // Bonus for clearing 2 lines
        messages.push('Double clear! Nice! 👏');
        this.consecutiveTetris = 0;
        break;
      case 'triple':
        basePoints = SCORING.TRIPLE;
        this.stats.triple++;
        bonusPoints += 100; // Bonus for clearing 3 lines
        messages.push('Triple clear! Excellent! 🎯');
        this.consecutiveTetris = 0;
        break;
      case 'tetris':
        basePoints = SCORING.TETRIS;
        this.stats.tetris++;
        this.consecutiveTetris++;
        bonusPoints += 200; // Extra bonus for Tetris

        // Consecutive Tetris bonus
        if (this.consecutiveTetris > 1) {
          const consecutiveBonus = this.consecutiveTetris * 100;
          bonusPoints += consecutiveBonus;
          messages.push(`${this.consecutiveTetris} Tetris combo! Incredible! 🔥`);
        } else {
          messages.push(this.getRandomMessage(this.tetrisMessages));
        }
        break;
    }

    // Level multiplier (reduced for kids - gentler progression)
    const levelMultiplier = Math.max(1, this.level * 0.8);
    basePoints = Math.floor(basePoints * levelMultiplier);

    // Consecutive clears bonus (encourages continuous play)
    this.consecutiveClears++;
    if (this.consecutiveClears >= 3) {
      const streakBonus = Math.min(this.consecutiveClears * 25, 200);
      bonusPoints += streakBonus;

      if (this.consecutiveClears === 5) {
        messages.push("Hot streak! You're unstoppable! 🔥");
      } else if (this.consecutiveClears === 10) {
        messages.push("Amazing streak! You're a Tetris master! 🏆");
      }
    }

    // T-Spin bonus (if feature enabled)
    if (extras.tSpin && extras.tSpin.isTSpin) {
      bonusPoints += 400;
      messages.push('T-Spin! Advanced move! 🌟');
    }

    // Perfect clear bonus (entire board cleared)
    if (extras.perfectClear) {
      this.perfectClears++;
      bonusPoints += 1000;
      messages.push('PERFECT CLEAR! Absolutely incredible! 💎');
    }

    // Speed bonus for fast players
    if (extras.speed && extras.speed < 500) {
      const speedBonus = Math.floor((500 - extras.speed) / 10);
      bonusPoints += speedBonus;
      messages.push('Lightning fast! ⚡');
    }

    const totalPoints = basePoints + bonusPoints;

    // Add encouragement messages
    if (Math.random() < 0.3) {
      // 30% chance for random encouragement
      messages.push(this.getRandomMessage(this.encouragementMessages));
    }

    return {
      basePoints,
      bonusPoints,
      totalPoints,
      messages,
      action,
      linesCleared,
      level: this.level,
      consecutiveTetris: this.consecutiveTetris,
      consecutiveClears: this.consecutiveClears,
    };
  }

  /**
   * Update score based on action
   * @param {string} action - Scoring action
   * @param {number} linesCleared - Lines cleared
   * @param {Object} extras - Additional scoring data
   */
  updateScore(action, linesCleared = 0, extras = {}) {
    const scoreResult = this.calculateScore(action, linesCleared, extras);

    // Update totals
    this.score += scoreResult.totalPoints;
    this.lines += linesCleared;

    // Check for level up
    const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    let leveledUp = false;

    if (newLevel > this.level) {
      leveledUp = true;
      const oldLevel = this.level;
      this.level = newLevel;

      // Level up message
      const levelUpMessage = this.getRandomMessage(this.levelUpMessages).replace(
        '{level}',
        this.level,
      );
      scoreResult.messages.push(levelUpMessage);

      // Level up achievement
      this.checkLevelAchievements(this.level);

      this.emit('levelUp', {
        oldLevel,
        newLevel: this.level,
        score: this.score,
        lines: this.lines,
      });
    }

    // Check for new achievements
    this.checkScoreAchievements();

    // Check for personal best
    let isNewRecord = false;
    if (this.score > this.personalBest) {
      isNewRecord = true;
      this.personalBest = this.score;
      this.savePersonalBest();
      scoreResult.messages.push("NEW PERSONAL BEST! You're amazing! 🏆");
    }

    // Emit score update event
    this.emit('scoreUpdated', {
      ...scoreResult,
      totalScore: this.score,
      totalLines: this.lines,
      level: this.level,
      leveledUp,
      isNewRecord,
      personalBest: this.personalBest,
    });

    return scoreResult;
  }

  /**
   * Award points for piece drops
   * @param {string} dropType - 'soft' or 'hard'
   * @param {number} distance - Drop distance
   */
  updateDropScore(dropType, distance) {
    const points =
      dropType === 'soft' ? SCORING.SOFT_DROP * distance : SCORING.HARD_DROP * distance;

    this.score += points;

    this.emit('dropScoreAwarded', {
      dropType,
      distance,
      points,
      totalScore: this.score,
    });
  }

  /**
   * Check for level-based achievements
   * @param {number} level - Current level
   */
  checkLevelAchievements(level) {
    const levelAchievements = [
      { level: 5, id: 'speed5', name: 'Speed Demon', description: 'Reached level 5!', icon: '🚀' },
      {
        level: 10,
        id: 'speed10',
        name: 'Lightning Fast',
        description: 'Reached level 10!',
        icon: '⚡',
      },
      {
        level: 15,
        id: 'speed15',
        name: 'Supersonic',
        description: 'Reached level 15!',
        icon: '🌟',
      },
      {
        level: 20,
        id: 'speed20',
        name: 'Tetris Master',
        description: 'Reached level 20!',
        icon: '🏆',
      },
    ];

    levelAchievements.forEach(achievement => {
      if (level >= achievement.level && !this.hasAchievement(achievement.id)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  /**
   * Check for score-based achievements
   */
  checkScoreAchievements() {
    const scoreAchievements = [
      {
        score: 1000,
        id: 'score1k',
        name: 'First Milestone',
        description: 'Scored 1,000 points!',
        icon: '🎯',
      },
      {
        score: 5000,
        id: 'score5k',
        name: 'Getting Good',
        description: 'Scored 5,000 points!',
        icon: '🎉',
      },
      {
        score: 10000,
        id: 'score10k',
        name: 'High Scorer',
        description: 'Scored 10,000 points!',
        icon: '⭐',
      },
      {
        score: 25000,
        id: 'score25k',
        name: 'Point Master',
        description: 'Scored 25,000 points!',
        icon: '💎',
      },
    ];

    scoreAchievements.forEach(achievement => {
      if (this.score >= achievement.score && !this.hasAchievement(achievement.id)) {
        this.unlockAchievement(achievement);
      }
    });

    // Tetris-specific achievements
    if (this.stats.tetris >= 1 && !this.hasAchievement('firstTetris')) {
      this.unlockAchievement({
        id: 'firstTetris',
        name: 'First Tetris!',
        description: 'Cleared 4 lines at once!',
        icon: '🎊',
      });
    }

    if (this.stats.tetris >= 10 && !this.hasAchievement('tetrisMaster')) {
      this.unlockAchievement({
        id: 'tetrisMaster',
        name: 'Tetris Master',
        description: 'Achieved 10 Tetris clears!',
        icon: '🏆',
      });
    }

    if (this.consecutiveTetris >= 3 && !this.hasAchievement('tetrisCombo')) {
      this.unlockAchievement({
        id: 'tetrisCombo',
        name: 'Tetris Combo',
        description: '3 consecutive Tetris clears!',
        icon: '🔥',
      });
    }
  }

  /**
   * Check if player has a specific achievement
   * @param {string} achievementId - Achievement ID to check
   * @returns {boolean} - True if player has achievement
   */
  hasAchievement(achievementId) {
    return (
      this.achievements.some(a => a.id === achievementId) ||
      this.sessionAchievements.some(a => a.id === achievementId)
    );
  }

  /**
   * Unlock an achievement
   * @param {Object} achievement - Achievement data
   */
  unlockAchievement(achievement) {
    const fullAchievement = {
      ...achievement,
      unlockedAt: Date.now(),
      session: true,
    };

    this.sessionAchievements.push(fullAchievement);

    this.emit('achievementUnlocked', fullAchievement);
  }

  /**
   * Get random message from array
   * @param {Array} messages - Array of messages
   * @returns {string} - Random message
   */
  getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get current fall speed based on level (kid-friendly progression)
   * @returns {number} - Fall speed in milliseconds
   */
  getFallSpeed() {
    // Gentler speed progression for kids
    const baseSpeed = TIMING.BASE_FALL_SPEED;
    const speedDecrease = Math.floor(TIMING.SPEED_INCREASE * 0.7 * (this.level - 1));
    return Math.max(TIMING.MIN_FALL_SPEED * 2, baseSpeed - speedDecrease);
  }

  /**
   * Calculate final game statistics
   * @param {number} gameTime - Total game time in milliseconds
   * @returns {Object} - Final statistics
   */
  calculateFinalStats(gameTime) {
    const timeInMinutes = gameTime / (1000 * 60);
    const totalLines = this.lines;

    return {
      score: this.score,
      level: this.level,
      lines: totalLines,
      personalBest: this.personalBest,
      isNewRecord: this.score === this.personalBest,

      // Time-based stats
      gameTime,
      timeString: this.formatTime(gameTime),
      linesPerMinute: timeInMinutes > 0 ? (totalLines / timeInMinutes).toFixed(1) : 0,

      // Performance stats
      efficiency: this.calculateEfficiency(),
      tetrisRate: totalLines > 0 ? (((this.stats.tetris * 4) / totalLines) * 100).toFixed(1) : 0,

      // Breakdown
      breakdown: {
        single: this.stats.single,
        double: this.stats.double,
        triple: this.stats.triple,
        tetris: this.stats.tetris,
      },

      // Special achievements this session
      sessionAchievements: this.sessionAchievements,

      // Kid-friendly messages
      finalMessage: this.getFinalMessage(),
    };
  }

  /**
   * Calculate efficiency rating (kid-friendly)
   * @returns {number} - Efficiency percentage
   */
  calculateEfficiency() {
    const totalClears =
      this.stats.single + this.stats.double + this.stats.triple + this.stats.tetris;

    if (totalClears === 0) return 0;

    // Weight different clear types
    const efficiency =
      ((this.stats.single * 1 +
        this.stats.double * 2.5 +
        this.stats.triple * 4 +
        this.stats.tetris * 6) /
        (totalClears * 6)) *
      100;

    return Math.round(efficiency);
  }

  /**
   * Get encouraging final message based on performance
   * @returns {string} - Final message
   */
  getFinalMessage() {
    const efficiency = this.calculateEfficiency();
    const level = this.level;
    const tetrisCount = this.stats.tetris;

    if (level >= 20) {
      return "Incredible! You're a true Tetris champion! 👑";
    } else if (level >= 15) {
      return "Outstanding performance! You're getting really good! 🌟";
    } else if (level >= 10) {
      return "Great job! You're becoming a Tetris expert! 🎯";
    } else if (tetrisCount >= 5) {
      return "Wow! So many Tetris clears! You're amazing! 🎊";
    } else if (efficiency >= 80) {
      return "Super efficient play! You're thinking like a pro! 💎";
    } else if (level >= 5) {
      return "Nice progress! Keep practicing and you'll get even better! ⭐";
    } else {
      return 'Good effort! Every game makes you better! 🚀';
    }
  }

  /**
   * Format time in MM:SS format
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} - Formatted time string
   */
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Load personal best from localStorage
   * @returns {number} - Personal best score
   */
  loadPersonalBest() {
    try {
      const saved = localStorage.getItem('tetris-kids-personal-best');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.warn('Could not load personal best:', error);
      return 0;
    }
  }

  /**
   * Save personal best to localStorage
   */
  savePersonalBest() {
    try {
      localStorage.setItem('tetris-kids-personal-best', this.score.toString());
    } catch (error) {
      console.warn('Could not save personal best:', error);
    }
  }

  /**
   * Get current score data for display
   * @returns {Object} - Current score information
   */
  getScoreData() {
    return {
      score: this.score,
      level: this.level,
      lines: this.lines,
      personalBest: this.personalBest,
      fallSpeed: this.getFallSpeed(),
      nextLevelLines: LINES_PER_LEVEL - (this.lines % LINES_PER_LEVEL),
      stats: { ...this.stats },
    };
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
          console.error(`Error in ScoreManager ${event} listener:`, error);
        }
      });
    }
  }
}
