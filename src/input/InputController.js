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
    // Setup input systems in order
    this.setupKeyboardListeners();
    this.setupVisualFeedback();
    this.detectInputCapabilities();
    
    // Setup touch controls after DOM is ready
    this.setupTouchControlsWhenReady();
    
    console.log('🎮 InputController initialized');
  }

  /**
   * Setup touch control buttons when DOM is ready
   */
  setupTouchControlsWhenReady() {
    // Use a timeout to ensure DOM is fully loaded
    const attemptSetup = (attempts = 0) => {
      if (attempts > 10) {
        console.error('❌ Failed to find touch control buttons after 10 attempts');
        return;
      }
      
      const found = this.setupTouchControls();
      if (!found) {
        console.log(`⏳ Touch buttons not ready, retry ${attempts + 1}/10`);
        setTimeout(() => attemptSetup(attempts + 1), 200);
      } else {
        console.log('✅ Touch controls setup complete');
      }
    };
    
    // Start setup immediately, with retries if needed
    attemptSetup();
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

    let buttonsFound = 0;
    Object.entries(touchControlSelectors).forEach(([action, selector]) => {
      const button = document.querySelector(selector);
      if (button) {
        this.touchButtons.set(action, button);
        this.setupTouchButton(button, action);
        buttonsFound++;
        console.log(`✅ Touch button found: ${action} (${selector})`);
      } else {
        console.warn(`❌ Touch button not found: ${action} (${selector})`);
      }
    });

    // Setup touch gestures if we have buttons
    if (buttonsFound > 0) {
      this.setupTouchListeners();
    }

    // Show/hide touch controls based on device
    this.updateTouchControlsVisibility();
    
    return buttonsFound > 0;
  }

  /**
   * Setup individual touch button
   */
  setupTouchButton(button, action) {
    console.log(`🔧 Setting up touch button: ${action}`);
    
    // Set touch-friendly attributes
    button.style.touchAction = 'manipulation';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.webkitTouchCallout = 'none';
    button.style.webkitTapHighlightColor = 'transparent';
    
    // Ensure button is visible and clickable
    button.style.pointerEvents = 'auto';
    button.style.zIndex = '1000';
    
    // Touch event listeners with better error handling
    const touchStartHandler = (event) => {
      try {
        console.log(`👆 Touch start: ${action}`);
        event.preventDefault();
        event.stopPropagation();
        this.handleTouchButtonStart(action, button);
      } catch (error) {
        console.error(`Error in touch start for ${action}:`, error);
      }
    };
    
    const touchEndHandler = (event) => {
      try {
        console.log(`👆 Touch end: ${action}`);
        event.preventDefault();
        event.stopPropagation();
        this.handleTouchButtonEnd(action, button);
      } catch (error) {
        console.error(`Error in touch end for ${action}:`, error);
      }
    };
    
    // Add touch event listeners
    button.addEventListener('touchstart', touchStartHandler, { passive: false });
    button.addEventListener('touchend', touchEndHandler, { passive: false });
    button.addEventListener('touchcancel', touchEndHandler, { passive: false });

    // Prevent touch move from interfering
    button.addEventListener('touchmove', (event) => {
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });

    // Mouse events for desktop testing and Playwright
    button.addEventListener('mousedown', (event) => {
      try {
        console.log(`🖱️ Mouse down: ${action}`);
        event.preventDefault();
        event.stopPropagation();
        this.handleTouchButtonStart(action, button);
      } catch (error) {
        console.error(`Error in mouse down for ${action}:`, error);
      }
    });

    button.addEventListener('mouseup', (event) => {
      try {
        console.log(`🖱️ Mouse up: ${action}`);
        event.preventDefault();
        event.stopPropagation();
        this.handleTouchButtonEnd(action, button);
      } catch (error) {
        console.error(`Error in mouse up for ${action}:`, error);
      }
    });

    button.addEventListener('mouseleave', (event) => {
      event.preventDefault();
      this.handleTouchButtonEnd(action, button);
    });

    // Add accessibility attributes
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', this.getActionLabel(action));
    button.setAttribute('tabindex', '0');

    // Prevent context menu and selection
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    button.addEventListener('selectstart', (event) => {
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
    
    console.log(`✅ Touch button setup complete: ${action}`);
  }

  /**
   * Handle touch button press start
   */
  handleTouchButtonStart(action, button) {
    console.log(`🚀 Touch button start: ${action}`);
    
    if (!this.settings.touchEnabled) {
      console.warn(`⚠️ Touch disabled but button pressed! Action: ${action}`);
      console.log('🔄 Auto-enabling touch due to button interaction...');
      // If user is actively pressing touch buttons, they obviously have touch capability
      // Auto-enable touch to fix the issue
      this.settings.touchEnabled = true;
      this.updateTouchControlsVisibility();
    }

    // Visual feedback
    this.addTouchFeedback(button);

    // Vibration feedback
    this.triggerVibration('light');

    // Emit input event - this is crucial for game functionality
    console.log(`📡 Emitting input event: ${action} start`);
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
    console.log(`🛑 Touch button end: ${action}`);
    
    // Remove visual feedback
    this.removeTouchFeedback(button);

    // Clear repeat timer
    this.clearTouchRepeat(action);

    // Emit input event
    console.log(`📡 Emitting input event: ${action} end`);
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
   * Enhanced mobile device detection with comprehensive fallbacks
   */
  detectInputCapabilities() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Primary touch capability detection methods
    const primaryTouchDetection = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0 ||
      window.DocumentTouch && document instanceof window.DocumentTouch
    );

    // Enhanced mobile user agent detection with more patterns
    const mobilePlatforms = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 
      'opera mini', 'mobile safari', 'chrome mobile', 'samsung', 'nokia',
      'motorola', 'lg', 'htc', 'sony', 'kindle', 'silk', 'fennec'
    ];
    
    const advancedUserAgentDetection = mobilePlatforms.some(platform => 
      userAgent.includes(platform)
    );

    // Screen-based mobile detection with multiple breakpoints
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    
    const screenBasedMobileDetection = (
      // Small screens (phones)
      screenWidth <= 768 ||
      screenHeight <= 768 ||
      // Tablet detection (larger but still mobile)
      (screenWidth <= 1024 && aspectRatio > 1.2) ||
      // Touch-first screen sizes
      (screenWidth <= 900 && screenHeight <= 1400)
    );

    // Enhanced mobile feature detection
    const mobileFeatureDetection = (
      'orientation' in window ||
      'ondevicemotion' in window ||
      'ondeviceorientation' in window ||
      'ontouchstart' in document.documentElement ||
      navigator.standalone !== undefined || // iOS PWA capability
      window.navigator.maxTouchPoints !== undefined ||
      'onorientationchange' in window
    );

    // CSS media queries detection
    let cssMediaQueryDetection = false;
    try {
      cssMediaQueryDetection = window.matchMedia && (
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(hover: none)').matches ||
        window.matchMedia('(any-pointer: coarse)').matches
      );
    } catch (e) {
      console.warn('CSS media query detection failed:', e);
    }

    // Device pixel ratio patterns (many mobile devices have high DPR)
    const highDPRMobile = window.devicePixelRatio > 1.5;

    // Browser-specific mobile detection
    const browserMobileDetection = (
      // Mobile Chrome
      /chrome.*mobile/i.test(userAgent) ||
      // Mobile Firefox
      /firefox.*mobile/i.test(userAgent) ||
      // Mobile Safari
      /safari.*mobile/i.test(userAgent) ||
      // Opera Mobile
      /opera.*mobile/i.test(userAgent) ||
      // Edge Mobile
      /edge.*mobile/i.test(userAgent) ||
      // Samsung Browser
      /samsungbrowser/i.test(userAgent) ||
      // UC Browser
      /ucbrowser/i.test(userAgent)
    );

    // Hardware detection
    const hardwareIndicators = (
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 8 || // Mobile typically has fewer cores
      navigator.deviceMemory && navigator.deviceMemory <= 4 || // Mobile typically has less RAM
      navigator.connection && navigator.connection.effectiveType && 
      ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)
    );

    // Combine all detection methods with different weights
    const detectionResults = {
      primaryTouch: primaryTouchDetection,
      userAgent: advancedUserAgentDetection,
      screen: screenBasedMobileDetection,
      features: mobileFeatureDetection,
      cssMedia: cssMediaQueryDetection,
      browser: browserMobileDetection,
      hardware: hardwareIndicators,
      highDPR: highDPRMobile
    };

    // Count positive detections
    const positiveDetections = Object.values(detectionResults).filter(Boolean).length;
    const detectionScore = positiveDetections / Object.keys(detectionResults).length;

    // Be very aggressive about mobile detection - even 1 positive detection should enable touch
    const isMobileDevice = positiveDetections > 0;
    
    // Special case: if screen size suggests mobile, always enable touch regardless of other factors
    const forceMobileByScreen = screenWidth <= 768 || screenHeight <= 768;

    // Final decision: enable touch if ANY mobile indicator is present
    this.settings.touchEnabled = isMobileDevice || forceMobileByScreen || detectionScore >= 0.25;
    this.settings.keyboardEnabled = true; // Always enable keyboard as fallback

    // Enhanced logging
    console.log('🔍 Enhanced mobile detection results:', {
      detectionResults,
      positiveDetections,
      detectionScore: Math.round(detectionScore * 100) + '%',
      finalDecision: {
        touchEnabled: this.settings.touchEnabled,
        isMobileDevice,
        forceMobileByScreen
      },
      deviceInfo: {
        userAgent: userAgent.substring(0, 100) + '...',
        screen: `${screenWidth}x${screenHeight}`,
        aspectRatio: Math.round(aspectRatio * 100) / 100,
        devicePixelRatio: window.devicePixelRatio,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        connection: navigator.connection?.effectiveType
      },
      capabilities: {
        vibration: this.vibrationSupported,
        orientationAPI: 'orientation' in window,
        deviceMotion: 'ondevicemotion' in window,
        standalone: navigator.standalone
      }
    });

    // Force enable if any strong mobile indicator
    if (!this.settings.touchEnabled && (forceMobileByScreen || advancedUserAgentDetection)) {
      console.warn('⚠️ Strong mobile indicators detected - force enabling touch!');
      this.settings.touchEnabled = true;
    }

    // Runtime adjustment based on actual touch interaction
    this.setupTouchDetectionAdjustment();
  }

  /**
   * Setup runtime adjustment for touch detection based on actual user interaction
   */
  setupTouchDetectionAdjustment() {
    // Monitor for actual touch events to auto-correct detection
    const touchEventHandler = (event) => {
      if (!this.settings.touchEnabled && event.type.startsWith('touch')) {
        console.log('🔧 Actual touch event detected - enabling touch controls!');
        this.settings.touchEnabled = true;
        this.updateTouchControlsVisibility();
        
        // Remove the handler once we've corrected the detection
        ['touchstart', 'touchend', 'touchmove'].forEach(eventType => {
          document.removeEventListener(eventType, touchEventHandler);
        });
      }
    };

    // Listen for actual touch events as a final safety net
    ['touchstart', 'touchend', 'touchmove'].forEach(eventType => {
      document.addEventListener(eventType, touchEventHandler, { passive: true, once: false });
    });

    // Also check periodically if window size changes (orientation change, etc.)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        // Re-evaluate if screen size now suggests mobile
        if ((newWidth <= 768 || newHeight <= 768) && !this.settings.touchEnabled) {
          console.log('🔄 Screen size change suggests mobile - enabling touch!');
          this.settings.touchEnabled = true;
          this.updateTouchControlsVisibility();
        }
      }, 250);
    });
  }

  /**
   * Update touch controls visibility
   */
  updateTouchControlsVisibility() {
    const touchControls = document.querySelector('.touch-controls');
    if (!touchControls) {
      console.warn('Touch controls element not found - retrying in 500ms');
      // Retry after a short delay in case DOM isn't ready
      setTimeout(() => this.updateTouchControlsVisibility(), 500);
      return;
    }

    // Show touch controls on mobile screens, touch devices, or when explicitly enabled
    const isMobileScreen = window.innerWidth <= 768;
    const hasTouchCapability = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
    
    const shouldShowTouchControls = 
      this.settings.touchEnabled || 
      isMobileScreen || 
      hasTouchCapability;

    console.log('🎮 Touch controls visibility check:', {
      shouldShow: shouldShowTouchControls,
      touchEnabled: this.settings.touchEnabled,
      isMobileScreen,
      hasTouchCapability,
      currentDisplay: touchControls.style.display,
      hasHiddenClass: touchControls.classList.contains('hidden')
    });

    if (shouldShowTouchControls) {
      touchControls.style.display = 'flex';
      touchControls.classList.remove('hidden');
      console.log('✅ Touch controls shown');
    } else {
      touchControls.style.display = 'none';
      touchControls.classList.add('hidden');
      console.log('❌ Touch controls hidden');
    }
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
    console.log(`📤 Emitting input event: ${action} ${type}`);
    
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

    // Emit event - this is how the game receives input
    console.log(`📡 Broadcasting input event: ${action} ${type}`);
    this.emit('input', { action, type });
    
    // Debug: check if we have listeners
    if (this.eventListeners && this.eventListeners.has('input')) {
      console.log(`📻 Input event has ${this.eventListeners.get('input').length} listeners`);
    } else {
      console.warn('⚠️ No input event listeners found!');
    }
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
    console.log('🔧 Updating input settings:', newSettings);
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    
    // If touch was manually enabled, make sure we respect that
    if (newSettings.touchEnabled === true) {
      console.log('✅ Touch manually enabled via settings');
    }
    
    // Re-detect capabilities if this is a settings update that might affect detection
    if (newSettings.hasOwnProperty('touchEnabled') && newSettings.touchEnabled === undefined) {
      console.log('🔄 Re-detecting input capabilities...');
      this.detectInputCapabilities();
    }

    // Update touch controls visibility
    this.updateTouchControlsVisibility();

    // Update repeat rates based on settings
    if (newSettings.repeatDelay) {
      this.repeatDelay = newSettings.repeatDelay;
    }

    if (newSettings.repeatRate) {
      this.repeatRate = newSettings.repeatRate;
    }
    
    console.log('🔧 Settings updated:', {
      old: oldSettings,
      new: this.settings,
      changes: Object.keys(newSettings)
    });
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
    console.log(`📢 InputController emitting event: ${event}`, args);
    
    if (this.eventListeners && this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      console.log(`📻 Found ${listeners.length} listeners for ${event}`);
      
      listeners.forEach((callback, index) => {
        try {
          console.log(`📞 Calling listener ${index + 1}/${listeners.length} for ${event}`);
          callback(...args);
        } catch (error) {
          console.error(`Error in InputController ${event} listener ${index}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners found for event: ${event}`);
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
   * Force enable touch controls (for mobile compatibility)
   */
  forceEnableTouch() {
    console.log('🔧 Force enabling touch controls...');
    
    // Force enable touch
    this.settings.touchEnabled = true;
    
    // Re-setup touch controls
    const success = this.setupTouchControls();
    
    // Update visibility
    this.updateTouchControlsVisibility();
    
    console.log(success ? '✅ Touch force-enabled successfully' : '❌ Touch force-enable failed');
    return success;
  }
  
  /**
   * Force setup touch controls (for debugging)
   */
  forceSetupTouchControls() {
    console.log('🔧 Force setting up touch controls...');
    const success = this.setupTouchControls();
    if (success) {
      console.log('✅ Force setup successful');
    } else {
      console.error('❌ Force setup failed');
    }
    return success;
  }

  /**
   * Get debug information with enhanced mobile detection details
   */
  getDebugInfo() {
    const touchButtons = {};
    this.touchButtons.forEach((button, action) => {
      touchButtons[action] = {
        found: !!button,
        id: button?.id || 'unknown',
        visible: button ? !button.classList.contains('hidden') : false,
        styles: button ? {
          display: getComputedStyle(button).display,
          visibility: getComputedStyle(button).visibility,
          pointerEvents: getComputedStyle(button).pointerEvents
        } : null
      };
    });

    // Run enhanced detection for debug info
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Recreate detection results for debugging
    const primaryTouchDetection = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0 ||
      window.DocumentTouch && document instanceof window.DocumentTouch
    );

    const mobilePlatforms = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 
      'opera mini', 'mobile safari', 'chrome mobile', 'samsung', 'nokia',
      'motorola', 'lg', 'htc', 'sony', 'kindle', 'silk', 'fennec'
    ];
    
    const advancedUserAgentDetection = mobilePlatforms.some(platform => 
      userAgent.includes(platform)
    );

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    
    const screenBasedMobileDetection = (
      screenWidth <= 768 ||
      screenHeight <= 768 ||
      (screenWidth <= 1024 && aspectRatio > 1.2) ||
      (screenWidth <= 900 && screenHeight <= 1400)
    );

    const mobileFeatureDetection = (
      'orientation' in window ||
      'ondevicemotion' in window ||
      'ondeviceorientation' in window ||
      'ontouchstart' in document.documentElement ||
      navigator.standalone !== undefined ||
      window.navigator.maxTouchPoints !== undefined ||
      'onorientationchange' in window
    );

    let cssMediaQueryDetection = false;
    try {
      cssMediaQueryDetection = window.matchMedia && (
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(hover: none)').matches ||
        window.matchMedia('(any-pointer: coarse)').matches
      );
    } catch (e) {
      // Ignore errors
    }

    const browserMobileDetection = (
      /chrome.*mobile/i.test(userAgent) ||
      /firefox.*mobile/i.test(userAgent) ||
      /safari.*mobile/i.test(userAgent) ||
      /opera.*mobile/i.test(userAgent) ||
      /edge.*mobile/i.test(userAgent) ||
      /samsungbrowser/i.test(userAgent) ||
      /ucbrowser/i.test(userAgent)
    );

    const hardwareIndicators = (
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 8 ||
      navigator.deviceMemory && navigator.deviceMemory <= 4 ||
      navigator.connection && navigator.connection.effectiveType && 
      ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)
    );

    const detectionResults = {
      primaryTouch: primaryTouchDetection,
      userAgent: advancedUserAgentDetection,
      screen: screenBasedMobileDetection,
      features: mobileFeatureDetection,
      cssMedia: cssMediaQueryDetection,
      browser: browserMobileDetection,
      hardware: hardwareIndicators,
      highDPR: window.devicePixelRatio > 1.5
    };

    const positiveDetections = Object.values(detectionResults).filter(Boolean).length;
    const detectionScore = positiveDetections / Object.keys(detectionResults).length;
    
    return {
      settings: this.settings,
      touchButtons,
      eventListeners: this.eventListeners ? Object.fromEntries(
        Array.from(this.eventListeners.entries()).map(([key, listeners]) => [
          key, 
          listeners.length
        ])
      ) : {},
      inputBufferSize: this.inputBuffer.length,
      enhancedDetection: {
        detectionResults,
        positiveDetections,
        detectionScore: Math.round(detectionScore * 100) + '%',
        finalTouchEnabled: this.settings.touchEnabled
      },
      capabilities: {
        // Legacy capabilities for backward compatibility
        touch: primaryTouchDetection,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        msMaxTouchPoints: navigator.msMaxTouchPoints || 0,
        documentTouch: !!(window.DocumentTouch && document instanceof window.DocumentTouch),
        screen: `${screenWidth}x${screenHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        isMobileScreen: screenBasedMobileDetection,
        isMobileUserAgent: advancedUserAgentDetection,
        hasOrientation: 'orientation' in window,
        hasDeviceMotion: 'ondevicemotion' in window,
        vibrationSupported: this.vibrationSupported,
        userAgentSnippet: userAgent.substring(0, 80) + '...',
        // Enhanced capabilities
        aspectRatio: Math.round(aspectRatio * 100) / 100,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        connection: navigator.connection?.effectiveType,
        standalone: navigator.standalone,
        cssPointerCoarse: cssMediaQueryDetection
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    console.log('🧹 Destroying InputController...');
    
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
    this.touchButtons.clear();

    if (this.eventListeners) {
      this.eventListeners.clear();
    }

    console.log('🧹 InputController destroyed');
  }
}
