/**
 * Main entry point for Tetris Kids game
 * Initializes and starts the game with complete UI and rendering systems
 */

import { GameEngine } from './core/GameEngine.js';
import { CanvasRenderer } from './rendering/CanvasRenderer.js';
import { AnimationManager } from './rendering/AnimationManager.js';
import { GameUI } from './ui/GameUI.js';
import { MenuSystem } from './ui/MenuSystem.js';
import { InputController } from './input/InputController.js';
import { AudioManager } from './audio/AudioManager.js';
import { MusicPlayer } from './audio/MusicPlayer.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { WhimsyInjector } from './audio/WhimsyInjector.js';
import { GAME_STATES } from './core/Constants.js';

// Game systems
let gameEngine = null;
let canvasRenderer = null;
let animationManager = null;
let gameUI = null;
let menuSystem = null;
let inputController = null;

// Audio systems
let audioManager = null;
let musicPlayer = null;
let soundEffects = null;
let whimsyInjector = null;

/**
 * Initialize the game when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🧩 Welcome to Tetris Kids! 🌈');
  
  initializeGame();
});

/**
 * Initialize the game engine and systems
 */
async function initializeGame() {
  try {
    // Show loading screen
    showLoadingScreen();
    
    // Initialize game systems in order
    await initializeSystems();
    
    console.log('✅ Game initialized successfully!');
    
    // Hide loading screen and show main menu
    setTimeout(() => {
      hideLoadingScreen();
      showMainMenu();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    showErrorMessage('Failed to load the game. Please refresh the page and try again.');
  }
}

/**
 * Initialize all game systems
 */
async function initializeSystems() {
  console.log('🚀 Initializing game systems...');
  
  // Get canvas elements
  const gameCanvas = document.getElementById('gameCanvas');
  const previewCanvas = document.getElementById('nextPieceCanvas');
  
  if (!gameCanvas || !previewCanvas) {
    throw new Error('Required canvas elements not found');
  }
  
  // Initialize core systems
  gameEngine = new GameEngine();
  animationManager = new AnimationManager();
  canvasRenderer = new CanvasRenderer(gameCanvas, previewCanvas);
  gameUI = new GameUI();
  inputController = new InputController();
  menuSystem = new MenuSystem();
  
  // Initialize audio systems
  audioManager = new AudioManager();
  musicPlayer = new MusicPlayer(audioManager);
  soundEffects = new SoundEffects(audioManager);
  whimsyInjector = new WhimsyInjector(audioManager, musicPlayer, soundEffects);
  
  // Setup system connections and event listeners
  setupSystemConnections();
  
  // Initialize game engine with systems
  gameEngine.initialize({
    renderer: canvasRenderer,
    animation: animationManager,
    ui: gameUI,
    input: inputController,
    audio: {
      manager: audioManager,
      music: musicPlayer,
      effects: soundEffects,
      whimsy: whimsyInjector
    }
  });
  
  console.log('🎮 All systems initialized and connected');
}

/**
 * Setup connections between systems
 */
function setupSystemConnections() {
  // Menu System Events
  menuSystem.on('startGame', (settings) => {
    console.log('🎮 Starting game with settings:', settings);
    menuSystem.hideAllScreens();
    showGameView();
    startGameWithSettings(settings);
  });
  
  menuSystem.on('showMenu', () => {
    console.log('📋 Showing main menu');
    if (gameEngine) {
      gameEngine.stop();
    }
    hideGameView();
    menuSystem.showMainMenu();
  });
  
  menuSystem.on('playMenuSound', (soundType) => {
    if (soundEffects) {
      const soundName = soundType === 'select' ? 'menuSelect' : 'buttonPress';
      soundEffects.playSound(soundName);
      if (whimsyInjector && whimsyInjector.isInitialized) {
        whimsyInjector.enhanceSoundEffect(soundName, { context: 'menu' });
      }
    }
  });
  
  // Input Controller Events
  inputController.on('input', (inputData) => {
    handleGameInput(inputData);
  });
  
  inputController.on('playSound', (soundType) => {
    if (soundEffects) {
      soundEffects.playSound(soundType);
    }
  });
  
  // Game UI Events
  gameUI.on('pauseToggle', () => {
    if (gameEngine) {
      gameEngine.stateManager.togglePause();
    }
  });
  
  gameUI.on('muteToggle', (isMuted) => {
    if (audioManager) {
      audioManager.setMuted(isMuted);
    }
  });
  
  gameUI.on('gameRestart', () => {
    if (gameEngine) {
      restartGame();
    }
  });
  
  gameUI.on('showMenu', () => {
    if (gameEngine) {
      gameEngine.stop();
    }
    hideGameView();
    menuSystem.showMainMenu();
  });
  
  gameUI.on('playSound', (soundType) => {
    if (soundEffects) {
      soundEffects.playSound(soundType);
    }
  });
  
  // Game Engine Events (via state manager)
  if (gameEngine && gameEngine.stateManager) {
    gameEngine.stateManager.on('gameStateChanged', (newState) => {
      handleGameStateChange(newState);
    });
    
    gameEngine.stateManager.on('scoreUpdated', (scoreData) => {
      if (gameUI) {
        gameUI.update(scoreData, gameEngine.getGameData());
      }
    });
    
    gameEngine.stateManager.on('levelUp', (levelData) => {
      if (canvasRenderer) {
        canvasRenderer.triggerLevelUp(levelData.level);
      }
      if (animationManager) {
        animationManager.animateLevelUp(levelData.level);
      }
      if (soundEffects) {
        soundEffects.playSound('levelUp');
        if (whimsyInjector && whimsyInjector.isInitialized) {
          whimsyInjector.enhanceSoundEffect('levelUp', { 
            level: levelData.level, 
            context: 'achievement' 
          });
        }
      }
      if (musicPlayer) {
        musicPlayer.updateForLevel(levelData.level);
        musicPlayer.playStinger('levelUp');
      }
    });
    
    gameEngine.stateManager.on('linesCleared', (clearData) => {
      if (canvasRenderer) {
        canvasRenderer.triggerLineClear(clearData.count, clearData.isSpecial);
      }
      if (animationManager) {
        animationManager.animateLineClear(clearData.lines, clearData.count, clearData.isSpecial);
      }
      if (gameUI) {
        gameUI.handleLineClear(clearData.count, clearData.isSpecial);
      }
      if (soundEffects) {
        // Play different sounds based on lines cleared
        let soundName;
        if (clearData.count === 4) {
          soundName = 'tetris'; // Special tetris sound
        } else if (clearData.count > 1) {
          soundName = 'lineClear';
        } else {
          soundName = 'lineClear';
        }
        
        soundEffects.playSound(soundName);
        
        // Enhance with whimsy
        if (whimsyInjector && whimsyInjector.isInitialized) {
          whimsyInjector.enhanceSoundEffect(soundName, {
            linesCleared: clearData.count,
            context: clearData.count === 4 ? 'tetris' : 'lineClear',
            combo: clearData.combo
          });
          whimsyInjector.updatePlayerState('lineClear', clearData);
        }
        
        // Play combo sound if applicable
        if (clearData.combo && clearData.combo > 1) {
          soundEffects.playComboSequence(clearData.combo);
        }
      }
    });
  }
  
  // Audio System Events and Initialization
  if (audioManager) {
    // Initialize audio after user interaction
    const initializeAudio = async () => {
      try {
        await audioManager.initialize();
        if (musicPlayer) {
          musicPlayer.initialize();
        }
        if (soundEffects) {
          soundEffects.initialize();
        }
        if (whimsyInjector) {
          await whimsyInjector.initialize();
        }
        console.log('🎵 Audio systems initialized with whimsy!');
        
        // Start menu music
        if (musicPlayer && musicPlayer.isInitialized) {
          musicPlayer.playTrack('menu');
        }
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };
    
    // Initialize audio on first user interaction
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('keydown', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
  }
  
  console.log('🔗 System connections established');
}

/**
 * Show loading screen
 */
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
  }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

/**
 * Show main menu
 */
function showMainMenu() {
  hideGameView();
  if (menuSystem) {
    menuSystem.showMainMenu();
  }
}

/**
 * Show game view (hide menu, show game elements)
 */
function showGameView() {
  const gameContainer = document.getElementById('app');
  const menuContainer = document.getElementById('menuContainer');
  
  if (gameContainer) {
    gameContainer.classList.remove('hidden');
  }
  
  if (menuContainer) {
    menuContainer.classList.add('hidden');
  }
  
  console.log('🎮 Game view shown');
}

/**
 * Hide game view (show menu, hide game elements)
 */
function hideGameView() {
  const gameContainer = document.getElementById('app');
  const menuContainer = document.getElementById('menuContainer');
  
  if (gameContainer) {
    gameContainer.classList.add('hidden');
  }
  
  if (menuContainer) {
    menuContainer.classList.remove('hidden');
  }
  
  console.log('📋 Game view hidden');
}

/**
 * Start a new game with default settings
 */
function startGame() {
  startGameWithSettings({
    difficulty: 'NORMAL',
    soundEnabled: true,
    musicEnabled: true,
    showGhostPiece: true,
    showGrid: false
  });
}

/**
 * Start a new game with specific settings
 */
function startGameWithSettings(settings) {
  if (!gameEngine) return;
  
  console.log('🎮 Starting game with settings:', settings);
  
  // Reset all systems
  if (animationManager) {
    animationManager.clearAll();
  }
  
  if (gameUI) {
    gameUI.reset();
  }
  
  // Apply settings to systems
  if (inputController) {
    inputController.updateSettings({
      visualFeedbackEnabled: settings.soundEnabled,
      vibrationEnabled: settings.soundEnabled
    });
  }
  
  // Start the game
  gameEngine.startNewGame();
  
  // Start the main game loop with rendering
  startGameLoop();
}

/**
 * Start the main game loop
 */
function startGameLoop() {
  if (!gameEngine || !canvasRenderer || !animationManager) return;
  
  console.log('🎮 Starting game loop');
  
  function gameLoop() {
    const currentTime = performance.now();
    
    // Update animations
    animationManager.update(16); // Assuming 60 FPS
    
    // Get game data for rendering
    const gameData = gameEngine.getGameData();
    const gameState = gameEngine.stateManager.getState();
    
    // Render the game
    if (gameData && gameState.gameState === GAME_STATES.PLAYING) {
      canvasRenderer.render(gameData);
    }
    
    // Update UI
    if (gameUI) {
      gameUI.update(gameState, gameData);
    }
    
    // Continue loop if game is running
    if (gameEngine && gameEngine.isRunning) {
      requestAnimationFrame(gameLoop);
    }
  }
  
  requestAnimationFrame(gameLoop);
}

/**
 * Restart the current game
 */
function restartGame() {
  if (gameEngine) {
    console.log('🔄 Restarting game');
    gameEngine.restart();
    startGameLoop();
  }
}

/**
 * Handle game input from input controller
 */
function handleGameInput(inputData) {
  if (!gameEngine) return;
  
  const { action, type } = inputData;
  
  // Only process game inputs during gameplay
  const currentState = gameEngine.stateManager.getState();
  if (currentState.gameState !== GAME_STATES.PLAYING) return;
  
  // Convert input actions to game commands
  const gameLogic = gameEngine.getSystem('gameLogic');
  if (!gameLogic) return;
  
  switch (action) {
    case 'left':
      if (type === 'start' || type === 'repeat' || type === 'swipe') {
        const moved = gameLogic.movePiece('left');
        if (moved && soundEffects) {
          soundEffects.playSpatialSound('move', { x: gameLogic.currentPiece?.x });
          if (whimsyInjector && whimsyInjector.isInitialized) {
            whimsyInjector.updatePlayerState('move');
            whimsyInjector.enhanceSoundEffect('move', { 
              direction: 'left', 
              position: { x: gameLogic.currentPiece?.x } 
            });
          }
        }
        // Trigger move animation
        if (animationManager) {
          const piece = gameLogic.currentPiece;
          if (piece) {
            animationManager.animatePieceMove(
              piece,
              { x: piece.x + 1, y: piece.y },
              { x: piece.x, y: piece.y }
            );
          }
        }
      }
      break;
      
    case 'right':
      if (type === 'start' || type === 'repeat' || type === 'swipe') {
        const moved = gameLogic.movePiece('right');
        if (moved && soundEffects) {
          soundEffects.playSpatialSound('move', { x: gameLogic.currentPiece?.x });
          if (whimsyInjector && whimsyInjector.isInitialized) {
            whimsyInjector.updatePlayerState('move');
            whimsyInjector.enhanceSoundEffect('move', { 
              direction: 'right', 
              position: { x: gameLogic.currentPiece?.x } 
            });
          }
        }
        // Trigger move animation
        if (animationManager) {
          const piece = gameLogic.currentPiece;
          if (piece) {
            animationManager.animatePieceMove(
              piece,
              { x: piece.x - 1, y: piece.y },
              { x: piece.x, y: piece.y }
            );
          }
        }
      }
      break;
      
    case 'down':
      if (type === 'start' || type === 'repeat' || type === 'swipe') {
        const moved = gameLogic.movePiece('down');
        if (moved && soundEffects) {
          soundEffects.playSound('softDrop');
        }
      }
      break;
      
    case 'rotate':
      if (type === 'start' || type === 'swipe') {
        const oldRotation = gameLogic.currentPiece ? gameLogic.currentPiece.rotation : 0;
        const success = gameLogic.rotatePiece(true);
        
        if (success && soundEffects) {
          soundEffects.playSpatialSound('rotate', { x: gameLogic.currentPiece?.x });
          if (whimsyInjector && whimsyInjector.isInitialized) {
            whimsyInjector.updatePlayerState('rotate');
            whimsyInjector.enhanceSoundEffect('rotate', { 
              position: { x: gameLogic.currentPiece?.x }
            });
          }
        }
        
        // Trigger rotation animation
        if (success && animationManager && gameLogic.currentPiece) {
          animationManager.animatePieceRotation(
            gameLogic.currentPiece,
            oldRotation,
            gameLogic.currentPiece.rotation
          );
        }
      }
      break;
      
    case 'drop':
      if (type === 'start' || type === 'tap') {
        const piece = gameLogic.currentPiece;
        const oldY = piece ? piece.y : 0;
        const dropDistance = gameLogic.hardDrop();
        
        if (dropDistance > 0 && soundEffects) {
          soundEffects.playSpatialSound('hardDrop', { x: piece?.x });
          if (whimsyInjector && whimsyInjector.isInitialized) {
            whimsyInjector.updatePlayerState('hardDrop', { distance: dropDistance });
            whimsyInjector.enhanceSoundEffect('hardDrop', { 
              distance: dropDistance,
              position: { x: piece?.x }
            });
          }
        }
        
        // Trigger drop animation
        if (dropDistance > 0 && animationManager && piece) {
          animationManager.animateHardDrop(piece, oldY, piece.y);
        }
      }
      break;
      
    case 'pause':
      if (type === 'start') {
        gameEngine.stateManager.togglePause();
      }
      break;
  }
}

/**
 * Handle game state changes
 */
function handleGameStateChange(newState) {
  console.log('🎮 Game state changed to:', newState);
  
  switch (newState.gameState) {
    case GAME_STATES.PLAYING:
      // Resume game loop if needed
      if (gameEngine && !gameEngine.isRunning) {
        gameEngine.start();
        startGameLoop();
      }
      
      // Start appropriate game music
      if (musicPlayer && musicPlayer.isInitialized) {
        const trackName = musicPlayer.getTrackForGameState('playing', newState.level || 1);
        musicPlayer.transitionToTrack(trackName);
      }
      
      // Play unpause sound if resuming from pause
      if (soundEffects && newState.previousState === GAME_STATES.PAUSED) {
        soundEffects.playSound('unpause');
      }
      
      // Create whimsical state transition
      if (whimsyInjector && whimsyInjector.isInitialized) {
        whimsyInjector.createStateTransition(newState.previousState || 'menu', 'playing');
      }
      break;
      
    case GAME_STATES.PAUSED:
      // Game loop will continue but won't update game logic
      if (soundEffects) {
        soundEffects.playSound('pause');
      }
      
      // Transition to ambient music for pause
      if (musicPlayer && musicPlayer.isInitialized) {
        musicPlayer.transitionToTrack('ambient');
      }
      break;
      
    case GAME_STATES.GAME_OVER:
      // Stop the game loop
      if (gameEngine) {
        gameEngine.stop();
      }
      
      // Play gentle game over sound
      if (soundEffects) {
        soundEffects.playSound('gameOver');
      }
      
      // Transition to menu music after delay
      if (musicPlayer) {
        setTimeout(() => {
          if (musicPlayer.isInitialized) {
            musicPlayer.transitionToTrack('menu');
          }
        }, 2000);
      }
      
      // Show encouraging game over message
      if (gameUI) {
        gameUI.showGameOverOverlay({
          score: newState.score,
          lines: newState.lines,
          level: newState.level
        });
      }
      break;
      
    case GAME_STATES.MENU:
      // Hide game view and show menu
      hideGameView();
      if (menuSystem) {
        menuSystem.showMainMenu();
      }
      
      // Transition to menu music
      if (musicPlayer && musicPlayer.isInitialized) {
        musicPlayer.transitionToTrack('menu');
      }
      break;
  }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f00;
    color: white;
    padding: 20px;
    border-radius: 10px;
    font-family: 'Comic Sans MS', cursive;
    font-size: 18px;
    text-align: center;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(errorDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

/**
 * Handle window visibility changes
 */
document.addEventListener('visibilitychange', () => {
  if (gameEngine) {
    gameEngine.handleVisibilityChange();
  }
});

/**
 * Handle window focus/blur
 */
window.addEventListener('focus', () => {
  if (gameEngine) {
    gameEngine.handleFocusChange(true);
  }
});

window.addEventListener('blur', () => {
  if (gameEngine) {
    gameEngine.handleFocusChange(false);
  }
});

/**
 * Handle window resize for responsive canvas
 */
window.addEventListener('resize', () => {
  console.log('Window resized');
  
  // Update touch controls visibility
  if (inputController) {
    inputController.updateTouchControlsVisibility();
  }
  
  // Resize canvas if needed
  if (canvasRenderer) {
    canvasRenderer.setupCanvas();
  }
});

/**
 * Cleanup when page unloads
 */
window.addEventListener('beforeunload', () => {
  console.log('🧹 Cleaning up game systems...');
  
  // Destroy all systems
  if (gameEngine) {
    gameEngine.destroy();
  }
  
  if (canvasRenderer) {
    canvasRenderer.destroy();
  }
  
  if (animationManager) {
    animationManager.clearAll();
  }
  
  if (gameUI) {
    gameUI.destroy();
  }
  
  if (inputController) {
    inputController.destroy();
  }
  
  if (menuSystem) {
    menuSystem.destroy();
  }
  
  // Destroy audio systems
  if (whimsyInjector) {
    whimsyInjector.destroy();
  }
  
  if (musicPlayer) {
    musicPlayer.destroy();
  }
  
  if (soundEffects) {
    soundEffects.destroy();
  }
  
  if (audioManager) {
    audioManager.destroy();
  }
});

/**
 * Get debug information for all systems
 */
function getDebugInfo() {
  return {
    gameEngine: gameEngine ? gameEngine.getDebugInfo() : null,
    canvasRenderer: canvasRenderer ? { isInitialized: true } : null,
    animationManager: animationManager ? animationManager.getDebugInfo() : null,
    gameUI: gameUI ? gameUI.getState() : null,
    inputController: inputController ? inputController.getInputState() : null,
    menuSystem: menuSystem ? {
      currentScreen: menuSystem.getCurrentScreen(),
      isVisible: menuSystem.isVisible()
    } : null,
    audioManager: audioManager ? audioManager.getDebugInfo() : null,
    musicPlayer: musicPlayer ? musicPlayer.getDebugInfo() : null,
    soundEffects: soundEffects ? soundEffects.getDebugInfo() : null,
    whimsyInjector: whimsyInjector ? whimsyInjector.getDebugInfo() : null
  };
}

// Export for debugging
window.gameEngine = gameEngine;
window.getDebugInfo = getDebugInfo;