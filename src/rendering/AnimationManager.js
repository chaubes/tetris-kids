/**
 * AnimationManager - Handles smooth animations for piece movement and game effects
 * Creates delightful visual feedback for all game interactions
 */

import { ANIMATIONS, TIMING, BOARD_CONFIG } from '../core/Constants.js';

export class AnimationManager {
  constructor() {
    // Animation queues and states
    this.activeAnimations = new Map();
    this.easingFunctions = this.createEasingFunctions();

    // Piece movement animations
    this.pieceAnimations = {
      move: new Map(), // Track smooth piece movements
      rotation: new Map(), // Track piece rotations
      drop: new Map(), // Track piece drops
      lock: new Map(), // Track piece locking
    };

    // Special effects
    this.lineClears = [];
    this.levelUpEffect = null;
    this.achievementEffect = null;
    this.comboEffect = null;

    // Screen effects
    this.screenShake = {
      active: false,
      intensity: 0,
      duration: 0,
      elapsed: 0,
    };

    // Piece trail effects
    this.pieceTrails = [];

    // Floating text effects
    this.floatingTexts = [];

    console.log('✨ AnimationManager initialized');
  }

  /**
   * Create easing functions for smooth animations
   */
  createEasingFunctions() {
    return {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => t * (2 - t),
      easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
      easeInCubic: t => t * t * t,
      easeOutCubic: t => --t * t * t + 1,
      easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
      easeOutBounce: t => {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      },
      easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
          ? 0
          : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
    };
  }

  /**
   * Update all active animations
   */
  update(deltaTime) {
    // Update piece movement animations
    this.updatePieceAnimations(deltaTime);

    // Update line clear animations
    this.updateLineClearAnimations(deltaTime);

    // Update special effects
    this.updateSpecialEffects(deltaTime);

    // Update screen shake
    this.updateScreenShake(deltaTime);

    // Update floating text
    this.updateFloatingText(deltaTime);

    // Update piece trails
    this.updatePieceTrails(deltaTime);

    // Clean up completed animations
    this.cleanupAnimations();
  }

  /**
   * Animate piece movement
   */
  animatePieceMove(piece, fromPos, toPos, duration = 100) {
    const animationId = `move_${Date.now()}`;

    this.activeAnimations.set(animationId, {
      type: 'move',
      piece: piece,
      fromX: fromPos.x,
      fromY: fromPos.y,
      toX: toPos.x,
      toY: toPos.y,
      duration: duration,
      elapsed: 0,
      easing: 'easeOutQuad',
      onComplete: () => {
        this.createMoveTrail(toPos.x, toPos.y, piece.color);
      },
    });

    return animationId;
  }

  /**
   * Animate piece rotation with bouncy effect
   */
  animatePieceRotation(piece, fromRotation, toRotation, duration = 150) {
    const animationId = `rotation_${Date.now()}`;

    this.activeAnimations.set(animationId, {
      type: 'rotation',
      piece: piece,
      fromRotation: fromRotation,
      toRotation: toRotation,
      duration: duration,
      elapsed: 0,
      easing: 'easeOutBounce',
      scale: 1,
      onComplete: () => {
        this.createRotationSparkles(piece.x, piece.y);
      },
    });

    return animationId;
  }

  /**
   * Animate piece hard drop with satisfying impact
   */
  animateHardDrop(piece, fromY, toY, duration = 200) {
    const animationId = `drop_${Date.now()}`;

    this.activeAnimations.set(animationId, {
      type: 'drop',
      piece: piece,
      fromY: fromY,
      toY: toY,
      duration: duration,
      elapsed: 0,
      easing: 'easeInCubic',
      onComplete: () => {
        this.createDropImpact(piece.x, toY, piece.color);
        this.triggerScreenShake(150, 3);
      },
    });

    return animationId;
  }

  /**
   * Animate piece locking with pulsing effect
   */
  animatePieceLock(piece, duration = 200) {
    const animationId = `lock_${Date.now()}`;

    this.activeAnimations.set(animationId, {
      type: 'lock',
      piece: piece,
      duration: duration,
      elapsed: 0,
      easing: 'easeOutElastic',
      scale: 1,
      pulse: true,
      onComplete: () => {
        this.createLockParticles(piece.x, piece.y, piece.color);
      },
    });

    return animationId;
  }

  /**
   * Animate line clearing with spectacular effects
   */
  animateLineClear(lines, lineCount, isSpecial = false) {
    const duration = isSpecial ? TIMING.LINE_CLEAR_DELAY * 1.5 : TIMING.LINE_CLEAR_DELAY;

    lines.forEach((lineY, index) => {
      const animationId = `lineClear_${lineY}_${Date.now()}`;

      this.activeAnimations.set(animationId, {
        type: 'lineClear',
        lineY: lineY,
        lineCount: lineCount,
        isSpecial: isSpecial,
        duration: duration,
        elapsed: 0,
        delay: index * 50, // Stagger the line clears
        easing: 'easeInOutCubic',
        flash: true,
        particles: [],
        onComplete: () => {
          if (index === lines.length - 1) {
            // Last line
            this.createLineClearCelebration(lineCount, isSpecial);
          }
        },
      });
    });

    // Create combo text if multiple lines
    if (lineCount >= 2) {
      this.createComboText(lineCount, isSpecial);
    }

    // Screen shake for big clears
    if (lineCount >= 3) {
      this.triggerScreenShake(400, lineCount * 2);
    }
  }

  /**
   * Animate level up with celebratory effects
   */
  animateLevelUp(newLevel) {
    this.levelUpEffect = {
      active: true,
      level: newLevel,
      duration: 2000,
      elapsed: 0,
      phase: 0, // 0: zoom in, 1: display, 2: zoom out
      scale: 0,
      rotation: 0,
      particles: [],
    };

    // Create celebration particles
    this.createLevelUpCelebration(newLevel);

    // Screen shake
    this.triggerScreenShake(500, 5);

    // Floating congratulations text
    this.addFloatingText('LEVEL UP!', BOARD_CONFIG.WIDTH / 2, BOARD_CONFIG.HEIGHT / 2, {
      color: '#FFD700',
      size: 24,
      duration: 1500,
      easing: 'easeOutBounce',
    });
  }

  /**
   * Create achievement celebration effect
   */
  animateAchievement(achievementText, color = '#FF6B6B') {
    this.achievementEffect = {
      active: true,
      text: achievementText,
      color: color,
      duration: 2500,
      elapsed: 0,
      scale: 0,
      alpha: 1,
      particles: [],
    };

    // Create sparkle trail
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.createSparkleParticle(
          Math.random() * BOARD_CONFIG.WIDTH,
          Math.random() * BOARD_CONFIG.HEIGHT,
          color,
        );
      }, i * 100);
    }
  }

  /**
   * Update piece movement animations
   */
  updatePieceAnimations(deltaTime) {
    this.activeAnimations.forEach((animation, id) => {
      if (['move', 'rotation', 'drop', 'lock'].includes(animation.type)) {
        animation.elapsed += deltaTime;
        const progress = Math.min(animation.elapsed / animation.duration, 1);
        const easedProgress = this.easingFunctions[animation.easing](progress);

        // Apply animation based on type
        switch (animation.type) {
          case 'move':
            animation.piece.renderX =
              animation.fromX + (animation.toX - animation.fromX) * easedProgress;
            animation.piece.renderY =
              animation.fromY + (animation.toY - animation.fromY) * easedProgress;
            break;

          case 'rotation':
            animation.piece.renderRotation =
              animation.fromRotation +
              (animation.toRotation - animation.fromRotation) * easedProgress;
            animation.scale = 1 + Math.sin(progress * Math.PI) * 0.1; // Subtle scale pulse
            break;

          case 'drop':
            animation.piece.renderY =
              animation.fromY + (animation.toY - animation.fromY) * easedProgress;
            break;

          case 'lock':
            animation.scale = 1 + Math.sin(progress * Math.PI * 4) * 0.05 * (1 - progress); // Diminishing pulse
            break;
        }

        // Complete animation
        if (progress >= 1) {
          if (animation.onComplete) {
            animation.onComplete();
          }
          this.activeAnimations.delete(id);
        }
      }
    });
  }

  /**
   * Update line clear animations
   */
  updateLineClearAnimations(deltaTime) {
    this.activeAnimations.forEach((animation, id) => {
      if (animation.type === 'lineClear') {
        animation.elapsed += deltaTime;

        // Handle delay
        if (animation.elapsed < animation.delay) {
          return;
        }

        const adjustedElapsed = animation.elapsed - animation.delay;
        const progress = Math.min(adjustedElapsed / animation.duration, 1);

        // Update flash effect
        animation.flashIntensity = Math.sin(progress * Math.PI * 8) * (1 - progress);

        // Create particles throughout the animation
        if (Math.random() < 0.3) {
          this.createLineClearParticle(animation.lineY);
        }

        // Complete animation
        if (progress >= 1) {
          if (animation.onComplete) {
            animation.onComplete();
          }
          this.activeAnimations.delete(id);
        }
      }
    });
  }

  /**
   * Update special effects
   */
  updateSpecialEffects(deltaTime) {
    // Level up effect
    if (this.levelUpEffect && this.levelUpEffect.active) {
      this.levelUpEffect.elapsed += deltaTime;
      const progress = this.levelUpEffect.elapsed / this.levelUpEffect.duration;

      if (progress < 0.2) {
        // Zoom in phase
        this.levelUpEffect.scale = this.easingFunctions.easeOutBounce(progress * 5);
        this.levelUpEffect.phase = 0;
      } else if (progress < 0.8) {
        // Display phase
        this.levelUpEffect.scale = 1;
        this.levelUpEffect.rotation = Math.sin((progress - 0.2) * Math.PI * 10) * 0.1;
        this.levelUpEffect.phase = 1;
      } else {
        // Zoom out phase
        const fadeProgress = (progress - 0.8) * 5;
        this.levelUpEffect.scale = 1 - fadeProgress;
        this.levelUpEffect.alpha = 1 - fadeProgress;
        this.levelUpEffect.phase = 2;
      }

      if (progress >= 1) {
        this.levelUpEffect.active = false;
      }
    }

    // Achievement effect
    if (this.achievementEffect && this.achievementEffect.active) {
      this.achievementEffect.elapsed += deltaTime;
      const progress = this.achievementEffect.elapsed / this.achievementEffect.duration;

      if (progress < 0.3) {
        this.achievementEffect.scale = this.easingFunctions.easeOutElastic(progress * 3.33);
      } else if (progress > 0.7) {
        const fadeProgress = (progress - 0.7) * 3.33;
        this.achievementEffect.alpha = 1 - fadeProgress;
      }

      if (progress >= 1) {
        this.achievementEffect.active = false;
      }
    }
  }

  /**
   * Update screen shake effect
   */
  updateScreenShake(deltaTime) {
    if (this.screenShake.active) {
      this.screenShake.elapsed += deltaTime;
      const progress = this.screenShake.elapsed / this.screenShake.duration;

      if (progress >= 1) {
        this.screenShake.active = false;
        this.screenShake.offsetX = 0;
        this.screenShake.offsetY = 0;
      } else {
        const intensity = this.screenShake.intensity * (1 - progress);
        this.screenShake.offsetX = (Math.random() - 0.5) * intensity;
        this.screenShake.offsetY = (Math.random() - 0.5) * intensity;
      }
    }
  }

  /**
   * Update floating text effects
   */
  updateFloatingText(deltaTime) {
    this.floatingTexts = this.floatingTexts.filter(text => {
      text.elapsed += deltaTime;
      const progress = text.elapsed / text.duration;

      if (progress >= 1) {
        return false; // Remove completed text
      }

      const easedProgress = this.easingFunctions[text.easing || 'easeOutQuad'](progress);

      // Update position
      text.currentY = text.startY - easedProgress * text.riseDistance;
      text.currentAlpha = 1 - progress;
      text.currentScale = text.scale + easedProgress * 0.2;

      return true;
    });
  }

  /**
   * Update piece trails
   */
  updatePieceTrails(deltaTime) {
    this.pieceTrails = this.pieceTrails.filter(trail => {
      trail.elapsed += deltaTime;
      const progress = trail.elapsed / trail.duration;

      if (progress >= 1) {
        return false;
      }

      trail.alpha = (1 - progress) * trail.startAlpha;
      trail.scale = trail.startScale * (1 + progress * 0.2);

      return true;
    });
  }

  /**
   * Trigger screen shake effect
   */
  triggerScreenShake(duration, intensity) {
    this.screenShake = {
      active: true,
      duration: duration,
      intensity: intensity,
      elapsed: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }

  /**
   * Add floating text effect
   */
  addFloatingText(text, x, y, options = {}) {
    this.floatingTexts.push({
      text: text,
      startY: y,
      currentY: y,
      x: x,
      color: options.color || '#FFFFFF',
      size: options.size || 16,
      duration: options.duration || 1000,
      elapsed: 0,
      riseDistance: options.riseDistance || 50,
      currentAlpha: 1,
      scale: options.scale || 1,
      currentScale: options.scale || 1,
      easing: options.easing || 'easeOutQuad',
    });
  }

  /**
   * Create move trail effect
   */
  createMoveTrail(x, y, color) {
    this.pieceTrails.push({
      x: x * BOARD_CONFIG.CELL_SIZE,
      y: y * BOARD_CONFIG.CELL_SIZE,
      color: color,
      duration: 300,
      elapsed: 0,
      startAlpha: 0.3,
      alpha: 0.3,
      startScale: 1,
      scale: 1,
    });
  }

  /**
   * Create rotation sparkles
   */
  createRotationSparkles(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 15;
      this.createSparkleParticle(
        x * BOARD_CONFIG.CELL_SIZE + Math.cos(angle) * distance,
        y * BOARD_CONFIG.CELL_SIZE + Math.sin(angle) * distance,
        '#FFD700',
      );
    }
  }

  /**
   * Create drop impact effect
   */
  createDropImpact(x, y, color) {
    // Create impact particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      this.createParticle(
        x * BOARD_CONFIG.CELL_SIZE,
        y * BOARD_CONFIG.CELL_SIZE,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        500,
      );
    }
  }

  /**
   * Create lock particles
   */
  createLockParticles(x, y, color) {
    for (let i = 0; i < 4; i++) {
      this.createSparkleParticle(
        x * BOARD_CONFIG.CELL_SIZE + (Math.random() - 0.5) * 20,
        y * BOARD_CONFIG.CELL_SIZE + (Math.random() - 0.5) * 20,
        color,
      );
    }
  }

  /**
   * Create sparkle particle
   */
  createSparkleParticle(x, y, color) {
    // This would integrate with the particle system in CanvasRenderer
    // For now, we'll store the particle data for the renderer to use
    return {
      type: 'sparkle',
      x: x,
      y: y,
      color: color,
      size: Math.random() * 3 + 2,
      life: 1.0,
      decay: 0.02,
    };
  }

  /**
   * Create combo text effect
   */
  createComboText(lineCount, isSpecial) {
    const messages = {
      2: 'DOUBLE!',
      3: 'TRIPLE!',
      4: 'TETRIS!',
    };

    const message = isSpecial ? 'SPECIAL!' : messages[lineCount] || 'COMBO!';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    const color = colors[(lineCount - 1) % colors.length];

    this.addFloatingText(message, BOARD_CONFIG.WIDTH / 2, BOARD_CONFIG.HEIGHT / 3, {
      color: color,
      size: 20,
      duration: 1200,
      riseDistance: 60,
      easing: 'easeOutBounce',
    });
  }

  /**
   * Create line clear celebration
   */
  createLineClearCelebration(lineCount, isSpecial) {
    if (lineCount >= 4 || isSpecial) {
      // Create fireworks-style particles
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          this.createSparkleParticle(
            Math.random() * BOARD_CONFIG.WIDTH * BOARD_CONFIG.CELL_SIZE,
            Math.random() * BOARD_CONFIG.HEIGHT * BOARD_CONFIG.CELL_SIZE,
            `hsl(${Math.random() * 360}, 100%, 60%)`,
          );
        }, i * 50);
      }
    }
  }

  /**
   * Create level up celebration
   */
  createLevelUpCelebration(level) {
    // Create rainbow particles
    const colors = ['#FF6B6B', '#FFD93D', '#6BCF7F', '#4ECDC4', '#45B7D1', '#96CEB4'];

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        this.createSparkleParticle(
          Math.random() * BOARD_CONFIG.WIDTH * BOARD_CONFIG.CELL_SIZE,
          Math.random() * BOARD_CONFIG.HEIGHT * BOARD_CONFIG.CELL_SIZE,
          colors[i % colors.length],
        );
      }, i * 100);
    }
  }

  /**
   * Create line clear particle
   */
  createLineClearParticle(lineY) {
    const x = Math.random() * BOARD_CONFIG.WIDTH * BOARD_CONFIG.CELL_SIZE;
    const y = lineY * BOARD_CONFIG.CELL_SIZE;

    return this.createSparkleParticle(x, y, `hsl(${Math.random() * 360}, 100%, 70%)`);
  }

  /**
   * Get current screen shake offset
   */
  getScreenShakeOffset() {
    if (this.screenShake.active) {
      return {
        x: this.screenShake.offsetX,
        y: this.screenShake.offsetY,
      };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Get current piece animation data
   */
  getPieceAnimationData(piece) {
    const animations = Array.from(this.activeAnimations.values()).filter(
      anim => anim.piece === piece,
    );

    return animations.reduce(
      (data, anim) => {
        switch (anim.type) {
          case 'move':
            data.x = anim.piece.renderX || anim.piece.x;
            data.y = anim.piece.renderY || anim.piece.y;
            break;
          case 'rotation':
            data.rotation = anim.piece.renderRotation || 0;
            data.scale = anim.scale || 1;
            break;
          case 'lock':
            data.scale = anim.scale || 1;
            break;
        }
        return data;
      },
      {
        x: piece.x,
        y: piece.y,
        rotation: 0,
        scale: 1,
      },
    );
  }

  /**
   * Get active special effects for rendering
   */
  getSpecialEffects() {
    return {
      levelUp: this.levelUpEffect,
      achievement: this.achievementEffect,
      floatingTexts: this.floatingTexts,
      pieceTrails: this.pieceTrails,
    };
  }

  /**
   * Clean up completed animations
   */
  cleanupAnimations() {
    // Remove completed animations
    this.activeAnimations.forEach((animation, id) => {
      if (animation.elapsed >= animation.duration) {
        this.activeAnimations.delete(id);
      }
    });
  }

  /**
   * Clear all animations (useful for game reset)
   */
  clearAll() {
    this.activeAnimations.clear();
    this.pieceAnimations.move.clear();
    this.pieceAnimations.rotation.clear();
    this.pieceAnimations.drop.clear();
    this.pieceAnimations.lock.clear();

    this.lineClears = [];
    this.levelUpEffect = null;
    this.achievementEffect = null;
    this.comboEffect = null;

    this.screenShake.active = false;
    this.pieceTrails = [];
    this.floatingTexts = [];
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      activeAnimations: this.activeAnimations.size,
      screenShake: this.screenShake,
      floatingTexts: this.floatingTexts.length,
      pieceTrails: this.pieceTrails.length,
      specialEffects: {
        levelUp: this.levelUpEffect?.active || false,
        achievement: this.achievementEffect?.active || false,
      },
    };
  }
}
