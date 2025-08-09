/**
 * Game Constants - All game configuration values
 */

// Game Board Configuration
export const BOARD_CONFIG = {
  WIDTH: 10, // Number of columns
  HEIGHT: 20, // Number of rows
  CELL_SIZE: 32, // Size of each cell in pixels
};

// Canvas Configuration
export const CANVAS_CONFIG = {
  GAME_WIDTH: BOARD_CONFIG.WIDTH * BOARD_CONFIG.CELL_SIZE, // 320px
  GAME_HEIGHT: BOARD_CONFIG.HEIGHT * BOARD_CONFIG.CELL_SIZE, // 640px
  PREVIEW_SIZE: 120,
};

// Game States
export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  LOADING: 'loading',
};

// Tetris Pieces (Tetrominoes)
export const PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00f5ff', // Cyan
    name: 'I-Block',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#ffed00', // Yellow
    name: 'O-Block',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0', // Purple
    name: 'T-Block',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000', // Green
    name: 'S-Block',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000', // Red
    name: 'Z-Block',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0', // Blue
    name: 'J-Block',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000', // Orange
    name: 'L-Block',
  },
};

// Get all piece types as array
export const PIECE_TYPES = Object.keys(PIECES);

// Input Key Codes
export const KEYS = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  UP: 'ArrowUp', // Rotate
  SPACE: ' ', // Hard drop
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  P: 'KeyP', // Pause
  M: 'KeyM', // Mute
};

// Game Timing (in milliseconds)
export const TIMING = {
  BASE_FALL_SPEED: 1000, // 1 second for level 1
  SPEED_INCREASE: 50, // Decrease by 50ms per level
  MIN_FALL_SPEED: 100, // Minimum fall speed (very fast)
  LOCK_DELAY: 500, // Time before piece locks in place
  LINE_CLEAR_DELAY: 300, // Animation time for clearing lines
  GAME_OVER_DELAY: 2000, // Time to show game over screen
};

// Scoring System
export const SCORING = {
  SINGLE: 100, // 1 line cleared
  DOUBLE: 300, // 2 lines cleared
  TRIPLE: 500, // 3 lines cleared
  TETRIS: 800, // 4 lines cleared (Tetris!)
  SOFT_DROP: 1, // Per cell dropped with down arrow
  HARD_DROP: 2, // Per cell dropped with space
  LEVEL_MULTIPLIER: 1, // Multiply by current level
};

// Lines needed to advance to next level
export const LINES_PER_LEVEL = 10;

// Enhanced Audio Configuration
export const AUDIO_CONFIG = {
  MASTER_VOLUME: 0.7,
  SFX_VOLUME: 0.8,
  MUSIC_VOLUME: 0.5,

  // Kid-friendly audio settings
  KID_MODE: {
    ENABLED: true,
    MAX_VOLUME: 0.8, // Prevent overly loud audio
    GENTLE_FADE_TIME: 0.3, // Smooth transitions
    SOFT_ATTACK: 0.05, // Gentle sound starts
    WARM_DECAY: 0.2, // Natural sound endings
    COMPRESSION_THRESHOLD: -24, // Prevent harsh peaks
    WARMTH_FILTER_FREQ: 8000, // High-frequency rolloff for gentleness
  },

  // Spatial audio settings
  SPATIAL_AUDIO: {
    ENABLED: true,
    MAX_PAN: 0.3, // Limited panning for comfort
    BOARD_WIDTH: 10, // For calculating spatial position
  },

  // Whimsy and delight settings
  WHIMSY: {
    SURPRISE_CHANCE: 0.05, // 5% chance of surprise sounds
    ENCOURAGEMENT_COOLDOWN: 30000, // 30 seconds between encouragements
    ADAPTIVE_AUDIO: true, // Adjust to player skill level
    SEASONAL_THEMES: true, // Auto-switch themes by date
    CELEBRATION_INTENSITY: 0.7, // How enthusiastic celebrations are
  },
};

// Enhanced Sound Effects (Programmatically Generated)
export const SOUNDS = {
  // Basic game sounds
  MOVE: 'move',
  ROTATE: 'rotate',
  SOFT_DROP: 'softDrop',
  HARD_DROP: 'hardDrop',
  LINE_CLEAR: 'lineClear',
  TETRIS: 'tetris',
  LEVEL_UP: 'levelUp',
  GAME_OVER: 'gameOver',

  // UI sounds
  MENU_SELECT: 'menuSelect',
  BUTTON_PRESS: 'buttonPress',
  MENU_BACK: 'menuBack',
  PAUSE: 'pause',
  UNPAUSE: 'unpause',

  // Achievement sounds
  ACHIEVEMENT: 'achievement',
  COMBO: 'combo',
  PERFECT: 'perfect',

  // Whimsical enhancement sounds
  WHIMSY: {
    SPARKLE: 'sparkle',
    TWIRL: 'twirl',
    RAINBOW: 'rainbow',
    SHIMMER: 'shimmer',
    GENTLE_CHIME: 'gentleChime',
    FAIRY_BELL: 'fairyBell',
    WIND_CHIME: 'windChime',
    ENCOURAGEMENT: {
      GENTLE: 'encouragement_gentle',
      CHEERFUL: 'encouragement_cheerful',
    },
    CELEBRATION: {
      CONFETTI: 'confetti_burst',
      FANFARE: 'rainbow_fanfare',
      PARTY: 'party_celebration',
    },
    SURPRISES: {
      UNICORN: 'unicorn_whinny',
      BIRD: 'bird_chirp',
      MAGIC: 'magic_sparkle',
      NATURE: 'gentle_breeze',
    },
  },
};

// Music Configuration
export const MUSIC_CONFIG = {
  TRACKS: {
    MENU: 'menu',
    GAME_EASY: 'game_easy',
    GAME_MEDIUM: 'game_medium',
    GAME_FAST: 'game_fast',
    CELEBRATION: 'celebration',
    AMBIENT: 'ambient',
  },

  // Musical scales and keys (for programmatic generation)
  SCALES: {
    MAJOR: [0, 2, 4, 5, 7, 9, 11],
    MINOR: [0, 2, 3, 5, 7, 8, 10],
    PENTATONIC: [0, 2, 4, 7, 9],
    HAPPY: [0, 2, 4, 7, 9, 11], // Major 6th added
    GENTLE: [0, 2, 3, 5, 7, 8], // Natural minor without the 7th
  },

  // Kid-friendly chord progressions
  PROGRESSIONS: {
    HAPPY: ['I', 'V', 'vi', 'IV'], // Happy/Pop progression
    GENTLE: ['vi', 'IV', 'I', 'V'], // Gentle progression
    PLAYFUL: ['I', 'vi', 'ii', 'V'], // Circle progression
    CELEBRATION: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], // Extended celebration
  },
};

// Colors and Themes
export const COLORS = {
  // Background colors
  BACKGROUND: '#1a1a2e',
  BOARD_BACKGROUND: '#16213e',
  GRID_LINE: '#0f3460',

  // UI colors
  PRIMARY: '#ff6b6b',
  SECONDARY: '#4ecdc4',
  SUCCESS: '#45b7d1',
  WARNING: '#f9ca24',
  DANGER: '#f0932b',

  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#a8a8a8',
  TEXT_ACCENT: '#ffeb3b',

  // Game colors
  GHOST_PIECE: 'rgba(255, 255, 255, 0.3)',
  BORDER: '#333333',
  HIGHLIGHT: '#ffffff',
};

// Animation Configuration
export const ANIMATIONS = {
  FADE_DURATION: 300,
  SLIDE_DURATION: 200,
  BOUNCE_DURATION: 400,
  PULSE_DURATION: 1000,
};

// Mobile/Touch Configuration
export const TOUCH_CONFIG = {
  SWIPE_THRESHOLD: 40, // Minimum distance for swipe (reduced for better mobile responsiveness)
  TAP_THRESHOLD: 150, // Maximum time for tap (ms) - reduced for faster response
  DOUBLE_TAP_THRESHOLD: 300, // Maximum time between taps (ms)
  MIN_SWIPE_VELOCITY: 0.3, // Minimum velocity for swipe detection
  MAX_TAP_DISTANCE: 15, // Maximum movement distance to still count as tap
  
  // Mobile-specific optimizations
  MOBILE_OPTIMIZATIONS: {
    REDUCED_PARTICLE_COUNT: true, // Reduce particles on mobile for performance
    SIMPLIFIED_ANIMATIONS: true, // Use simpler animations on mobile
    LOWER_CANVAS_DPI: true, // Cap device pixel ratio for better performance
    DEBOUNCE_RESIZE: 250, // Debounce resize events (ms)
  }
};

// Development/Debug Configuration
export const DEBUG = {
  SHOW_GRID: false,
  SHOW_GHOST_PIECE: true,
  SHOW_FPS: false,
  LOG_GAME_EVENTS: false,
  ENABLE_CHEATS: false,
};

// Game Features
export const FEATURES = {
  GHOST_PIECE: true, // Show where piece will land
  HOLD_PIECE: false, // Allow holding pieces (advanced feature)
  WALL_KICKS: true, // Advanced rotation system
  T_SPIN_DETECTION: false, // Advanced scoring (complex for kids)
  MULTIPLAYER: false, // Future feature
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: {
    name: 'Easy',
    startingLevel: 1,
    fallSpeed: 1200,
    description: 'Perfect for beginners!',
  },
  NORMAL: {
    name: 'Normal',
    startingLevel: 1,
    fallSpeed: 1000,
    description: 'Classic Tetris experience',
  },
  HARD: {
    name: 'Hard',
    startingLevel: 3,
    fallSpeed: 800,
    description: 'For Tetris masters!',
  },
};

// Export default configuration object
export default {
  BOARD_CONFIG,
  CANVAS_CONFIG,
  GAME_STATES,
  PIECES,
  PIECE_TYPES,
  KEYS,
  TIMING,
  SCORING,
  LINES_PER_LEVEL,
  AUDIO_CONFIG,
  SOUNDS,
  MUSIC_CONFIG,
  COLORS,
  ANIMATIONS,
  TOUCH_CONFIG,
  DEBUG,
  FEATURES,
  DIFFICULTY_LEVELS,
};
