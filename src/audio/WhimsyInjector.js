/**
 * WhimsyInjector - Adds delightful and kid-friendly audio enhancements
 * Works with existing AudioManager, MusicPlayer, and SoundEffects to create
 * magical, encouraging, and joyful audio experiences for young players
 */

export class WhimsyInjector {
  constructor(audioManager, musicPlayer, soundEffects) {
    this.audioManager = audioManager;
    this.musicPlayer = musicPlayer;
    this.soundEffects = soundEffects;
    this.isInitialized = false;

    // Whimsical state tracking
    this.playerState = {
      skillLevel: 'beginner', // beginner, intermediate, advanced
      encouragementNeeded: false,
      consecutiveSuccesses: 0,
      recentMistakes: 0,
      playSession: {
        startTime: Date.now(),
        totalMoves: 0,
        perfectMoves: 0,
        linesCleared: 0,
      },
    };

    // Seasonal and themed variations
    this.currentTheme = 'default';
    this.availableThemes = {
      default: { name: 'Cheerful', mood: 'happy' },
      winter: { name: 'Winter Wonderland', mood: 'cozy' },
      spring: { name: 'Flower Garden', mood: 'fresh' },
      summer: { name: 'Beach Day', mood: 'energetic' },
      autumn: { name: 'Harvest Festival', mood: 'warm' },
      birthday: { name: 'Birthday Party', mood: 'celebratory' },
      space: { name: 'Cosmic Adventure', mood: 'mysterious' },
      underwater: { name: 'Ocean Explorer', mood: 'fluid' },
    };

    // Whimsical sound library
    this.whimsySounds = this.createWhimsySoundLibrary();

    // Encouragement system
    this.encouragementTimer = null;
    this.lastEncouragement = 0;
    this.encouragementCooldown = 30000; // 30 seconds between encouragements

    // Surprise moments system
    this.surpriseMoments = {
      rareSoundChance: 0.05, // 5% chance for rare sounds
      lastSurprise: 0,
      surpriseCooldown: 45000, // 45 seconds between surprises
      magicalMoments: [
        'unicorn_whinny',
        'fairy_bells',
        'magic_sparkle',
        'gentle_laugh',
        'owl_hoot',
        'wind_chime',
      ],
    };

    // Adaptive audio system
    this.adaptiveAudio = {
      volumeAdjustments: {},
      tempoAdjustments: {},
      complexityLevel: 1,
    };

    // Achievement tracking
    this.achievements = {
      firstTetris: false,
      tenLinesCleared: false,
      perfectSession: false,
      speedDemon: false,
      persistence: false, // playing for extended time
    };

    // Event listeners for game events
    this.eventListeners = new Map();

    // Kid-friendly settings
    this.whimsySettings = {
      maxEncouragementVolume: 0.4,
      surpriseVolume: 0.35,
      gentleTransitions: true,
      positiveReinforcement: true,
      adaptiveComplexity: true,
      magicalMoments: true,
      seasonalVariations: true,
    };

    console.log('🎭 WhimsyInjector created - Ready to add magic to audio!');
  }

  /**
   * Initialize the whimsy injection system
   */
  async initialize() {
    if (this.isInitialized) return;

    if (!this.audioManager?.isInitialized) {
      console.warn('AudioManager not ready for whimsy injection');
      return;
    }

    console.log('✨ Initializing WhimsyInjector - Adding magic...');

    // Set initial theme based on time of year
    this.autoSelectSeasonalTheme();

    // Start monitoring player behavior
    this.startPlayerAnalysis();

    // Initialize adaptive audio
    this.initializeAdaptiveAudio();

    this.isInitialized = true;
    this.emit('whimsyInitialized');

    console.log('🎉 WhimsyInjector ready - Let the magic begin!');
  }

  /**
   * Create comprehensive whimsical sound library
   */
  createWhimsySoundLibrary() {
    return {
      // Encouragement sounds
      encouragement_gentle: {
        type: 'sequence',
        notes: [
          { freq: 523, time: 0, duration: 0.3, volume: 0.3 }, // C5
          { freq: 659, time: 0.2, duration: 0.3, volume: 0.25 }, // E5
          { freq: 784, time: 0.4, duration: 0.4, volume: 0.3 }, // G5
        ],
        description: 'Gentle encouraging melody',
      },

      encouragement_cheerful: {
        type: 'bounce',
        baseFreq: 659,
        bounces: 3,
        bounceDuration: 0.15,
        volume: 0.35,
        description: 'Cheerful bouncy encouragement',
      },

      // Celebration enhancements
      confetti_burst: {
        type: 'sparkle_burst',
        baseFreq: 880,
        sparkles: 8,
        duration: 1.5,
        volume: 0.4,
        description: 'Magical confetti explosion sound',
      },

      rainbow_slide: {
        type: 'chromatic_slide',
        startFreq: 523,
        endFreq: 1047,
        steps: 12,
        stepDuration: 0.08,
        volume: 0.3,
        description: 'Musical rainbow slide',
      },

      // Magical moment sounds
      unicorn_whinny: {
        type: 'magical_creature',
        frequencies: [440, 554, 659, 831],
        durations: [0.2, 0.15, 0.25, 0.3],
        volumes: [0.25, 0.3, 0.35, 0.2],
        description: 'Gentle unicorn sound',
      },

      fairy_bells: {
        type: 'bell_sequence',
        frequencies: [1319, 1568, 1976, 2349],
        timings: [0, 0.1, 0.25, 0.4],
        duration: 0.8,
        volume: 0.25,
        description: 'Delicate fairy bells',
      },

      // Themed sound variations
      ocean_waves: {
        type: 'wave_sound',
        baseFreq: 200,
        waveCount: 3,
        duration: 2.0,
        volume: 0.2,
        description: 'Gentle ocean waves',
      },

      bird_chirp: {
        type: 'nature_sound',
        frequencies: [1000, 1200, 800],
        pattern: 'chirp',
        duration: 0.6,
        volume: 0.3,
        description: 'Happy bird chirping',
      },

      wind_chime: {
        type: 'chime_cascade',
        baseFreq: 659,
        chimes: 5,
        randomness: 0.3,
        duration: 1.2,
        volume: 0.25,
        description: 'Peaceful wind chimes',
      },

      // Skill-adaptive sounds
      beginner_success: {
        type: 'simple_celebration',
        frequency: 659,
        duration: 0.4,
        volume: 0.4,
        warmth: 1.0,
        description: 'Simple success sound for beginners',
      },

      intermediate_success: {
        type: 'chord_progression',
        chords: [
          { notes: [523, 659, 784], duration: 0.3 },
          { notes: [587, 740, 880], duration: 0.4 },
        ],
        volume: 0.35,
        description: 'Richer success sound for intermediate players',
      },

      advanced_success: {
        type: 'complex_fanfare',
        sequences: [
          { freq: 523, time: 0, duration: 0.2 },
          { freq: 659, time: 0.1, duration: 0.2 },
          { freq: 784, time: 0.2, duration: 0.2 },
          { freq: 1047, time: 0.3, duration: 0.3 },
          { freq: 880, time: 0.45, duration: 0.2 },
          { freq: 1047, time: 0.55, duration: 0.4 },
        ],
        volume: 0.4,
        description: 'Complex fanfare for advanced players',
      },
    };
  }

  /**
   * Enhance existing sound effects with whimsical touches
   */
  enhanceSoundEffect(originalSoundName, gameContext = {}) {
    if (!this.isInitialized) return;

    const enhancement = this.getEnhancementForSound(originalSoundName, gameContext);

    if (enhancement) {
      // Add magical sparkle to the original sound
      setTimeout(() => {
        this.playWhimsicalEffect(enhancement.type, enhancement.options);
      }, enhancement.delay || 0);

      // Check for surprise moment opportunity
      if (this.shouldTriggerSurprise()) {
        this.triggerSurpriseMoment(gameContext);
      }
    }
  }

  /**
   * Get appropriate enhancement for a sound
   */
  getEnhancementForSound(soundName, context) {
    const enhancements = {
      move: {
        type: 'sparkle_trail',
        options: { intensity: 0.1, position: context.position },
        delay: 50,
      },

      rotate: {
        type: 'twirl_magic',
        options: { direction: context.direction || 'clockwise' },
        delay: 30,
      },

      lineClear: {
        type: 'rainbow_explosion',
        options: {
          lineCount: context.linesCleared || 1,
          intensity: this.calculateIntensityForPlayer(),
        },
        delay: 100,
      },

      tetris: {
        type: 'mega_celebration',
        options: {
          skillLevel: this.playerState.skillLevel,
          isFirstTetris: !this.achievements.firstTetris,
        },
        delay: 200,
      },

      levelUp: {
        type: 'level_ascension',
        options: {
          newLevel: context.level,
          encouragement: true,
        },
        delay: 150,
      },
    };

    return enhancements[soundName];
  }

  /**
   * Play whimsical effect based on type
   */
  playWhimsicalEffect(effectType, options = {}) {
    if (!this.audioManager?.audioContext) return;

    switch (effectType) {
      case 'sparkle_trail':
        this.createSparkleTrail(options);
        break;
      case 'twirl_magic':
        this.createTwirlMagic(options);
        break;
      case 'rainbow_explosion':
        this.createRainbowExplosion(options);
        break;
      case 'mega_celebration':
        this.createMegaCelebration(options);
        break;
      case 'level_ascension':
        this.createLevelAscension(options);
        break;
      default:
        this.createGenericWhimsy(options);
    }
  }

  /**
   * Create sparkle trail effect
   */
  createSparkleTrail(options) {
    const { intensity = 0.2, position } = options;
    const sparkleCount = Math.floor(3 + intensity * 5);

    for (let i = 0; i < sparkleCount; i++) {
      setTimeout(() => {
        const frequency = 800 + Math.random() * 400;
        const volume = intensity * 0.3 * (1 - i * 0.1);

        this.audioManager.playGeneratedSound({
          frequency,
          duration: 0.1,
          volume,
          waveform: 'sine',
          envelope: 'sparkle',
        });
      }, i * 50);
    }
  }

  /**
   * Create twirl magic effect
   */
  createTwirlMagic(options) {
    const { direction = 'clockwise' } = options;
    const frequencies = direction === 'clockwise' ? [659, 784, 880, 1047] : [1047, 880, 784, 659];

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.audioManager.playGeneratedSound({
          frequency: freq,
          duration: 0.08,
          volume: 0.25,
          waveform: 'triangle',
          envelope: 'gentle',
        });
      }, index * 40);
    });
  }

  /**
   * Create rainbow explosion effect
   */
  createRainbowExplosion(options) {
    const { lineCount = 1, intensity = 1 } = options;
    const baseVolume = Math.min(0.4, 0.2 + lineCount * 0.05) * intensity;

    // Multiple cascading sequences
    for (let seq = 0; seq < lineCount; seq++) {
      setTimeout(() => {
        // Ascending sparkle sequence
        const notes = [523, 659, 784, 988, 1175, 1319];
        notes.forEach((freq, index) => {
          setTimeout(() => {
            this.audioManager.playGeneratedSound({
              frequency: freq + (Math.random() * 50 - 25), // Slight randomization
              duration: 0.15,
              volume: baseVolume * (1 - index * 0.1),
              waveform: 'sine',
              envelope: 'sparkle',
            });
          }, index * 60);
        });
      }, seq * 200);
    }
  }

  /**
   * Create mega celebration effect
   */
  createMegaCelebration(options) {
    const { skillLevel, isFirstTetris } = options;

    if (isFirstTetris) {
      this.achievements.firstTetris = true;
      this.playWhimsicalSound('confetti_burst');

      // Special first tetris encouragement
      setTimeout(() => {
        this.provideEncouragement('first_tetris');
      }, 1500);
    } else {
      // Regular tetris celebration enhanced by skill level
      const celebrationSound =
        skillLevel === 'beginner'
          ? 'beginner_success'
          : skillLevel === 'intermediate'
            ? 'intermediate_success'
            : 'advanced_success';

      this.playWhimsicalSound(celebrationSound);
    }

    // Add themed celebration if applicable
    this.addThemedCelebration();
  }

  /**
   * Create level ascension effect
   */
  createLevelAscension(options) {
    const { newLevel, encouragement } = options;

    // Musical scale ascending
    const scale = [523, 587, 659, 740, 831, 932, 1047]; // C major scale

    scale.forEach((freq, index) => {
      setTimeout(() => {
        this.audioManager.playGeneratedSound({
          frequency: freq,
          duration: 0.2,
          volume: 0.3,
          waveform: 'triangle',
          envelope: 'gentle',
        });
      }, index * 150);
    });

    // Add encouragement after ascension
    if (encouragement) {
      setTimeout(
        () => {
          this.provideEncouragement('level_up', { level: newLevel });
        },
        scale.length * 150 + 500,
      );
    }
  }

  /**
   * Provide contextual audio encouragement
   */
  provideEncouragement(context = 'general', options = {}) {
    if (!this.whimsySettings.positiveReinforcement) return;
    if (Date.now() - this.lastEncouragement < this.encouragementCooldown) return;

    const encouragementType = this.selectEncouragementType(context, options);

    this.playWhimsicalSound(encouragementType);
    this.lastEncouragement = Date.now();

    // Track encouragement effectiveness
    this.playerState.encouragementNeeded = false;

    console.log(`🎵 Provided encouragement: ${encouragementType} for context: ${context}`);

    this.emit('encouragementProvided', { type: encouragementType, context, options });
  }

  /**
   * Select appropriate encouragement type
   */
  selectEncouragementType(context, options) {
    const encouragements = {
      general: ['encouragement_gentle', 'encouragement_cheerful'],
      struggling: ['encouragement_gentle', 'fairy_bells'],
      first_tetris: ['confetti_burst', 'rainbow_slide'],
      level_up: ['encouragement_cheerful', 'wind_chime'],
      comeback: ['encouragement_cheerful', 'bird_chirp'],
      persistence: ['wind_chime', 'fairy_bells'],
    };

    const contextOptions = encouragements[context] || encouragements.general;
    return contextOptions[Math.floor(Math.random() * contextOptions.length)];
  }

  /**
   * Play whimsical sound from library
   */
  playWhimsicalSound(soundName, customOptions = {}) {
    if (!this.isInitialized) return;

    const sound = this.whimsySounds[soundName];
    if (!sound) {
      console.warn(`Whimsical sound '${soundName}' not found`);
      return;
    }

    const options = { ...sound, ...customOptions };

    switch (sound.type) {
      case 'sequence':
        this.playSequence(options);
        break;
      case 'bounce':
        this.playBounce(options);
        break;
      case 'sparkle_burst':
        this.playSparkleburst(options);
        break;
      case 'chromatic_slide':
        this.playChromaticSlide(options);
        break;
      case 'bell_sequence':
        this.playBellSequence(options);
        break;
      case 'chime_cascade':
        this.playChimeCascade(options);
        break;
      default:
        this.playGenericWhimsicalSound(options);
    }
  }

  /**
   * Play sequence of notes
   */
  playSequence(options) {
    const { notes } = options;

    notes.forEach(note => {
      setTimeout(() => {
        this.audioManager.playGeneratedSound({
          frequency: note.freq,
          duration: note.duration,
          volume: note.volume,
          waveform: 'triangle',
          envelope: 'gentle',
        });
      }, note.time * 1000);
    });
  }

  /**
   * Play bouncy effect
   */
  playBounce(options) {
    const { baseFreq, bounces, bounceDuration, volume } = options;

    for (let i = 0; i < bounces; i++) {
      setTimeout(
        () => {
          this.audioManager.playGeneratedSound({
            frequency: baseFreq + i * 50,
            duration: bounceDuration,
            volume: volume * (1 - i * 0.1),
            waveform: 'triangle',
            envelope: 'pluck',
          });
        },
        i * (bounceDuration * 1000 * 0.6),
      );
    }
  }

  /**
   * Add delightful audio surprises
   */
  triggerSurpriseMoment(gameContext = {}) {
    if (!this.whimsySettings.magicalMoments) return;
    if (Date.now() - this.surpriseMoments.lastSurprise < this.surpriseMoments.surpriseCooldown)
      return;

    const surpriseSound =
      this.surpriseMoments.magicalMoments[
        Math.floor(Math.random() * this.surpriseMoments.magicalMoments.length)
      ];

    // Add slight delay for natural feeling
    setTimeout(
      () => {
        this.playWhimsicalSound(surpriseSound, { volume: this.whimsySettings.surpriseVolume });
        this.surpriseMoments.lastSurprise = Date.now();

        console.log(`✨ Surprise moment triggered: ${surpriseSound}`);
        this.emit('surpriseMoment', { sound: surpriseSound, context: gameContext });
      },
      Math.random() * 2000 + 500,
    ); // 0.5 to 2.5 seconds delay
  }

  /**
   * Check if surprise should be triggered
   */
  shouldTriggerSurprise() {
    return (
      Math.random() < this.surpriseMoments.rareSoundChance &&
      Date.now() - this.surpriseMoments.lastSurprise > this.surpriseMoments.surpriseCooldown
    );
  }

  /**
   * Add seasonal or themed audio variations
   */
  setTheme(themeName) {
    if (!this.availableThemes[themeName]) {
      console.warn(`Theme '${themeName}' not available`);
      return;
    }

    this.currentTheme = themeName;
    const theme = this.availableThemes[themeName];

    console.log(`🎨 Switching to theme: ${theme.name} (${theme.mood})`);

    // Adjust audio characteristics based on theme
    this.applyThemeAudioCharacteristics(theme);

    this.emit('themeChanged', { theme: themeName, ...theme });
  }

  /**
   * Auto-select seasonal theme based on current date
   */
  autoSelectSeasonalTheme() {
    if (!this.whimsySettings.seasonalVariations) return;

    const now = new Date();
    const month = now.getMonth(); // 0-11

    let seasonalTheme = 'default';

    if (month >= 11 || month <= 1) seasonalTheme = 'winter';
    else if (month >= 2 && month <= 4) seasonalTheme = 'spring';
    else if (month >= 5 && month <= 7) seasonalTheme = 'summer';
    else if (month >= 8 && month <= 10) seasonalTheme = 'autumn';

    // Check for special occasions (simplified)
    const day = now.getDate();
    if (month === 11 && day >= 20) seasonalTheme = 'winter'; // Winter solstice

    this.setTheme(seasonalTheme);
  }

  /**
   * Apply theme-specific audio characteristics
   */
  applyThemeAudioCharacteristics(theme) {
    const characteristics = {
      happy: { brightness: 1.2, warmth: 1.1, sparkle: 1.3 },
      cozy: { brightness: 0.8, warmth: 1.4, sparkle: 0.9 },
      fresh: { brightness: 1.3, warmth: 1.0, sparkle: 1.5 },
      energetic: { brightness: 1.4, warmth: 0.9, sparkle: 1.6 },
      warm: { brightness: 1.0, warmth: 1.3, sparkle: 1.1 },
      celebratory: { brightness: 1.5, warmth: 1.2, sparkle: 2.0 },
      mysterious: { brightness: 0.7, warmth: 0.8, sparkle: 1.8 },
      fluid: { brightness: 0.9, warmth: 1.1, sparkle: 1.2 },
    };

    const char = characteristics[theme.mood] || characteristics.happy;

    // Store theme characteristics for use in sound generation
    this.themeCharacteristics = char;
  }

  /**
   * Implement adaptive audio that responds to player skill level
   */
  analyzePlayerSkill(gameData) {
    const { moveAccuracy = 0.8, decisionSpeed = 1000, linesPerMinute = 0, level = 1 } = gameData;

    // Determine skill level based on multiple factors
    let skillScore = 0;

    if (moveAccuracy > 0.9) skillScore += 2;
    else if (moveAccuracy > 0.7) skillScore += 1;

    if (decisionSpeed < 800) skillScore += 2;
    else if (decisionSpeed < 1500) skillScore += 1;

    if (linesPerMinute > 15) skillScore += 2;
    else if (linesPerMinute > 8) skillScore += 1;

    if (level > 10) skillScore += 2;
    else if (level > 5) skillScore += 1;

    // Update skill level
    const previousSkill = this.playerState.skillLevel;

    if (skillScore >= 6) this.playerState.skillLevel = 'advanced';
    else if (skillScore >= 3) this.playerState.skillLevel = 'intermediate';
    else this.playerState.skillLevel = 'beginner';

    // Provide encouragement if skill improved
    if (
      previousSkill !== this.playerState.skillLevel &&
      this.getSkillRank(this.playerState.skillLevel) > this.getSkillRank(previousSkill)
    ) {
      setTimeout(() => {
        this.provideEncouragement('skill_improvement', {
          from: previousSkill,
          to: this.playerState.skillLevel,
        });
      }, 1000);
    }

    // Adjust audio complexity based on skill level
    this.adjustAudioComplexity();
  }

  /**
   * Get numeric rank for skill level
   */
  getSkillRank(skillLevel) {
    const ranks = { beginner: 1, intermediate: 2, advanced: 3 };
    return ranks[skillLevel] || 1;
  }

  /**
   * Adjust audio complexity based on player skill
   */
  adjustAudioComplexity() {
    if (!this.whimsySettings.adaptiveComplexity) return;

    const complexity = {
      beginner: {
        maxSimultaneousSounds: 2,
        harmonicComplexity: 0.5,
        effectIntensity: 0.7,
      },
      intermediate: {
        maxSimultaneousSounds: 3,
        harmonicComplexity: 0.8,
        effectIntensity: 1.0,
      },
      advanced: {
        maxSimultaneousSounds: 4,
        harmonicComplexity: 1.2,
        effectIntensity: 1.3,
      },
    };

    this.adaptiveAudio.complexityLevel = complexity[this.playerState.skillLevel];
  }

  /**
   * Calculate appropriate intensity for player
   */
  calculateIntensityForPlayer() {
    const base = this.adaptiveAudio.complexityLevel?.effectIntensity || 1.0;
    const themeMultiplier = this.themeCharacteristics?.sparkle || 1.0;
    return Math.min(2.0, base * themeMultiplier);
  }

  /**
   * Create gentle audio transitions between game states
   */
  createStateTransition(fromState, toState, transitionData = {}) {
    if (!this.whimsySettings.gentleTransitions) return;

    const transitions = {
      'menu->playing': () => this.createStartGameTransition(),
      'playing->paused': () => this.createPauseTransition(),
      'paused->playing': () => this.createResumeTransition(),
      'playing->gameOver': () => this.createGameOverTransition(),
      'gameOver->menu': () => this.createReturnToMenuTransition(),
    };

    const transitionKey = `${fromState}->${toState}`;
    const transitionFunc = transitions[transitionKey];

    if (transitionFunc) {
      transitionFunc(transitionData);
    }
  }

  /**
   * Create start game transition
   */
  createStartGameTransition() {
    // Gentle rising tone to indicate game start
    const notes = [440, 523, 659];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.audioManager.playGeneratedSound({
          frequency: freq,
          duration: 0.3,
          volume: 0.25,
          waveform: 'triangle',
          envelope: 'gentle',
        });
      }, index * 200);
    });
  }

  /**
   * Create pause transition
   */
  createPauseTransition() {
    // Gentle descending tone
    this.audioManager.playGeneratedSound({
      frequency: 523,
      duration: 0.4,
      volume: 0.2,
      waveform: 'sine',
      envelope: 'gentle',
    });
  }

  /**
   * Create resume transition
   */
  createResumeTransition() {
    // Gentle ascending tone
    this.audioManager.playGeneratedSound({
      frequency: 659,
      duration: 0.4,
      volume: 0.25,
      waveform: 'sine',
      envelope: 'gentle',
    });
  }

  /**
   * Monitor for achievement opportunities
   */
  trackAchievement(achievementType, data = {}) {
    const achievementSounds = {
      firstTetris: () => {
        this.playWhimsicalSound('confetti_burst');
        this.provideEncouragement('first_tetris');
      },

      tenLinesCleared: () => {
        this.achievements.tenLinesCleared = true;
        this.playWhimsicalSound('rainbow_slide');
        this.provideEncouragement('milestone');
      },

      speedDemon: () => {
        this.achievements.speedDemon = true;
        this.playWhimsicalSound('intermediate_success');
        this.triggerSurpriseMoment({ achievement: 'speed' });
      },

      persistence: () => {
        this.achievements.persistence = true;
        this.provideEncouragement('persistence');
      },
    };

    if (achievementSounds[achievementType] && !this.achievements[achievementType]) {
      achievementSounds[achievementType]();
    }
  }

  /**
   * Start analyzing player behavior for adaptive responses
   */
  startPlayerAnalysis() {
    // Monitor play session for encouragement opportunities
    this.analysisTimer = setInterval(() => {
      this.analyzePlayerBehavior();
    }, 15000); // Check every 15 seconds
  }

  /**
   * Analyze current player behavior
   */
  analyzePlayerBehavior() {
    const sessionTime = Date.now() - this.playerState.playSession.startTime;

    // Check for encouragement needs
    if (this.playerState.recentMistakes > 3 && this.playerState.consecutiveSuccesses < 2) {
      this.playerState.encouragementNeeded = true;

      setTimeout(
        () => {
          this.provideEncouragement('struggling');
        },
        Math.random() * 10000 + 5000,
      ); // 5-15 second delay
    }

    // Check for persistence achievement (playing > 10 minutes)
    if (sessionTime > 600000 && !this.achievements.persistence) {
      this.trackAchievement('persistence');
    }

    // Reset counters periodically
    if (this.playerState.recentMistakes > 0) {
      this.playerState.recentMistakes = Math.max(0, this.playerState.recentMistakes - 1);
    }
  }

  /**
   * Update player state based on game events
   */
  updatePlayerState(eventType, eventData = {}) {
    switch (eventType) {
      case 'move':
        this.playerState.playSession.totalMoves++;
        break;
      case 'lineClear':
        this.playerState.playSession.linesCleared += eventData.linesCleared || 1;
        this.playerState.consecutiveSuccesses++;
        this.playerState.recentMistakes = Math.max(0, this.playerState.recentMistakes - 1);
        break;
      case 'tetris':
        if (!this.achievements.firstTetris) {
          this.trackAchievement('firstTetris');
        }
        break;
      case 'gameOver':
        this.playerState.recentMistakes++;
        this.playerState.consecutiveSuccesses = 0;
        break;
    }

    // Check for ten lines achievement
    if (this.playerState.playSession.linesCleared >= 10 && !this.achievements.tenLinesCleared) {
      this.trackAchievement('tenLinesCleared');
    }
  }

  /**
   * Initialize adaptive audio system
   */
  initializeAdaptiveAudio() {
    // Set initial complexity based on detected skill level
    this.adjustAudioComplexity();

    // Monitor audio context for adaptive adjustments
    if (this.audioManager.audioContext) {
      this.setupAudioAnalytics();
    }
  }

  /**
   * Setup basic audio analytics
   */
  setupAudioAnalytics() {
    // Track how often certain sounds are played
    this.audioAnalytics = {
      soundFrequency: new Map(),
      playerPreferences: new Map(),
    };
  }

  /**
   * Add themed celebration based on current theme
   */
  addThemedCelebration() {
    const themedSounds = {
      winter: 'wind_chime',
      spring: 'bird_chirp',
      summer: 'ocean_waves',
      autumn: 'wind_chime',
      space: 'fairy_bells',
      underwater: 'ocean_waves',
      birthday: 'confetti_burst',
    };

    const themedSound = themedSounds[this.currentTheme];
    if (themedSound) {
      setTimeout(() => {
        this.playWhimsicalSound(themedSound, { volume: 0.2 });
      }, 800);
    }
  }

  /**
   * Generic whimsical sound player
   */
  playGenericWhimsicalSound(options) {
    const { frequency = 659, duration = 0.3, volume = 0.3 } = options;

    this.audioManager.playGeneratedSound({
      frequency,
      duration,
      volume,
      waveform: 'triangle',
      envelope: 'gentle',
    });
  }

  /**
   * Play sparkle burst effect
   */
  playSparkleburst(options) {
    const { baseFreq, sparkles, duration, volume } = options;
    const sparkleDelay = duration / sparkles;

    for (let i = 0; i < sparkles; i++) {
      setTimeout(
        () => {
          const frequency = baseFreq + (Math.random() * 200 - 100);
          this.audioManager.playGeneratedSound({
            frequency,
            duration: sparkleDelay * 0.8,
            volume: volume * (1 - i * 0.05),
            waveform: 'sine',
            envelope: 'sparkle',
          });
        },
        i * ((sparkleDelay * 1000) / 2),
      );
    }
  }

  /**
   * Play chromatic slide effect
   */
  playChromaticSlide(options) {
    const { startFreq, endFreq, steps, stepDuration, volume } = options;
    const freqStep = (endFreq - startFreq) / steps;

    for (let i = 0; i < steps; i++) {
      setTimeout(
        () => {
          const frequency = startFreq + freqStep * i;
          this.audioManager.playGeneratedSound({
            frequency,
            duration: stepDuration,
            volume: volume * (1 - i * 0.02),
            waveform: 'triangle',
            envelope: 'gentle',
          });
        },
        i * (stepDuration * 1000 * 0.8),
      );
    }
  }

  /**
   * Play bell sequence
   */
  playBellSequence(options) {
    const { frequencies, timings, duration, volume } = options;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.audioManager.playGeneratedSound({
          frequency: freq,
          duration: duration / frequencies.length,
          volume: volume,
          waveform: 'sine',
          envelope: 'chime',
        });
      }, timings[index] * 1000);
    });
  }

  /**
   * Play chime cascade
   */
  playChimeCascade(options) {
    const { baseFreq, chimes, randomness, duration, volume } = options;

    for (let i = 0; i < chimes; i++) {
      setTimeout(
        () => {
          const frequency = baseFreq * 1.2 ** i + (Math.random() * randomness * 100 - 50);
          this.audioManager.playGeneratedSound({
            frequency,
            duration: (duration / chimes) * 1.5,
            volume: volume * (1 - i * 0.15),
            waveform: 'sine',
            envelope: 'chime',
          });
        },
        i * ((duration / chimes) * 1000 * 0.4),
      );
    }
  }

  /**
   * Get current whimsy status
   */
  getWhimsyStatus() {
    return {
      isInitialized: this.isInitialized,
      currentTheme: this.currentTheme,
      playerState: { ...this.playerState },
      achievements: { ...this.achievements },
      whimsySettings: { ...this.whimsySettings },
    };
  }

  /**
   * Update whimsy settings
   */
  updateSettings(newSettings) {
    this.whimsySettings = { ...this.whimsySettings, ...newSettings };
    console.log('🎭 Whimsy settings updated:', newSettings);
  }

  /**
   * Event system
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
          console.error(`Error in whimsy event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the whimsy injector
   */
  destroy() {
    console.log('🧹 Destroying WhimsyInjector...');

    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    if (this.encouragementTimer) {
      clearTimeout(this.encouragementTimer);
    }

    this.eventListeners.clear();
    this.isInitialized = false;
  }
}
