/**
 * GameUI - Complete HUD system with kid-friendly interface
 * Manages score display, messages, overlays, and interactive elements
 */

import { GAME_STATES, COLORS, ANIMATIONS } from '../core/Constants.js';

export class GameUI {
  constructor() {
    // UI Elements
    this.elements = {
      score: document.getElementById('score'),
      level: document.getElementById('level'),
      lines: document.getElementById('lines'),
      gameOverlay: document.getElementById('gameOverlay'),
      overlayTitle: document.getElementById('overlayTitle'),
      overlayMessage: document.getElementById('overlayMessage'),
      restartBtn: document.getElementById('restartBtn'),
      menuBtn: document.getElementById('menuBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      muteBtn: document.getElementById('muteBtn'),
      loadingScreen: document.getElementById('loadingScreen'),
    };

    // Game state
    this.currentGameState = GAME_STATES.MENU;
    this.isVisible = true;
    this.isMuted = false;

    // Kid-friendly messages and encouragements
    this.encouragementMessages = {
      score: {
        100: 'Great start! 🌟',
        500: "You're doing awesome! 🎉",
        1000: 'Fantastic! Keep it up! 🚀',
        2500: "You're a star! ⭐",
        5000: 'Amazing skills! 🎯',
        10000: 'Tetris master! 👑',
        25000: 'Incredible! 🎊',
        50000: 'Legendary player! 🏆',
      },
      lines: {
        1: 'Nice line! 👍',
        5: 'Getting better! 💪',
        10: 'Double digits! 🔥',
        25: 'Quarter way there! 🎮',
        50: 'Halfway hero! 🌈',
        75: 'Three quarters! 🎯',
        100: 'Century club! 🎉',
        150: 'Line master! 👑',
      },
      level: {
        2: 'Level up! 🆙',
        5: 'Speeding up! ⚡',
        10: 'Double digits! 🎯',
        15: 'Expert level! 🧠',
        20: 'Master level! 👑',
      },
      special: [
        'Fantastic! 🌟',
        'Incredible! 🎉',
        'Amazing work! 🚀',
        'Keep going! 💪',
        'You rock! 🎸',
        'Spectacular! ✨',
        'Outstanding! 🏆',
        'Brilliant! 💎',
        'Superb! 🎭',
        'Excellent! 🎊',
      ],
    };

    // Animation queues
    this.scoreAnimations = [];
    this.messageQueue = [];
    this.currentMessage = null;
    this.messageTimeout = null;

    // Achievement tracking
    this.lastScore = 0;
    this.lastLines = 0;
    this.lastLevel = 1;
    this.achievementShown = new Set();

    this.initialize();
  }

  /**
   * Initialize the UI system
   */
  initialize() {
    this.setupEventListeners();
    this.createMessageContainer();
    this.setupAccessibility();
    this.hideLoadingScreen();

    console.log('🎨 GameUI system initialized');
  }

  /**
   * Setup event listeners for UI interactions
   */
  setupEventListeners() {
    // Game control buttons
    if (this.elements.pauseBtn) {
      this.elements.pauseBtn.addEventListener('click', () => {
        this.emit('pauseToggle');
        this.playButtonSound();
      });
    }

    if (this.elements.muteBtn) {
      this.elements.muteBtn.addEventListener('click', () => {
        this.toggleMute();
        this.playButtonSound();
      });
    }

    if (this.elements.restartBtn) {
      this.elements.restartBtn.addEventListener('click', () => {
        this.emit('gameRestart');
        this.playButtonSound();
      });
    }

    if (this.elements.menuBtn) {
      this.elements.menuBtn.addEventListener('click', () => {
        this.emit('showMenu');
        this.playButtonSound();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', event => {
      this.handleKeyboardShortcuts(event);
    });

    // Window visibility for auto-pause
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentGameState === GAME_STATES.PLAYING) {
        this.emit('pauseToggle');
      }
    });
  }

  /**
   * Create message container for floating messages
   */
  createMessageContainer() {
    this.messageContainer = document.createElement('div');
    this.messageContainer.className = 'floating-messages';
    this.messageContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 100;
      font-family: 'Fredoka One', cursive;
      text-align: center;
      width: 100%;
    `;

    // Find the game board container to append messages
    const gameBoard = document.querySelector('.game-board-container');
    if (gameBoard) {
      gameBoard.style.position = 'relative';
      gameBoard.appendChild(this.messageContainer);
    }
  }

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Add ARIA labels
    if (this.elements.score) {
      this.elements.score.setAttribute('aria-live', 'polite');
      this.elements.score.setAttribute('aria-label', 'Current score');
    }

    if (this.elements.level) {
      this.elements.level.setAttribute('aria-live', 'polite');
      this.elements.level.setAttribute('aria-label', 'Current level');
    }

    if (this.elements.lines) {
      this.elements.lines.setAttribute('aria-live', 'polite');
      this.elements.lines.setAttribute('aria-label', 'Lines cleared');
    }

    // High contrast mode detection
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.enableHighContrastMode();
    }

    // Reduced motion detection
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reduceMotion = true;
    }
  }

  /**
   * Update the game UI with current state
   */
  update(gameState, gameData) {
    this.currentGameState = gameState.gameState;

    // Update score display with animation
    if (gameState.score !== this.lastScore) {
      this.updateScore(gameState.score);
      this.checkScoreAchievements(gameState.score);
      this.lastScore = gameState.score;
    }

    // Update level with celebration
    if (gameState.level !== this.lastLevel) {
      this.updateLevel(gameState.level);
      this.checkLevelAchievements(gameState.level);
      this.lastLevel = gameState.level;
    }

    // Update lines with encouragement
    if (gameState.lines !== this.lastLines) {
      this.updateLines(gameState.lines);
      this.checkLineAchievements(gameState.lines);
      this.lastLines = gameState.lines;
    }

    // Update UI state based on game state
    this.updateGameStateUI(gameState.gameState);

    // Update button states
    this.updateButtonStates(gameState);

    // Process message queue
    this.processMessageQueue();
  }

  /**
   * Update score display with smooth animation
   */
  updateScore(newScore) {
    if (!this.elements.score) return;

    const currentScore = parseInt(this.elements.score.textContent) || 0;
    const scoreDiff = newScore - currentScore;

    if (scoreDiff > 0) {
      // Animate score counting up
      this.animateScoreCounter(currentScore, newScore, 500);

      // Add visual feedback
      this.elements.score.parentElement.classList.add('score-pulse');
      setTimeout(() => {
        this.elements.score.parentElement.classList.remove('score-pulse');
      }, 300);

      // Show floating score if significant gain
      if (scoreDiff >= 100) {
        this.showFloatingScore(scoreDiff);
      }
    }
  }

  /**
   * Animate score counter
   */
  animateScoreCounter(from, to, duration) {
    const startTime = Date.now();
    const scoreDiff = to - from;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(from + scoreDiff * easeProgress);

      if (this.elements.score) {
        this.elements.score.textContent = currentValue.toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Update level display with celebration
   */
  updateLevel(newLevel) {
    if (!this.elements.level) return;

    this.elements.level.textContent = newLevel;

    // Level up celebration
    this.elements.level.parentElement.classList.add('level-celebration');
    setTimeout(() => {
      this.elements.level.parentElement.classList.remove('level-celebration');
    }, 1000);

    // Show level up message
    this.showEncouragementMessage('level', newLevel);
  }

  /**
   * Update lines display
   */
  updateLines(newLines) {
    if (!this.elements.lines) return;

    this.elements.lines.textContent = newLines;

    // Visual feedback for milestone
    if (newLines % 10 === 0 && newLines > 0) {
      this.elements.lines.parentElement.classList.add('lines-milestone');
      setTimeout(() => {
        this.elements.lines.parentElement.classList.remove('lines-milestone');
      }, 500);
    }
  }

  /**
   * Update UI based on game state
   */
  updateGameStateUI(gameState) {
    switch (gameState) {
      case GAME_STATES.PLAYING:
        this.hideOverlay();
        this.updatePauseButton(false);
        break;

      case GAME_STATES.PAUSED:
        this.showPauseOverlay();
        this.updatePauseButton(true);
        break;

      case GAME_STATES.GAME_OVER:
        this.showGameOverOverlay();
        break;

      case GAME_STATES.MENU:
        this.hideOverlay();
        break;
    }
  }

  /**
   * Update button states
   */
  updateButtonStates(gameState) {
    // Update pause button
    if (this.elements.pauseBtn) {
      const isPaused = gameState.gameState === GAME_STATES.PAUSED;
      this.elements.pauseBtn.innerHTML = isPaused ? '▶️ Resume' : '⏸️ Pause';
      this.elements.pauseBtn.setAttribute('aria-label', isPaused ? 'Resume game' : 'Pause game');
    }

    // Update mute button
    if (this.elements.muteBtn) {
      this.elements.muteBtn.innerHTML = this.isMuted ? '🔇 Unmute' : '🔊 Sound';
      this.elements.muteBtn.setAttribute('aria-label', this.isMuted ? 'Unmute game' : 'Mute game');
    }
  }

  /**
   * Show pause overlay
   */
  showPauseOverlay() {
    if (!this.elements.gameOverlay) return;

    this.elements.overlayTitle.textContent = 'Game Paused';
    this.elements.overlayMessage.textContent =
      'Take a break! Press space or click Resume to continue.';
    this.elements.restartBtn.style.display = 'none';
    this.elements.menuBtn.style.display = 'inline-flex';

    this.showOverlay();
  }

  /**
   * Show game over overlay with encouragement
   */
  showGameOverOverlay(stats = {}) {
    if (!this.elements.gameOverlay) return;

    this.elements.overlayTitle.textContent = 'Great Job!';

    // Create encouraging message based on performance
    const message = this.generateGameOverMessage(stats);
    this.elements.overlayMessage.innerHTML = message;

    this.elements.restartBtn.style.display = 'inline-flex';
    this.elements.menuBtn.style.display = 'inline-flex';

    this.showOverlay();
  }

  /**
   * Generate encouraging game over message
   */
  generateGameOverMessage(stats) {
    const score = stats.score || 0;
    const lines = stats.lines || 0;
    const level = stats.level || 1;

    let message = 'You did amazing! 🌟<br>';

    if (score > 10000) {
      message += "Wow! Over 10,000 points! You're incredible! 🏆";
    } else if (score > 5000) {
      message += "Fantastic score! You're getting really good at this! 🎯";
    } else if (score > 1000) {
      message += "Great job! You're improving with every game! 🚀";
    } else {
      message += "Keep practicing and you'll be a Tetris master! 💪";
    }

    message += `<br><br>📊 Final Score: <strong>${score.toLocaleString()}</strong><br>`;
    message += `📏 Lines Cleared: <strong>${lines}</strong><br>`;
    message += `🎚️ Level Reached: <strong>${level}</strong>`;

    return message;
  }

  /**
   * Show overlay with animation
   */
  showOverlay() {
    if (!this.elements.gameOverlay) return;

    this.elements.gameOverlay.classList.remove('hidden');
    this.elements.gameOverlay.style.animation = 'overlaySlideIn 0.3s ease-out';
  }

  /**
   * Hide overlay
   */
  hideOverlay() {
    if (!this.elements.gameOverlay) return;

    this.elements.gameOverlay.classList.add('hidden');
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    if (this.elements.loadingScreen) {
      setTimeout(() => {
        this.elements.loadingScreen.classList.add('hidden');
      }, 1000);
    }
  }

  /**
   * Show floating score
   */
  showFloatingScore(points) {
    const floatingScore = document.createElement('div');
    floatingScore.className = 'floating-score';
    floatingScore.textContent = `+${points}`;
    floatingScore.style.cssText = `
      position: absolute;
      color: #FFD700;
      font-family: 'Fredoka One', cursive;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      pointer-events: none;
      z-index: 200;
      animation: floatUp 1s ease-out forwards;
    `;

    if (this.messageContainer) {
      this.messageContainer.appendChild(floatingScore);
      setTimeout(() => {
        if (floatingScore.parentNode) {
          floatingScore.parentNode.removeChild(floatingScore);
        }
      }, 1000);
    }
  }

  /**
   * Show encouragement message
   */
  showEncouragementMessage(type, value) {
    const messages = this.encouragementMessages[type];
    if (!messages || this.achievementShown.has(`${type}_${value}`)) return;

    let message = messages[value];
    if (!message) {
      // Find closest message
      const keys = Object.keys(messages)
        .map(k => parseInt(k))
        .sort((a, b) => a - b);
      const closestKey = keys.reverse().find(k => k <= value);
      message = messages[closestKey];
    }

    if (message) {
      this.queueMessage(message, 2000, '#4ECDC4');
      this.achievementShown.add(`${type}_${value}`);
    }
  }

  /**
   * Queue a message to display
   */
  queueMessage(text, duration = 2000, color = '#FFFFFF') {
    this.messageQueue.push({
      text: text,
      duration: duration,
      color: color,
      timestamp: Date.now(),
    });
  }

  /**
   * Process message queue
   */
  processMessageQueue() {
    if (this.currentMessage || this.messageQueue.length === 0) return;

    const message = this.messageQueue.shift();
    this.displayMessage(message);
  }

  /**
   * Display a floating message
   */
  displayMessage(message) {
    this.currentMessage = document.createElement('div');
    this.currentMessage.className = 'floating-message';
    this.currentMessage.textContent = message.text;
    this.currentMessage.style.cssText = `
      color: ${message.color};
      font-family: 'Fredoka One', cursive;
      font-size: 20px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      text-align: center;
      animation: messageSlideIn 0.5s ease-out;
      white-space: nowrap;
    `;

    if (this.messageContainer) {
      this.messageContainer.appendChild(this.currentMessage);

      this.messageTimeout = setTimeout(() => {
        if (this.currentMessage && this.currentMessage.parentNode) {
          this.currentMessage.style.animation = 'messageSlideOut 0.3s ease-in';
          setTimeout(() => {
            if (this.currentMessage && this.currentMessage.parentNode) {
              this.currentMessage.parentNode.removeChild(this.currentMessage);
            }
            this.currentMessage = null;
          }, 300);
        }
      }, message.duration);
    }
  }

  /**
   * Check score achievements
   */
  checkScoreAchievements(score) {
    const milestones = Object.keys(this.encouragementMessages.score).map(k => parseInt(k));
    const milestone = milestones.find(m => score >= m && this.lastScore < m);

    if (milestone) {
      this.showEncouragementMessage('score', milestone);
    }
  }

  /**
   * Check line achievements
   */
  checkLineAchievements(lines) {
    const milestones = Object.keys(this.encouragementMessages.lines).map(k => parseInt(k));
    const milestone = milestones.find(m => lines >= m && this.lastLines < m);

    if (milestone) {
      this.showEncouragementMessage('lines', milestone);
    }
  }

  /**
   * Check level achievements
   */
  checkLevelAchievements(level) {
    if (level > this.lastLevel) {
      this.showEncouragementMessage('level', level);
    }
  }

  /**
   * Handle line clear with special message
   */
  handleLineClear(count, isSpecial = false) {
    const messages = {
      1: ['Nice! 👍', 'Good job! ⭐', 'Keep it up! 💪'],
      2: ['Double! 🎉', 'Great work! 🌟', 'Excellent! ✨'],
      3: ['Triple! 🔥', 'Amazing! 🚀', 'Fantastic! 🎯'],
      4: ['TETRIS! 🏆', 'INCREDIBLE! 👑', 'LEGENDARY! ⚡'],
    };

    if (isSpecial) {
      this.queueMessage('SPECIAL CLEAR! ✨', 2500, '#FF69B4');
    } else {
      const messageList = messages[count] || messages[1];
      const message = messageList[Math.floor(Math.random() * messageList.length)];
      const color = count >= 4 ? '#FFD700' : count >= 3 ? '#FF6B6B' : '#4ECDC4';

      this.queueMessage(message, 1500, color);
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.emit('muteToggle', this.isMuted);

    // Show mute status message
    const message = this.isMuted ? 'Sound OFF 🔇' : 'Sound ON 🔊';
    this.queueMessage(message, 1000, '#FFA500');
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    switch (event.key) {
      case 'Escape':
      case 'p':
      case 'P':
        if (
          this.currentGameState === GAME_STATES.PLAYING ||
          this.currentGameState === GAME_STATES.PAUSED
        ) {
          this.emit('pauseToggle');
          event.preventDefault();
        }
        break;

      case 'm':
      case 'M':
        this.toggleMute();
        event.preventDefault();
        break;

      case 'Enter':
        if (this.currentGameState === GAME_STATES.GAME_OVER) {
          this.emit('gameRestart');
          event.preventDefault();
        }
        break;
    }
  }

  /**
   * Play button sound (placeholder for audio system)
   */
  playButtonSound() {
    // This will be connected to the audio system
    this.emit('playSound', 'button');
  }

  /**
   * Enable high contrast mode
   */
  enableHighContrastMode() {
    document.body.classList.add('high-contrast');

    // Update message colors for better visibility
    this.encouragementMessages.highContrast = true;
  }

  /**
   * Update pause button state
   */
  updatePauseButton(isPaused) {
    if (!this.elements.pauseBtn) return;

    this.elements.pauseBtn.innerHTML = isPaused ? '▶️ Resume' : '⏸️ Pause';
    this.elements.pauseBtn.classList.toggle('paused', isPaused);
  }

  /**
   * Show celebration for special achievement
   */
  showAchievement(title, description, icon = '🏆') {
    const achievement = document.createElement('div');
    achievement.className = 'achievement-popup';
    achievement.innerHTML = `
      <div class="achievement-icon">${icon}</div>
      <div class="achievement-text">
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    `;
    achievement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 3px solid #FFD700;
      border-radius: 15px;
      padding: 15px;
      color: white;
      font-family: 'Fredoka', cursive;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 300px;
      animation: achievementSlideIn 0.5s ease-out;
    `;

    document.body.appendChild(achievement);

    setTimeout(() => {
      achievement.style.animation = 'achievementSlideOut 0.3s ease-in';
      setTimeout(() => {
        if (achievement.parentNode) {
          achievement.parentNode.removeChild(achievement);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Event emission system
   */
  emit(event, ...args) {
    if (this.eventListeners && this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in GameUI ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Reset UI state for new game
   */
  reset() {
    // Reset scores
    if (this.elements.score) this.elements.score.textContent = '0';
    if (this.elements.level) this.elements.level.textContent = '1';
    if (this.elements.lines) this.elements.lines.textContent = '0';

    // Clear achievements
    this.achievementShown.clear();

    // Reset tracking
    this.lastScore = 0;
    this.lastLines = 0;
    this.lastLevel = 1;

    // Clear messages
    this.messageQueue = [];
    if (this.currentMessage && this.currentMessage.parentNode) {
      this.currentMessage.parentNode.removeChild(this.currentMessage);
      this.currentMessage = null;
    }

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  /**
   * Get current UI state
   */
  getState() {
    return {
      gameState: this.currentGameState,
      isVisible: this.isVisible,
      isMuted: this.isMuted,
      messageQueue: this.messageQueue.length,
      achievementsShown: this.achievementShown.size,
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageQueue = [];
    this.achievementShown.clear();

    if (this.eventListeners) {
      this.eventListeners.clear();
    }

    console.log('🧹 GameUI destroyed');
  }
}
