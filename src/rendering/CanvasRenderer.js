/**
 * CanvasRenderer - High-performance canvas rendering system for Tetris
 * Handles all visual rendering with kid-friendly styling and smooth animations
 */

import { BOARD_CONFIG, CANVAS_CONFIG, PIECES, COLORS, DEBUG } from '../core/Constants.js';

export class CanvasRenderer {
  constructor(canvas, previewCanvas) {
    this.canvas = canvas;
    this.previewCanvas = previewCanvas;
    this.ctx = canvas.getContext('2d');
    this.previewCtx = previewCanvas.getContext('2d');

    // Performance optimizations
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.previewCtx.imageSmoothingEnabled = true;
    this.previewCtx.imageSmoothingQuality = 'high';

    // Rendering state
    this.animationFrameId = null;
    this.lastRenderTime = 0;
    this.particleEffects = [];
    this.sparkles = [];

    // Kid-friendly color palette
    this.blockColors = {
      '#00f5ff': {
        // I-piece - Cyan
        main: '#00f5ff',
        highlight: '#80faff',
        shadow: '#0077cc',
        glow: 'rgba(0, 245, 255, 0.5)',
      },
      '#ffed00': {
        // O-piece - Yellow
        main: '#ffed00',
        highlight: '#fff680',
        shadow: '#cc8800',
        glow: 'rgba(255, 237, 0, 0.5)',
      },
      '#a000f0': {
        // T-piece - Purple
        main: '#a000f0',
        highlight: '#d080f8',
        shadow: '#6600aa',
        glow: 'rgba(160, 0, 240, 0.5)',
      },
      '#00f000': {
        // S-piece - Green
        main: '#00f000',
        highlight: '#80f880',
        shadow: '#00aa00',
        glow: 'rgba(0, 240, 0, 0.5)',
      },
      '#f00000': {
        // Z-piece - Red
        main: '#f00000',
        highlight: '#ff8080',
        shadow: '#aa0000',
        glow: 'rgba(240, 0, 0, 0.5)',
      },
      '#0000f0': {
        // J-piece - Blue
        main: '#0000f0',
        highlight: '#8080ff',
        shadow: '#0000aa',
        glow: 'rgba(0, 0, 240, 0.5)',
      },
      '#f0a000': {
        // L-piece - Orange
        main: '#f0a000',
        highlight: '#ffd080',
        shadow: '#aa6600',
        glow: 'rgba(240, 160, 0, 0.5)',
      },
    };

    // Animation properties
    this.clearingLinesAnimation = {
      lines: [],
      progress: 0,
      duration: 300,
      particles: [],
    };

    this.levelUpAnimation = {
      active: false,
      progress: 0,
      duration: 1000,
      text: '',
      particles: [],
    };

    // Initialize renderer
    this.initialize();
  }

  /**
   * Initialize the canvas renderer
   */
  initialize() {
    this.setupCanvas();
    this.createBackgroundPattern();
    console.log('🎨 CanvasRenderer initialized');
  }

  /**
   * Setup canvas properties and scaling
   */
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;

    // Setup main canvas
    this.canvas.width = CANVAS_CONFIG.GAME_WIDTH * dpr;
    this.canvas.height = CANVAS_CONFIG.GAME_HEIGHT * dpr;
    this.canvas.style.width = `${CANVAS_CONFIG.GAME_WIDTH}px`;
    this.canvas.style.height = `${CANVAS_CONFIG.GAME_HEIGHT}px`;
    this.ctx.scale(dpr, dpr);

    // Setup preview canvas
    this.previewCanvas.width = CANVAS_CONFIG.PREVIEW_SIZE * dpr;
    this.previewCanvas.height = CANVAS_CONFIG.PREVIEW_SIZE * dpr;
    this.previewCanvas.style.width = `${CANVAS_CONFIG.PREVIEW_SIZE}px`;
    this.previewCanvas.style.height = `${CANVAS_CONFIG.PREVIEW_SIZE}px`;
    this.previewCtx.scale(dpr, dpr);
  }

  /**
   * Create background pattern for visual appeal
   */
  createBackgroundPattern() {
    // Create subtle grid pattern
    this.backgroundPattern = this.ctx.createPattern(this.createGridPattern(), 'repeat');
  }

  /**
   * Create grid pattern for background
   */
  createGridPattern() {
    const patternCanvas = document.createElement('canvas');
    const patternSize = BOARD_CONFIG.CELL_SIZE;
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');

    // Subtle grid lines
    patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    patternCtx.lineWidth = 1;
    patternCtx.strokeRect(0, 0, patternSize, patternSize);

    return patternCanvas;
  }

  /**
   * Main render function
   */
  render(gameData, interpolation = 1) {
    if (!gameData) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastRenderTime;
    this.lastRenderTime = currentTime;

    // Clear main canvas
    this.clearCanvas(this.ctx, CANVAS_CONFIG.GAME_WIDTH, CANVAS_CONFIG.GAME_HEIGHT);

    // Render background
    this.renderBackground();

    // Render game board
    this.renderBoard(gameData.board);

    // Render ghost piece (preview where piece will land)
    if (gameData.ghostPiece && gameData.ghostPiece.length > 0) {
      this.renderGhostPiece(gameData.ghostPiece);
    }

    // Render current piece
    if (gameData.currentPiece && gameData.currentPiece.length > 0) {
      this.renderPiece(gameData.currentPiece, false, interpolation);
    }

    // Render clearing lines animation
    if (gameData.clearingLines && gameData.clearingLines.length > 0) {
      this.renderClearingLines(gameData.clearingLines, deltaTime);
    }

    // Render particle effects
    this.updateAndRenderParticles(deltaTime);

    // Render level up animation
    if (this.levelUpAnimation.active) {
      this.renderLevelUpAnimation(deltaTime);
    }

    // Render debug info if enabled
    if (DEBUG.SHOW_GRID) {
      this.renderDebugGrid();
    }

    // Render FPS if enabled
    if (DEBUG.SHOW_FPS) {
      this.renderFPS(1000 / deltaTime);
    }

    // Render next piece preview
    if (gameData.nextPieces && gameData.nextPieces.length > 0) {
      this.renderNextPiece(gameData.nextPieces[0]);
    }
  }

  /**
   * Clear canvas with background
   */
  clearCanvas(ctx, width, height) {
    ctx.fillStyle = COLORS.BOARD_BACKGROUND;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Render background with pattern
   */
  renderBackground() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_CONFIG.GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_CONFIG.GAME_WIDTH, CANVAS_CONFIG.GAME_HEIGHT);

    // Add subtle grid pattern
    if (this.backgroundPattern) {
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = this.backgroundPattern;
      this.ctx.fillRect(0, 0, CANVAS_CONFIG.GAME_WIDTH, CANVAS_CONFIG.GAME_HEIGHT);
      this.ctx.globalAlpha = 1;
    }
  }

  /**
   * Render the game board with placed pieces
   */
  renderBoard(board) {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x] !== 0) {
          const blockX = x * BOARD_CONFIG.CELL_SIZE;
          const blockY = y * BOARD_CONFIG.CELL_SIZE;
          this.renderBlock(blockX, blockY, board[y][x], false, 1.0);
        }
      }
    }
  }

  /**
   * Render a single Tetris piece
   */
  renderPiece(piecePositions, isGhost = false, interpolation = 1) {
    piecePositions.forEach(pos => {
      const blockX = pos.x * BOARD_CONFIG.CELL_SIZE;
      const blockY = pos.y * BOARD_CONFIG.CELL_SIZE;
      this.renderBlock(blockX, blockY, pos.color, isGhost, interpolation);
    });
  }

  /**
   * Render ghost piece (transparent preview)
   */
  renderGhostPiece(ghostPositions) {
    this.ctx.globalAlpha = 0.3;
    ghostPositions.forEach(pos => {
      const blockX = pos.x * BOARD_CONFIG.CELL_SIZE;
      const blockY = pos.y * BOARD_CONFIG.CELL_SIZE;
      this.renderBlock(blockX, blockY, pos.color, true, 1.0);
    });
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Render a single block with kid-friendly styling
   */
  renderBlock(x, y, color, isGhost = false, alpha = 1.0) {
    const size = BOARD_CONFIG.CELL_SIZE;
    const colors = this.blockColors[color] || {
      main: color,
      highlight: color,
      shadow: color,
      glow: 'rgba(255, 255, 255, 0.2)',
    };

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    if (!isGhost) {
      // Add glow effect
      this.ctx.shadowColor = colors.glow;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }

    // Main block with rounded corners
    this.ctx.fillStyle = colors.main;
    this.roundRect(x + 2, y + 2, size - 4, size - 4, 6);
    this.ctx.fill();

    if (!isGhost) {
      // Reset shadow for other elements
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;

      // Highlight (top-left)
      const highlightGradient = this.ctx.createLinearGradient(x, y, x + size * 0.5, y + size * 0.5);
      highlightGradient.addColorStop(0, colors.highlight);
      highlightGradient.addColorStop(1, colors.main);

      this.ctx.fillStyle = highlightGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x + 2, y + 8);
      this.ctx.lineTo(x + 2, y + 2);
      this.ctx.lineTo(x + 8, y + 2);
      this.ctx.lineTo(x + size - 8, y + 8);
      this.ctx.lineTo(x + 8, y + 8);
      this.ctx.closePath();
      this.ctx.fill();

      // Shadow (bottom-right)
      const shadowGradient = this.ctx.createLinearGradient(
        x + size * 0.5,
        y + size * 0.5,
        x + size,
        y + size,
      );
      shadowGradient.addColorStop(0, colors.main);
      shadowGradient.addColorStop(1, colors.shadow);

      this.ctx.fillStyle = shadowGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x + size - 2, y + size - 8);
      this.ctx.lineTo(x + size - 2, y + size - 2);
      this.ctx.lineTo(x + size - 8, y + size - 2);
      this.ctx.lineTo(x + 8, y + size - 8);
      this.ctx.lineTo(x + size - 8, y + size - 8);
      this.ctx.closePath();
      this.ctx.fill();

      // Inner shine
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.roundRect(x + 6, y + 6, size - 12, size - 12, 3);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * Helper function to draw rounded rectangles
   */
  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * Render clearing lines animation with sparkles
   */
  renderClearingLines(clearingLines, deltaTime) {
    clearingLines.forEach(lineY => {
      const y = lineY * BOARD_CONFIG.CELL_SIZE;

      // Flash effect
      const flashProgress = (Date.now() % 200) / 200;
      this.ctx.globalAlpha = 0.5 + Math.sin(flashProgress * Math.PI) * 0.3;

      // Rainbow gradient for clearing lines
      const gradient = this.ctx.createLinearGradient(0, y, CANVAS_CONFIG.GAME_WIDTH, y);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.2, '#ffd93d');
      gradient.addColorStop(0.4, '#6bcf7f');
      gradient.addColorStop(0.6, '#4ecdc4');
      gradient.addColorStop(0.8, '#45b7d1');
      gradient.addColorStop(1, '#96ceb4');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, y, CANVAS_CONFIG.GAME_WIDTH, BOARD_CONFIG.CELL_SIZE);

      this.ctx.globalAlpha = 1.0;

      // Add sparkles
      this.createLineCleanSparkles(lineY);
    });
  }

  /**
   * Create sparkle effects for line clearing
   */
  createLineCleanSparkles(lineY) {
    const y = lineY * BOARD_CONFIG.CELL_SIZE + BOARD_CONFIG.CELL_SIZE / 2;

    // Create sparkles along the cleared line
    for (let i = 0; i < 8; i++) {
      const x = (i / 7) * CANVAS_CONFIG.GAME_WIDTH;
      this.sparkles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        life: 1.0,
        decay: 0.02,
      });
    }
  }

  /**
   * Update and render particle effects
   */
  updateAndRenderParticles(deltaTime) {
    // Update sparkles
    this.sparkles = this.sparkles.filter(sparkle => {
      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;
      sparkle.life -= sparkle.decay;

      if (sparkle.life > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = sparkle.life;
        this.ctx.fillStyle = sparkle.color;
        this.ctx.beginPath();
        this.ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Star shape
        this.ctx.strokeStyle = sparkle.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(sparkle.x - sparkle.size, sparkle.y);
        this.ctx.lineTo(sparkle.x + sparkle.size, sparkle.y);
        this.ctx.moveTo(sparkle.x, sparkle.y - sparkle.size);
        this.ctx.lineTo(sparkle.x, sparkle.y + sparkle.size);
        this.ctx.stroke();

        this.ctx.restore();
        return true;
      }
      return false;
    });
  }

  /**
   * Render level up animation
   */
  renderLevelUpAnimation(deltaTime) {
    if (!this.levelUpAnimation.active) return;

    this.levelUpAnimation.progress += deltaTime;
    const progress = Math.min(this.levelUpAnimation.progress / this.levelUpAnimation.duration, 1);

    // Animated text
    this.ctx.save();

    const centerX = CANVAS_CONFIG.GAME_WIDTH / 2;
    const centerY = CANVAS_CONFIG.GAME_HEIGHT / 2;

    // Scale animation
    const scale = 0.5 + Math.sin(progress * Math.PI) * 0.5;
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-centerX, -centerY);

    // Rainbow text effect
    const hue = (Date.now() * 0.5) % 360;
    this.ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.font = 'bold 24px "Fredoka One", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.strokeText(this.levelUpAnimation.text, centerX, centerY);
    this.ctx.fillText(this.levelUpAnimation.text, centerX, centerY);

    this.ctx.restore();

    // Create celebration particles
    if (Math.random() < 0.3) {
      this.createCelebrationParticles();
    }

    if (progress >= 1) {
      this.levelUpAnimation.active = false;
    }
  }

  /**
   * Create celebration particles for level up
   */
  createCelebrationParticles() {
    for (let i = 0; i < 3; i++) {
      this.sparkles.push({
        x: Math.random() * CANVAS_CONFIG.GAME_WIDTH,
        y: Math.random() * CANVAS_CONFIG.GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 6 + 3,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        life: 1.0,
        decay: 0.015,
      });
    }
  }

  /**
   * Render next piece preview
   */
  renderNextPiece(nextPiece) {
    if (!nextPiece) return;

    // Clear preview canvas
    this.clearCanvas(this.previewCtx, CANVAS_CONFIG.PREVIEW_SIZE, CANVAS_CONFIG.PREVIEW_SIZE);

    // Get piece shape and color
    const piece = PIECES[nextPiece.type];
    if (!piece) return;

    const shape = piece.shape;
    const color = piece.color;

    // Calculate centering offset
    const pieceWidth = shape[0].length * (BOARD_CONFIG.CELL_SIZE * 0.7);
    const pieceHeight = shape.length * (BOARD_CONFIG.CELL_SIZE * 0.7);
    const offsetX = (CANVAS_CONFIG.PREVIEW_SIZE - pieceWidth) / 2;
    const offsetY = (CANVAS_CONFIG.PREVIEW_SIZE - pieceHeight) / 2;

    // Render piece blocks
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const blockX = offsetX + x * (BOARD_CONFIG.CELL_SIZE * 0.7);
          const blockY = offsetY + y * (BOARD_CONFIG.CELL_SIZE * 0.7);
          this.renderPreviewBlock(blockX, blockY, color);
        }
      }
    }
  }

  /**
   * Render a block in the preview canvas
   */
  renderPreviewBlock(x, y, color) {
    const size = BOARD_CONFIG.CELL_SIZE * 0.7;
    const colors = this.blockColors[color] || {
      main: color,
      highlight: color,
      shadow: color,
    };

    this.previewCtx.save();

    // Add glow effect
    this.previewCtx.shadowColor = colors.glow || 'rgba(255, 255, 255, 0.3)';
    this.previewCtx.shadowBlur = 8;

    // Main block
    this.previewCtx.fillStyle = colors.main;
    this.previewCtx.beginPath();
    this.previewCtx.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
    this.previewCtx.fill();

    // Reset shadow
    this.previewCtx.shadowColor = 'transparent';
    this.previewCtx.shadowBlur = 0;

    // Highlight
    this.previewCtx.fillStyle = colors.highlight;
    this.previewCtx.beginPath();
    this.previewCtx.roundRect(x + 3, y + 3, size - 12, size - 12, 2);
    this.previewCtx.fill();

    this.previewCtx.restore();
  }

  /**
   * Trigger level up animation
   */
  triggerLevelUp(level) {
    this.levelUpAnimation = {
      active: true,
      progress: 0,
      duration: 1500,
      text: `LEVEL ${level}!`,
      particles: [],
    };
  }

  /**
   * Trigger line clear celebration
   */
  triggerLineClear(count, isSpecial = false) {
    const messages = {
      1: 'Nice!',
      2: 'Great!',
      3: 'Awesome!',
      4: 'TETRIS!',
    };

    if (isSpecial || count >= 4) {
      this.createFireworks();
    }

    // Create screen shake effect for big clears
    if (count >= 3) {
      this.screenShake(300, count * 2);
    }
  }

  /**
   * Create fireworks effect
   */
  createFireworks() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#45b7d1', '#96ceb4'];

    for (let i = 0; i < 20; i++) {
      this.sparkles.push({
        x: CANVAS_CONFIG.GAME_WIDTH / 2,
        y: CANVAS_CONFIG.GAME_HEIGHT / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.01,
      });
    }
  }

  /**
   * Screen shake effect
   */
  screenShake(duration, intensity) {
    const startTime = Date.now();
    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const currentIntensity = intensity * (1 - progress);

        this.canvas.style.transform = `translate(${
          (Math.random() - 0.5) * currentIntensity
        }px, ${(Math.random() - 0.5) * currentIntensity}px)`;

        requestAnimationFrame(shake);
      } else {
        this.canvas.style.transform = 'translate(0, 0)';
      }
    };
    shake();
  }

  /**
   * Render debug grid
   */
  renderDebugGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= BOARD_CONFIG.WIDTH; x++) {
      const lineX = x * BOARD_CONFIG.CELL_SIZE;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, 0);
      this.ctx.lineTo(lineX, CANVAS_CONFIG.GAME_HEIGHT);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= BOARD_CONFIG.HEIGHT; y++) {
      const lineY = y * BOARD_CONFIG.CELL_SIZE;
      this.ctx.beginPath();
      this.ctx.moveTo(0, lineY);
      this.ctx.lineTo(CANVAS_CONFIG.GAME_WIDTH, lineY);
      this.ctx.stroke();
    }
  }

  /**
   * Render FPS counter
   */
  renderFPS(fps) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`FPS: ${Math.round(fps)}`, CANVAS_CONFIG.GAME_WIDTH - 10, 20);
  }

  /**
   * Get canvas for external access
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Get preview canvas for external access
   */
  getPreviewCanvas() {
    return this.previewCanvas;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.particleEffects = [];
    this.sparkles = [];

    console.log('🧹 CanvasRenderer destroyed');
  }
}
