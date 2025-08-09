/**
 * InputController - Handles keyboard and touch input with visual feedback
 * Provides responsive controls for both desktop and mobile devices
 */

import { KEYS, TOUCH_CONFIG, TIMING } from '../core/Constants.js';

export class InputController {
  constructor() {
    // Input state
    this.keysPressed = new Map();
    this.touchState = new Map();

    // Touch controls elements
    this.touchButtons = new Map();

    // Input timing and repeat
    this.keyRepeatTimers = new Map();
    this.touchRepeatTimers = new Map();
    this.repeatDelay = 150; // Initial delay before repeat
    this.repeatRate = 50; // Time between repeats

    // Touch gesture detection
    this.touchStartTime = 0;
    this.touchStartPos = { x: 0, y: 0 };
    this.isSwipeGesture = false;

    // Visual feedback
    this.feedbackElements = new Map();
    this.vibrationSupported = 'vibrate' in navigator;

    // Input buffer for smooth gameplay
    this.inputBuffer = [];
    this.bufferSize = 10;

    // Settings
    this.settings = {
      keyboardEnabled: true,
      touchEnabled: true,
      vibrationEnabled: true,
      visualFeedbackEnabled: true,
      swipeGestures: true,
      doubleTapToRotate: true,
    };

    this.initialize();
  }

  /**
   * Initialize the input controller
   */
  initialize() {
    this.setupTouchControls();
    this.setupKeyboardListeners();
    this.setupTouchListeners();
    this.setupVisualFeedback();
    this.detectInputCapabilities();

    console.log('🎮 InputController initialized');
  }

  /**
   * Setup touch control buttons
   */
  setupTouchControls() {
    // Get touch control buttons from DOM
    const touchControlSelectors = {
      left: '#leftBtn',
      right: '#rightBtn',
      down: '#downBtn',
      rotate: '#rotateBtn',
      drop: '#dropBtn',
    };

    Object.entries(touchControlSelectors).forEach(([action, selector]) => {
      const button = document.querySelector(selector);
      if (button) {
        this.touchButtons.set(action, button);
        this.setupTouchButton(button, action);
      }
    });

    // Show/hide touch controls based on device
    this.updateTouchControlsVisibility();
  }

  /**
   * Setup individual touch button
   */
  setupTouchButton(button, action) {
    // Set touch-friendly attributes
    button.style.touchAction = 'manipulation';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.webkitTouchCallout = 'none';
    
    // Visual feedback on touch
    button.addEventListener('touchstart', event => {
      event.preventDefault();
      event.stopPropagation();
      this.handleTouchButtonStart(action, button);
    }, { passive: false });

    button.addEventListener('touchend', event => {
      event.preventDefault();
      event.stopPropagation();
      this.handleTouchButtonEnd(action, button);
    }, { passive: false });

    button.addEventListener('touchcancel', event => {
      event.preventDefault();
      event.stopPropagation();
      this.handleTouchButtonEnd(action, button);
    }, { passive: false });

    // Prevent touch move from interfering
    button.addEventListener('touchmove', event => {
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });

    // Mouse events for desktop testing
    button.addEventListener('mousedown', event => {
      event.preventDefault();
      event.stopPropagation();
      this.handleTouchButtonStart(action, button);
    });

    button.addEventListener('mouseup', event => {
      event.preventDefault();
      event.stopPropagation();
      this.handleTouchButtonEnd(action, button);
    });

    button.addEventListener('mouseleave', event => {
      event.preventDefault();
      this.handleTouchButtonEnd(action, button);
    });

    // Add accessibility attributes
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', this.getActionLabel(action));
    button.setAttribute('tabindex', '0');

    // Prevent context menu and selection
    button.addEventListener('contextmenu', event => {
      event.preventDefault();
    });

    button.addEventListener('selectstart', event => {
      event.preventDefault();
    });

    // Improve focus handling for accessibility
    button.addEventListener('focus', () => {
      if (!('ontouchstart' in window)) {
        button.style.outline = '3px solid #ffeb3b';
      }
    });

    button.addEventListener('blur', () => {
      button.style.outline = '';
    });
  }

  /**
   * Handle touch button press start
   */
  handleTouchButtonStart(action, button) {
    if (!this.settings.touchEnabled) return;

    // Visual feedback
    this.addTouchFeedback(button);

    // Vibration feedback
    this.triggerVibration('light');

    // Emit input event
    this.emitInputEvent(action, 'start');

    // Setup repeat for movement actions
    if (['left', 'right', 'down'].includes(action)) {
      this.setupTouchRepeat(action);
    }

    // Play sound effect
    this.playInputSound(action);
  }

  /**
   * Handle touch button press end
   */
  handleTouchButtonEnd(action, button) {
    // Remove visual feedback
    this.removeTouchFeedback(button);

    // Clear repeat timer
    this.clearTouchRepeat(action);

    // Emit input event
    this.emitInputEvent(action, 'end');
  }

  /**
   * Setup keyboard event listeners
   */
  setupKeyboardListeners() {
    document.addEventListener('keydown', event => {
      this.handleKeyDown(event);
    });

    document.addEventListener('keyup', event => {
      this.handleKeyUp(event);
    });

    // Prevent default behavior for game keys
    document.addEventListener('keypress', event => {
      if (this.isGameKey(event.code || event.key)) {
        event.preventDefault();
      }
    });
  }

  /**
   * Setup touch gesture listeners
   */
  setupTouchListeners() {
    if (!this.settings.swipeGestures) return;

    const gameArea = document.querySelector('.game-board-container') || document.body;

    gameArea.addEventListener('touchstart', event => {
      this.handleTouchStart(event);
    }, { passive: false });

    gameArea.addEventListener('touchmove', event => {
      this.handleTouchMove(event);
    }, { passive: false });

    gameArea.addEventListener('touchend', event => {
      this.handleTouchEnd(event);
    }, { passive: false });

    // Add additional touch listeners for better mobile support
    gameArea.addEventListener('touchcancel', event => {
      this.handleTouchCancel(event);
    }, { passive: false });

    // Prevent default touch behaviors on the game area
    gameArea.style.touchAction = 'none';
    gameArea.style.userSelect = 'none';
    gameArea.style.webkitUserSelect = 'none';
    gameArea.style.webkitTouchCallout = 'none';
  }

  /**
   * Handle keyboard key down
   */
  handleKeyDown(event) {
    if (!this.settings.keyboardEnabled) return;

    const key = event.code || event.key;

    // Prevent default for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }

    // Ignore if key is already pressed (avoid key repeat)
    if (this.keysPressed.get(key)) return;

    this.keysPressed.set(key, true);

    // Convert key to action and emit
    const action = this.keyToAction(key);
    if (action) {
      this.emitInputEvent(action, 'press');
      this.addKeyboardFeedback(key);

      // Setup repeat for movement keys
      if (['left', 'right', 'down'].includes(action)) {
        this.setupKeyRepeat(key, action);
      }

      this.playInputSound(action);
    }
  }

  /**
   * Handle keyboard key up
   */
  handleKeyUp(event) {
    const key = event.code || event.key;

    this.keysPressed.set(key, false);
    this.clearKeyRepeat(key);

    const action = this.keyToAction(key);
    if (action) {
      this.emitInputEvent(action, 'release');
      this.removeKeyboardFeedback(key);
    }
  }

  /**
   * Handle touch gesture start
   */
  handleTouchStart(event) {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    this.touchCurrentPos = { x: touch.clientX, y: touch.clientY };
    this.isSwipeGesture = false;
    this.swipeDirection = null;
    this.hasMoved = false;
  }

  /**
   * Handle touch gesture move
   */
  handleTouchMove(event) {
    if (!this.settings.swipeGestures || event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.touchCurrentPos = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = touch.clientX - this.touchStartPos.x;
    const deltaY = touch.clientY - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Mark as moved if we've gone beyond a small threshold
    if (distance > 10) {
      this.hasMoved = true;
    }

    if (distance > TOUCH_CONFIG.SWIPE_THRESHOLD) {
      this.isSwipeGesture = true;
      
      // Determine swipe direction early for better responsiveness
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > absY) {
        // Horizontal swipe
        this.swipeDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        this.swipeDirection = deltaY > 0 ? 'down' : 'up';
      }
      
      event.preventDefault(); // Prevent scrolling
    }
  }

  /**
   * Handle touch gesture end
   */
  handleTouchEnd(event) {
    const touchDuration = Date.now() - this.touchStartTime;

    // Handle tap gestures (only if we haven't moved much and it was quick)
    if (!this.hasMoved && touchDuration < TOUCH_CONFIG.TAP_THRESHOLD) {
      // Single tap to drop (if not on a control button)
      if (!event.target.matches('.btn-touch')) {
        this.emitInputEvent('drop', 'tap');
        this.playInputSound('drop');
        this.triggerVibration('light');
      }
      return;
    }

    // Handle swipe gestures
    if (this.isSwipeGesture && this.swipeDirection) {
      event.preventDefault();
      
      // Use the direction we detected during the swipe for immediate response
      switch (this.swipeDirection) {
        case 'left':
          this.emitInputEvent('left', 'swipe');
          this.playInputSound('left');
          this.triggerVibration('light');
          break;
        case 'right':
          this.emitInputEvent('right', 'swipe');
          this.playInputSound('right');
          this.triggerVibration('light');
          break;
        case 'down':
          this.emitInputEvent('down', 'swipe');
          this.playInputSound('down');
          this.triggerVibration('light');
          break;
        case 'up':
          this.emitInputEvent('rotate', 'swipe');
          this.playInputSound('rotate');
          this.triggerVibration('medium');
          break;
      }
    }

    // Reset gesture state
    this.isSwipeGesture = false;
    this.swipeDirection = null;
    this.hasMoved = false;
  }

  /**
   * Handle touch gesture cancel
   */
  handleTouchCancel(event) {
    // Reset gesture state
    this.isSwipeGesture = false;
    this.swipeDirection = null;
    this.hasMoved = false;
  }

  /**
   * Setup key repeat for held keys
   */
  setupKeyRepeat(key, action) {
    this.clearKeyRepeat(key);

    const repeatTimer = setTimeout(() => {
      const intervalTimer = setInterval(() => {
        if (this.keysPressed.get(key)) {
          this.emitInputEvent(action, 'repeat');
        } else {
          clearInterval(intervalTimer);
        }
      }, this.repeatRate);

      this.keyRepeatTimers.set(key, intervalTimer);
    }, this.repeatDelay);

    this.keyRepeatTimers.set(key, repeatTimer);
  }

  /**
   * Setup touch repeat for held touch buttons
   */
  setupTouchRepeat(action) {
    this.clearTouchRepeat(action);

    const repeatTimer = setTimeout(() => {
      const intervalTimer = setInterval(() => {
        this.emitInputEvent(action, 'repeat');
      }, this.repeatRate);

      this.touchRepeatTimers.set(action, intervalTimer);
    }, this.repeatDelay);

    this.touchRepeatTimers.set(action, repeatTimer);
  }

  /**
   * Clear key repeat timer
   */
  clearKeyRepeat(key) {
    const timer = this.keyRepeatTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.keyRepeatTimers.delete(key);
    }
  }

  /**
   * Clear touch repeat timer
   */
  clearTouchRepeat(action) {
    const timer = this.touchRepeatTimers.get(action);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.touchRepeatTimers.delete(action);
    }
  }

  /**
   * Add visual feedback for touch button
   */
  addTouchFeedback(button) {
    if (!this.settings.visualFeedbackEnabled) return;

    button.classList.add('pressed');
    button.style.transform = 'scale(0.95)';
    button.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.3)';

    // Add ripple effect
    this.createRippleEffect(button);
  }

  /**
   * Remove visual feedback for touch button
   */
  removeTouchFeedback(button) {
    button.classList.remove('pressed');
    button.style.transform = '';
    button.style.boxShadow = '';
  }

  /**
   * Add visual feedback for keyboard
   */
  addKeyboardFeedback(key) {
    if (!this.settings.visualFeedbackEnabled) return;

    // Create visual indicator for keyboard input
    const indicator = document.createElement('div');
    indicator.className = 'keyboard-indicator';
    indicator.textContent = this.getKeyDisplayName(key);
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 15px;
      font-family: 'Fredoka', cursive;
      font-size: 12px;
      z-index: 1000;
      animation: keyboardFadeIn 0.2s ease-out;
    `;

    document.body.appendChild(indicator);
    this.feedbackElements.set(key, indicator);
  }

  /**
   * Remove visual feedback for keyboard
   */
  removeKeyboardFeedback(key) {
    const indicator = this.feedbackElements.get(key);
    if (indicator && indicator.parentNode) {
      indicator.style.animation = 'keyboardFadeOut 0.2s ease-in';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 200);
      this.feedbackElements.delete(key);
    }
  }

  /**
   * Create ripple effect on button press
   */
  createRippleEffect(button) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      background: rgba(255,255,255,0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: rippleExpand 0.3s ease-out;
      pointer-events: none;
      top: 50%;
      left: 50%;
    `;

    button.style.position = 'relative';
    button.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 300);
  }

  /**
   * Trigger haptic feedback
   */
  triggerVibration(intensity = 'light') {
    if (!this.settings.vibrationEnabled || !this.vibrationSupported) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [100, 50, 100],
    };

    const pattern = patterns[intensity] || patterns.light;
    navigator.vibrate(pattern);
  }

  /**
   * Convert keyboard key to game action
   */
  keyToAction(key) {
    const keyMap = {
      [KEYS.LEFT]: 'left',
      [KEYS.RIGHT]: 'right',
      [KEYS.DOWN]: 'down',
      [KEYS.UP]: 'rotate',
      [KEYS.SPACE]: 'drop',
      KeyZ: 'rotateCounterClockwise',
      KeyX: 'rotateClockwise',
      KeyC: 'hold',
      [KEYS.P]: 'pause',
      [KEYS.ENTER]: 'confirm',
      [KEYS.ESCAPE]: 'cancel',
    };

    return keyMap[key];
  }

  /**
   * Check if key is a game control key
   */
  isGameKey(key) {
    const gameKeys = [
      KEYS.LEFT,
      KEYS.RIGHT,
      KEYS.DOWN,
      KEYS.UP,
      KEYS.SPACE,
      'KeyZ',
      'KeyX',
      'KeyC',
      KEYS.P,
      KEYS.ENTER,
      KEYS.ESCAPE,
    ];

    return gameKeys.includes(key);
  }

  /**
   * Get action label for accessibility
   */
  getActionLabel(action) {
    const labels = {
      left: 'Move piece left',
      right: 'Move piece right',
      down: 'Move piece down',
      rotate: 'Rotate piece',
      drop: 'Drop piece instantly',
    };

    return labels[action] || 'Game control';
  }

  /**
   * Get display name for keyboard key
   */
  getKeyDisplayName(key) {
    const displayNames = {
      [KEYS.LEFT]: '←',
      [KEYS.RIGHT]: '→',
      [KEYS.DOWN]: '↓',
      [KEYS.UP]: '↑',
      [KEYS.SPACE]: 'Space',
      KeyZ: 'Z',
      KeyX: 'X',
      KeyC: 'C',
      [KEYS.P]: 'P',
    };

    return displayNames[key] || key;
  }

  /**
   * Detect input capabilities
   */
  detectInputCapabilities() {
    // Check for touch capability
    const hasTouchCapability = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check for keyboard
    const hasKeyboardCapability = true; // Assume keyboard is available

    // Update settings based on capabilities
    this.settings.touchEnabled = hasTouchCapability;
    this.settings.keyboardEnabled = hasKeyboardCapability;

    // Log detected capabilities
    console.log('Input capabilities detected:', {
      touch: hasTouchCapability,
      keyboard: hasKeyboardCapability,
      vibration: this.vibrationSupported,
    });
  }

  /**
   * Update touch controls visibility
   */
  updateTouchControlsVisibility() {
    const touchControls = document.querySelector('.touch-controls');
    if (!touchControls) return;

    // Show touch controls on touch devices or when explicitly enabled
    const shouldShowTouchControls =
      this.settings.touchEnabled || ('ontouchstart' in window && window.innerWidth <= 768);

    touchControls.style.display = shouldShowTouchControls ? 'flex' : 'none';
  }

  /**
   * Setup visual feedback system
   */
  setupVisualFeedback() {
    // Add CSS animations if they don't exist
    if (!document.querySelector('#input-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'input-feedback-styles';
      style.textContent = `
        @keyframes keyboardFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes keyboardFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        
        @keyframes rippleExpand {
          from { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          to { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        
        .btn-touch.pressed {
          transform: scale(0.95) !important;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        
        .keyboard-indicator {
          pointer-events: none;
          user-select: none;
        }
        
        .ripple-effect {
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Emit input event to game systems
   */
  emitInputEvent(action, type) {
    // Add to input buffer
    this.inputBuffer.push({
      action: action,
      type: type,
      timestamp: Date.now(),
    });

    // Keep buffer size manageable
    if (this.inputBuffer.length > this.bufferSize) {
      this.inputBuffer.shift();
    }

    // Emit event
    this.emit('input', { action, type });
  }

  /**
   * Play input sound effect
   */
  playInputSound(action) {
    // This will be connected to the audio system
    const soundMap = {
      left: 'move',
      right: 'move',
      down: 'move',
      rotate: 'rotate',
      drop: 'drop',
    };

    const sound = soundMap[action];
    if (sound) {
      this.emit('playSound', sound);
    }
  }

  /**
   * Update input settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    // Update touch controls visibility
    this.updateTouchControlsVisibility();

    // Update repeat rates based on settings
    if (newSettings.repeatDelay) {
      this.repeatDelay = newSettings.repeatDelay;
    }

    if (newSettings.repeatRate) {
      this.repeatRate = newSettings.repeatRate;
    }
  }

  /**
   * Get input buffer
   */
  getInputBuffer() {
    return [...this.inputBuffer];
  }

  /**
   * Clear input buffer
   */
  clearInputBuffer() {
    this.inputBuffer = [];
  }

  /**
   * Check if action is currently active
   */
  isActionActive(action) {
    // Check keyboard
    for (const [key, pressed] of this.keysPressed) {
      if (pressed && this.keyToAction(key) === action) {
        return true;
      }
    }

    // Check touch buttons
    const touchButton = this.touchButtons.get(action);
    return touchButton && touchButton.classList.contains('pressed');
  }

  /**
   * Get current input state
   */
  getInputState() {
    return {
      keysPressed: new Map(this.keysPressed),
      touchState: new Map(this.touchState),
      inputBuffer: [...this.inputBuffer],
      settings: { ...this.settings },
    };
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
          console.error(`Error in InputController ${event} listener:`, error);
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
   * Cleanup resources
   */
  destroy() {
    // Clear all timers
    this.keyRepeatTimers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });

    this.touchRepeatTimers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });

    // Remove visual feedback elements
    this.feedbackElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // Clear all maps
    this.keysPressed.clear();
    this.touchState.clear();
    this.keyRepeatTimers.clear();
    this.touchRepeatTimers.clear();
    this.feedbackElements.clear();

    if (this.eventListeners) {
      this.eventListeners.clear();
    }

    console.log('🧹 InputController destroyed');
  }
}
