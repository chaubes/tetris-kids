/**
 * MenuSystem - Main menu, settings, and navigation screens
 * Handles all non-gameplay UI screens with smooth transitions
 */

import { GAME_STATES, DIFFICULTY_LEVELS, ANIMATIONS } from '../core/Constants.js';

export class MenuSystem {
  constructor() {
    this.currentScreen = 'main';
    this.previousScreen = null;
    this.isAnimating = false;

    // Menu screens
    this.screens = new Map();

    // Game settings
    this.settings = {
      difficulty: 'NORMAL',
      soundEnabled: true,
      musicEnabled: true,
      showGhostPiece: true,
      showGrid: false,
      animationSpeed: 'normal',
      theme: 'default',
    };

    // Load saved settings
    this.loadSettings();

    this.initialize();
  }

  /**
   * Initialize the menu system
   */
  initialize() {
    // Get menu container
    this.menuContainer = document.getElementById('menuContainer');
    if (!this.menuContainer) {
      throw new Error(
        'Menu container not found! Please add <div id="menuContainer"></div> to your HTML',
      );
    }

    this.createMenuScreens();
    this.setupEventListeners();
    this.showScreen('main');

    console.log('🎮 MenuSystem initialized');
  }

  /**
   * Create all menu screens
   */
  createMenuScreens() {
    // Main menu screen
    this.createMainMenuScreen();

    // Settings screen
    this.createSettingsScreen();

    // How to play screen
    this.createHowToPlayScreen();

    // About screen
    this.createAboutScreen();

    // Difficulty selection screen
    this.createDifficultyScreen();
  }

  /**
   * Create main menu screen
   */
  createMainMenuScreen() {
    const mainMenu = document.createElement('div');
    mainMenu.className = 'menu-screen main-menu';
    mainMenu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1 class="menu-title">🧩 Tetris Kids 🌈</h1>
          <p class="menu-subtitle">Stack blocks and have fun!</p>
        </div>
        
        <div class="menu-buttons">
          <button class="btn btn-primary btn-large" data-action="startGame">
            🎮 Start Playing!
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="difficulty">
            ⚙️ Choose Difficulty
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="howToPlay">
            📚 How to Play
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="settings">
            🔧 Settings
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="about">
            ℹ️ About
          </button>
        </div>
        
        <div class="menu-footer">
          <div class="difficulty-indicator">
            <span class="difficulty-label">Current Difficulty:</span>
            <span class="difficulty-value" id="currentDifficulty">${this.settings.difficulty}</span>
          </div>
        </div>
      </div>
    `;

    this.screens.set('main', mainMenu);
  }

  /**
   * Create difficulty selection screen
   */
  createDifficultyScreen() {
    const difficultyScreen = document.createElement('div');
    difficultyScreen.className = 'menu-screen difficulty-screen';

    let difficultyOptions = '';
    Object.entries(DIFFICULTY_LEVELS).forEach(([key, difficulty]) => {
      const isSelected = this.settings.difficulty === key;
      difficultyOptions += `
        <div class="difficulty-option ${isSelected ? 'selected' : ''}" data-difficulty="${key}">
          <div class="difficulty-icon">${this.getDifficultyIcon(key)}</div>
          <div class="difficulty-info">
            <h3 class="difficulty-name">${difficulty.name}</h3>
            <p class="difficulty-description">${difficulty.description}</p>
            <div class="difficulty-stats">
              <span>Starting Level: ${difficulty.startingLevel}</span>
              <span>Speed: ${this.getSpeedDescription(difficulty.fallSpeed)}</span>
            </div>
          </div>
          <div class="difficulty-checkmark">✓</div>
        </div>
      `;
    });

    difficultyScreen.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h2 class="menu-title">🎯 Choose Your Challenge</h2>
          <p class="menu-subtitle">Pick the perfect difficulty for you!</p>
        </div>
        
        <div class="difficulty-options">
          ${difficultyOptions}
        </div>
        
        <div class="menu-buttons">
          <button class="btn btn-primary btn-medium" data-action="confirmDifficulty">
            ✨ Let's Play!
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="back">
            ← Back to Menu
          </button>
        </div>
      </div>
    `;

    this.screens.set('difficulty', difficultyScreen);
  }

  /**
   * Create settings screen
   */
  createSettingsScreen() {
    const settingsScreen = document.createElement('div');
    settingsScreen.className = 'menu-screen settings-screen';
    settingsScreen.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h2 class="menu-title">🔧 Game Settings</h2>
          <p class="menu-subtitle">Customize your Tetris experience!</p>
        </div>
        
        <div class="settings-groups">
          <div class="settings-group">
            <h3 class="settings-group-title">🔊 Audio Settings</h3>
            <div class="settings-options">
              <div class="setting-item">
                <label class="setting-label">Sound Effects</label>
                <button class="btn btn-toggle ${this.settings.soundEnabled ? 'on' : 'off'}" 
                        data-setting="soundEnabled">
                  <span class="toggle-text">${this.settings.soundEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">Background Music</label>
                <button class="btn btn-toggle ${this.settings.musicEnabled ? 'on' : 'off'}" 
                        data-setting="musicEnabled">
                  <span class="toggle-text">${this.settings.musicEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="settings-group">
            <h3 class="settings-group-title">👁️ Visual Settings</h3>
            <div class="settings-options">
              <div class="setting-item">
                <label class="setting-label">Show Ghost Piece</label>
                <button class="btn btn-toggle ${this.settings.showGhostPiece ? 'on' : 'off'}" 
                        data-setting="showGhostPiece">
                  <span class="toggle-text">${this.settings.showGhostPiece ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">Show Grid Lines</label>
                <button class="btn btn-toggle ${this.settings.showGrid ? 'on' : 'off'}" 
                        data-setting="showGrid">
                  <span class="toggle-text">${this.settings.showGrid ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">Animation Speed</label>
                <div class="setting-selector">
                  <button class="btn btn-selector ${this.settings.animationSpeed === 'slow' ? 'selected' : ''}" 
                          data-setting="animationSpeed" data-value="slow">Slow</button>
                  <button class="btn btn-selector ${this.settings.animationSpeed === 'normal' ? 'selected' : ''}" 
                          data-setting="animationSpeed" data-value="normal">Normal</button>
                  <button class="btn btn-selector ${this.settings.animationSpeed === 'fast' ? 'selected' : ''}" 
                          data-setting="animationSpeed" data-value="fast">Fast</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="menu-buttons">
          <button class="btn btn-primary btn-medium" data-action="saveSettings">
            💾 Save Settings
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="resetSettings">
            🔄 Reset to Default
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="back">
            ← Back to Menu
          </button>
        </div>
      </div>
    `;

    this.screens.set('settings', settingsScreen);
  }

  /**
   * Create how to play screen
   */
  createHowToPlayScreen() {
    const howToPlayScreen = document.createElement('div');
    howToPlayScreen.className = 'menu-screen howtoplay-screen';
    howToPlayScreen.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h2 class="menu-title">📚 How to Play Tetris</h2>
          <p class="menu-subtitle">Learn the basics and become a pro!</p>
        </div>
        
        <div class="instructions-content">
          <div class="instruction-section">
            <h3 class="instruction-title">🎮 Controls</h3>
            <div class="controls-grid">
              <div class="control-item">
                <div class="control-key">←</div>
                <div class="control-description">Move piece left</div>
              </div>
              <div class="control-item">
                <div class="control-key">→</div>
                <div class="control-description">Move piece right</div>
              </div>
              <div class="control-item">
                <div class="control-key">↓</div>
                <div class="control-description">Move piece down faster</div>
              </div>
              <div class="control-item">
                <div class="control-key">↑</div>
                <div class="control-description">Rotate piece</div>
              </div>
              <div class="control-item">
                <div class="control-key">Space</div>
                <div class="control-description">Drop piece instantly</div>
              </div>
              <div class="control-item">
                <div class="control-key">P</div>
                <div class="control-description">Pause game</div>
              </div>
            </div>
          </div>
          
          <div class="instruction-section">
            <h3 class="instruction-title">🎯 Goal</h3>
            <div class="goal-description">
              <p>Stack the falling blocks to create complete horizontal lines!</p>
              <p>When you complete a line, it disappears and you get points!</p>
              <p>Try not to let the blocks reach the top of the screen!</p>
            </div>
          </div>
          
          <div class="instruction-section">
            <h3 class="instruction-title">🏆 Scoring</h3>
            <div class="scoring-table">
              <div class="score-row">
                <span class="score-action">Single Line</span>
                <span class="score-points">100 points</span>
              </div>
              <div class="score-row">
                <span class="score-action">Double Lines</span>
                <span class="score-points">300 points</span>
              </div>
              <div class="score-row">
                <span class="score-action">Triple Lines</span>
                <span class="score-points">500 points</span>
              </div>
              <div class="score-row highlight">
                <span class="score-action">TETRIS! (4 lines)</span>
                <span class="score-points">800 points</span>
              </div>
            </div>
          </div>
          
          <div class="instruction-section">
            <h3 class="instruction-title">💡 Tips for Success</h3>
            <ul class="tips-list">
              <li>🧠 Think ahead - look at the next piece coming!</li>
              <li>🎯 Try to keep your stack low and even</li>
              <li>⚡ Save space for the long I-piece to get TETRIS!</li>
              <li>🔄 Rotate pieces to fit in tight spaces</li>
              <li>⏱️ Don't rush - take your time to place pieces well</li>
              <li>🎉 Have fun and don't worry about mistakes!</li>
            </ul>
          </div>
        </div>
        
        <div class="menu-buttons">
          <button class="btn btn-primary btn-medium" data-action="startGame">
            🚀 Ready to Play!
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="back">
            ← Back to Menu
          </button>
        </div>
      </div>
    `;

    this.screens.set('howToPlay', howToPlayScreen);
  }

  /**
   * Create about screen
   */
  createAboutScreen() {
    const aboutScreen = document.createElement('div');
    aboutScreen.className = 'menu-screen about-screen';
    aboutScreen.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h2 class="menu-title">ℹ️ About Tetris Kids</h2>
          <p class="menu-subtitle">A colorful, kid-friendly version of the classic game!</p>
        </div>
        
        <div class="about-content">
          <div class="about-section">
            <h3 class="about-title">🌈 What makes this special?</h3>
            <ul class="features-list">
              <li>🎨 Bright, colorful graphics designed for kids</li>
              <li>🎵 Fun sound effects and cheerful music</li>
              <li>💪 Encouraging messages to keep you motivated</li>
              <li>📱 Works great on phones, tablets, and computers</li>
              <li>♿ Accessible design for everyone to enjoy</li>
              <li>🎮 Multiple difficulty levels to grow with you</li>
            </ul>
          </div>
          
          <div class="about-section">
            <h3 class="about-title">📖 About Tetris</h3>
            <p class="about-text">
              Tetris was created by Alexey Pajitnov in 1985 and has become one of 
              the most beloved puzzle games of all time! This kid-friendly version 
              brings all the fun of the original with colorful graphics and 
              encouraging gameplay perfect for young players.
            </p>
          </div>
          
          <div class="about-section">
            <h3 class="about-title">🎯 Learning Benefits</h3>
            <ul class="benefits-list">
              <li>🧠 Improves spatial reasoning and problem-solving</li>
              <li>👁️ Enhances visual perception and pattern recognition</li>
              <li>⚡ Develops quick decision-making skills</li>
              <li>🤝 Builds hand-eye coordination</li>
              <li>🏆 Encourages persistence and goal achievement</li>
            </ul>
          </div>
        </div>
        
        <div class="menu-buttons">
          <button class="btn btn-primary btn-medium" data-action="startGame">
            🎮 Start Playing!
          </button>
          
          <button class="btn btn-secondary btn-medium" data-action="back">
            ← Back to Menu
          </button>
        </div>
        
        <div class="about-footer">
          <p class="version-info">Tetris Kids v1.0 • Made with ❤️ for young players everywhere!</p>
        </div>
      </div>
    `;

    this.screens.set('about', aboutScreen);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('click', event => {
      const action = event.target.getAttribute('data-action');
      if (action) {
        this.handleAction(action, event.target);
      }

      const setting = event.target.getAttribute('data-setting');
      if (setting) {
        this.handleSettingChange(setting, event.target);
      }

      const difficulty = event.target.getAttribute('data-difficulty');
      if (difficulty) {
        this.handleDifficultySelect(difficulty, event.target);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', event => {
      this.handleKeyboardNavigation(event);
    });

    // Touch/click sound effects
    document.addEventListener('click', event => {
      if (event.target.matches('button, .clickable')) {
        this.playMenuSound('click');
      }
    });
  }

  /**
   * Handle menu actions
   */
  handleAction(action, element) {
    this.playMenuSound('select');

    switch (action) {
      case 'startGame':
        this.emit('startGame', this.settings);
        break;

      case 'difficulty':
        this.showScreen('difficulty');
        break;

      case 'howToPlay':
        this.showScreen('howToPlay');
        break;

      case 'settings':
        this.showScreen('settings');
        break;

      case 'about':
        this.showScreen('about');
        break;

      case 'back':
        this.showPreviousScreen();
        break;

      case 'confirmDifficulty':
        this.confirmDifficultySelection();
        break;

      case 'saveSettings':
        this.saveSettings();
        this.showConfirmationMessage('Settings saved! 💾');
        break;

      case 'resetSettings':
        this.resetSettings();
        this.refreshSettingsScreen();
        this.showConfirmationMessage('Settings reset to default! 🔄');
        break;
    }
  }

  /**
   * Handle setting changes
   */
  handleSettingChange(setting, element) {
    if (element.classList.contains('btn-toggle')) {
      // Toggle boolean settings
      this.settings[setting] = !this.settings[setting];
      this.updateToggleButton(element, this.settings[setting]);
    } else if (element.classList.contains('btn-selector')) {
      // Select value settings
      const value = element.getAttribute('data-value');
      this.settings[setting] = value;
      this.updateSelectorButtons(element.parentElement, value);
    }

    this.playMenuSound('toggle');
  }

  /**
   * Handle difficulty selection
   */
  handleDifficultySelect(difficulty, element) {
    // Remove previous selection
    const previousSelected = element.parentElement.querySelector('.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Add selection to clicked option
    element.classList.add('selected');
    this.settings.difficulty = difficulty;

    this.playMenuSound('select');
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(event) {
    if (this.isAnimating) return;

    switch (event.key) {
      case 'Escape':
        if (this.currentScreen !== 'main') {
          this.showPreviousScreen();
        }
        break;

      case 'Enter':
        const focusedButton = document.activeElement;
        if (focusedButton && focusedButton.tagName === 'BUTTON') {
          focusedButton.click();
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
        this.navigateButtons(event.key === 'ArrowUp' ? -1 : 1);
        event.preventDefault();
        break;
    }
  }

  /**
   * Navigate between buttons with keyboard
   */
  navigateButtons(direction) {
    const currentScreen = this.screens.get(this.currentScreen);
    if (!currentScreen) return;

    const buttons = currentScreen.querySelectorAll('button:not(:disabled)');
    const currentIndex = Array.from(buttons).indexOf(document.activeElement);

    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = direction > 0 ? 0 : buttons.length - 1;
    } else {
      nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
    }

    buttons[nextIndex].focus();
  }

  /**
   * Show a menu screen with animation
   */
  showScreen(screenName) {
    if (this.isAnimating || !this.screens.has(screenName)) return;

    this.isAnimating = true;
    this.previousScreen = this.currentScreen;

    // Hide current screen
    const currentScreenElement = this.screens.get(this.currentScreen);
    if (currentScreenElement) {
      this.hideScreen(currentScreenElement);
    }

    // Show new screen
    setTimeout(() => {
      this.currentScreen = screenName;
      const newScreenElement = this.screens.get(screenName);
      this.displayScreen(newScreenElement);

      this.isAnimating = false;
    }, ANIMATIONS.SLIDE_DURATION);
  }

  /**
   * Show previous screen
   */
  showPreviousScreen() {
    const targetScreen = this.previousScreen || 'main';
    this.showScreen(targetScreen);
  }

  /**
   * Display a screen element
   */
  displayScreen(screenElement) {
    // Clear menu container
    if (this.menuContainer) {
      this.menuContainer.innerHTML = '';

      // Add new screen to menu container
      screenElement.style.animation = 'slideInFromRight 0.3s ease-out';
      this.menuContainer.appendChild(screenElement);

      // Make menu container visible
      this.menuContainer.classList.remove('hidden');

      // Focus first button for keyboard navigation
      setTimeout(() => {
        const firstButton = screenElement.querySelector('button');
        if (firstButton) {
          firstButton.focus();
        }
      }, 100);
    }
  }

  /**
   * Hide a screen element
   */
  hideScreen(screenElement) {
    if (screenElement && screenElement.parentNode) {
      screenElement.style.animation = 'slideOutToLeft 0.2s ease-in';
      setTimeout(() => {
        if (screenElement.parentNode) {
          screenElement.parentNode.removeChild(screenElement);
        }
      }, 200);
    }
  }

  /**
   * Confirm difficulty selection and return to main menu
   */
  confirmDifficultySelection() {
    // Update main menu difficulty display
    const difficultyDisplay = document.getElementById('currentDifficulty');
    if (difficultyDisplay) {
      difficultyDisplay.textContent = this.settings.difficulty;
    }

    this.saveSettings();
    this.showScreen('main');
    this.showConfirmationMessage(`Difficulty set to ${this.settings.difficulty}! 🎯`);
  }

  /**
   * Update toggle button appearance
   */
  updateToggleButton(button, isOn) {
    button.classList.toggle('on', isOn);
    button.classList.toggle('off', !isOn);

    const toggleText = button.querySelector('.toggle-text');
    if (toggleText) {
      toggleText.textContent = isOn ? 'ON' : 'OFF';
    }
  }

  /**
   * Update selector buttons
   */
  updateSelectorButtons(container, selectedValue) {
    container.querySelectorAll('.btn-selector').forEach(btn => {
      const isSelected = btn.getAttribute('data-value') === selectedValue;
      btn.classList.toggle('selected', isSelected);
    });
  }

  /**
   * Refresh settings screen with current values
   */
  refreshSettingsScreen() {
    const settingsScreen = this.screens.get('settings');
    if (!settingsScreen) return;

    // Update toggle buttons
    Object.entries(this.settings).forEach(([key, value]) => {
      const toggleBtn = settingsScreen.querySelector(`[data-setting="${key}"]`);
      if (toggleBtn && toggleBtn.classList.contains('btn-toggle')) {
        this.updateToggleButton(toggleBtn, value);
      }
    });

    // Update selector buttons
    const animationSpeedContainer = settingsScreen.querySelector('.setting-selector');
    if (animationSpeedContainer) {
      this.updateSelectorButtons(animationSpeedContainer, this.settings.animationSpeed);
    }
  }

  /**
   * Show confirmation message
   */
  showConfirmationMessage(message) {
    const confirmation = document.createElement('div');
    confirmation.className = 'confirmation-message';
    confirmation.textContent = message;
    confirmation.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #4ECDC4, #44A08D);
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      font-family: 'Fredoka One', cursive;
      font-size: 16px;
      z-index: 2000;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      animation: confirmationPop 0.5s ease-out;
    `;

    document.body.appendChild(confirmation);

    setTimeout(() => {
      confirmation.style.animation = 'confirmationFade 0.3s ease-in';
      setTimeout(() => {
        if (confirmation.parentNode) {
          confirmation.parentNode.removeChild(confirmation);
        }
      }, 300);
    }, 2000);
  }

  /**
   * Get difficulty icon
   */
  getDifficultyIcon(difficulty) {
    const icons = {
      EASY: '🌱',
      NORMAL: '⚡',
      HARD: '🔥',
    };
    return icons[difficulty] || '⚡';
  }

  /**
   * Get speed description
   */
  getSpeedDescription(speed) {
    if (speed >= 1200) return 'Relaxed';
    if (speed >= 1000) return 'Moderate';
    return 'Fast';
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('tetrisKidsSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('tetrisKidsSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Could not save settings:', error);
    }
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    this.settings = {
      difficulty: 'NORMAL',
      soundEnabled: true,
      musicEnabled: true,
      showGhostPiece: true,
      showGrid: false,
      animationSpeed: 'normal',
      theme: 'default',
    };
  }

  /**
   * Play menu sound effect
   */
  playMenuSound(type) {
    this.emit('playMenuSound', type);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update a specific setting
   */
  updateSetting(key, value) {
    if (this.settings.hasOwnProperty(key)) {
      this.settings[key] = value;
      this.saveSettings();
    }
  }

  /**
   * Hide all menu screens
   */
  hideAllScreens() {
    if (this.menuContainer) {
      // Add fade out animation to container
      this.menuContainer.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        // Clear container and hide it
        this.menuContainer.innerHTML = '';
        this.menuContainer.classList.add('hidden');
        this.menuContainer.style.animation = '';
      }, 300);
    }
  }

  /**
   * Show main menu
   */
  showMainMenu() {
    this.showScreen('main');
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
          console.error(`Error in MenuSystem ${event} listener:`, error);
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
   * Get current screen
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Check if menu is currently visible
   */
  isVisible() {
    return (
      this.menuContainer &&
      !this.menuContainer.classList.contains('hidden') &&
      this.menuContainer.children.length > 0
    );
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.hideAllScreens();

    if (this.eventListeners) {
      this.eventListeners.clear();
    }

    this.screens.clear();

    console.log('🧹 MenuSystem destroyed');
  }
}
