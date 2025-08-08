/**
 * SoundEffects - Programmatic sound effect generation for kid-friendly Tetris
 * Creates pleasant sound effects using Web Audio API without external files
 */

export class SoundEffects {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.isInitialized = false;

    // Sound effect definitions
    this.soundLibrary = this.createSoundLibrary();
    this.eventListeners = new Map();

    // Kid-friendly sound settings
    this.soundSettings = {
      maxVolume: 0.6,
      defaultVolume: 0.4,
      fadeTime: 0.1,
      reverbAmount: 0.2,
      warmth: 0.8,
      gentleness: 0.9,
    };

    // Spatial audio settings
    this.spatialSettings = {
      enabled: true,
      maxPan: 0.3, // Limited panning for kid-friendly experience
      boardWidth: 10, // Tetris board width for spatial calculations
    };

    // Recently played sounds (to prevent overwhelming audio)
    this.recentSounds = new Map();
    this.soundCooldowns = {
      move: 50, // 50ms between move sounds
      rotate: 100, // 100ms between rotate sounds
      drop: 200, // 200ms between drop sounds
      lineClear: 500, // 500ms between line clear sounds
    };
  }

  /**
   * Initialize the sound effects system
   */
  initialize() {
    if (this.isInitialized) return;

    if (!this.audioManager || !this.audioManager.isInitialized) {
      console.warn('AudioManager not initialized, cannot start sound effects');
      return;
    }

    console.log('🔊 Initializing SoundEffects...');
    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Create library of sound effect definitions
   */
  createSoundLibrary() {
    return {
      // Piece movement sounds
      move: {
        type: 'synthesized',
        frequencies: [800, 600],
        duration: 0.08,
        envelope: 'pluck',
        waveform: 'triangle',
        volume: 0.3,
        description: 'Gentle whoosh for piece movement',
      },

      rotate: {
        type: 'chord',
        frequencies: [440, 554, 659], // A major triad
        duration: 0.12,
        envelope: 'gentle',
        waveform: 'triangle',
        volume: 0.35,
        description: 'Pleasant chord for piece rotation',
      },

      softDrop: {
        type: 'slide',
        startFreq: 600,
        endFreq: 400,
        duration: 0.15,
        envelope: 'slide',
        waveform: 'triangle',
        volume: 0.25,
        description: 'Gentle slide down for soft drop',
      },

      hardDrop: {
        type: 'impact',
        frequencies: [200, 300, 400],
        duration: 0.2,
        envelope: 'impact',
        waveform: 'triangle',
        volume: 0.45,
        noiseAmount: 0.1,
        description: 'Soft thud for hard drop',
      },

      // Line clearing sounds
      lineClear: {
        type: 'sparkle',
        baseFreq: 800,
        harmonics: [1, 1.25, 1.5, 2],
        duration: 0.8,
        envelope: 'sparkle',
        waveform: 'sine',
        volume: 0.4,
        description: 'Magical sparkle for line clear',
      },

      tetris: {
        type: 'celebration',
        sequence: [
          { freq: 523, time: 0, duration: 0.3 }, // C5
          { freq: 659, time: 0.15, duration: 0.3 }, // E5
          { freq: 784, time: 0.3, duration: 0.3 }, // G5
          { freq: 1047, time: 0.45, duration: 0.6 }, // C6
        ],
        volume: 0.5,
        description: 'Triumphant fanfare for tetris',
      },

      // Level progression sounds
      levelUp: {
        type: 'ascension',
        baseFreq: 440,
        steps: [1, 1.125, 1.25, 1.5, 2], // Musical intervals
        stepDuration: 0.15,
        envelope: 'gentle',
        waveform: 'triangle',
        volume: 0.45,
        description: 'Uplifting scale for level up',
      },

      // UI interaction sounds
      buttonPress: {
        type: 'click',
        frequencies: [800, 1000],
        duration: 0.06,
        envelope: 'click',
        waveform: 'triangle',
        volume: 0.3,
        description: 'Gentle click for button press',
      },

      menuSelect: {
        type: 'chime',
        frequencies: [659, 831, 988], // E major triad, high
        duration: 0.4,
        envelope: 'chime',
        waveform: 'sine',
        volume: 0.35,
        description: 'Pleasant chime for menu selection',
      },

      menuBack: {
        type: 'chord',
        frequencies: [440, 523, 659], // A minor triad
        duration: 0.3,
        envelope: 'gentle',
        waveform: 'triangle',
        volume: 0.3,
        description: 'Soft chord for going back',
      },

      // Achievement sounds
      achievement: {
        type: 'fanfare',
        sequence: [
          { freq: 523, time: 0, duration: 0.2 },
          { freq: 659, time: 0.1, duration: 0.2 },
          { freq: 784, time: 0.2, duration: 0.2 },
          { freq: 1047, time: 0.3, duration: 0.4 },
          { freq: 784, time: 0.5, duration: 0.2 },
          { freq: 1047, time: 0.6, duration: 0.6 },
        ],
        volume: 0.4,
        description: 'Joyful fanfare for achievements',
      },

      // Game state sounds
      pause: {
        type: 'tone',
        frequency: 440,
        duration: 0.2,
        envelope: 'gentle',
        waveform: 'sine',
        volume: 0.3,
        description: 'Calm tone for pause',
      },

      unpause: {
        type: 'tone',
        frequency: 659,
        duration: 0.2,
        envelope: 'gentle',
        waveform: 'sine',
        volume: 0.3,
        description: 'Bright tone for unpause',
      },

      gameOver: {
        type: 'goodbye',
        sequence: [
          { freq: 440, time: 0, duration: 0.5 },
          { freq: 392, time: 0.3, duration: 0.5 },
          { freq: 349, time: 0.6, duration: 0.8 },
        ],
        volume: 0.35,
        envelope: 'gentle',
        description: 'Gentle descending phrase for game over',
      },

      // Special effects
      combo: {
        type: 'cascade',
        baseFreq: 659,
        steps: [1, 1.25, 1.5, 1.875], // Major scale steps
        stepDelay: 0.08,
        stepDuration: 0.15,
        volume: 0.4,
        description: 'Cascading notes for combo',
      },

      perfect: {
        type: 'shimmer',
        baseFreq: 1047,
        harmonics: [1, 1.5, 2, 2.5],
        duration: 1.2,
        envelope: 'shimmer',
        waveform: 'sine',
        volume: 0.35,
        description: 'Shimmering effect for perfect clear',
      },
    };
  }

  /**
   * Play a sound effect by name
   */
  playSound(soundName, options = {}) {
    if (!this.isInitialized || !this.audioManager.isInitialized) {
      console.warn('Sound system not ready');
      return;
    }

    const sound = this.soundLibrary[soundName];
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }

    // Check cooldown to prevent audio spam
    if (this.isOnCooldown(soundName)) {
      return;
    }

    // Apply spatial audio if position is provided
    const spatialOptions = this.calculateSpatialOptions(options.position);

    // Merge options with sound definition
    const playOptions = {
      ...sound,
      ...options,
      ...spatialOptions,
    };

    // Play the sound based on its type
    switch (sound.type) {
      case 'synthesized':
        this.playSynthesizedSound(playOptions);
        break;
      case 'chord':
        this.playChordSound(playOptions);
        break;
      case 'slide':
        this.playSlideSound(playOptions);
        break;
      case 'impact':
        this.playImpactSound(playOptions);
        break;
      case 'sparkle':
        this.playSparkleSound(playOptions);
        break;
      case 'celebration':
      case 'fanfare':
      case 'goodbye':
        this.playSequenceSound(playOptions);
        break;
      case 'ascension':
        this.playAscensionSound(playOptions);
        break;
      case 'click':
        this.playClickSound(playOptions);
        break;
      case 'chime':
        this.playChimeSound(playOptions);
        break;
      case 'cascade':
        this.playCascadeSound(playOptions);
        break;
      case 'shimmer':
        this.playShimmerSound(playOptions);
        break;
      case 'tone':
      default:
        this.playToneSound(playOptions);
        break;
    }

    // Set cooldown
    this.setCooldown(soundName);

    this.emit('soundPlayed', soundName, options);
  }

  /**
   * Calculate spatial audio options based on position
   */
  calculateSpatialOptions(position) {
    if (!this.spatialSettings.enabled || !position) {
      return {};
    }

    // Calculate pan based on horizontal position on the Tetris board
    const { x = 5 } = position; // Default to center if no position
    const normalizedX = (x / (this.spatialSettings.boardWidth - 1)) * 2 - 1; // -1 to 1
    const pan = normalizedX * this.spatialSettings.maxPan;

    return { pan: Math.max(-1, Math.min(1, pan)) };
  }

  /**
   * Play a simple synthesized sound
   */
  playSynthesizedSound(options) {
    const { frequencies, duration, volume, waveform, envelope, pan } = options;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.createAndPlayOscillator({
          frequency: freq,
          duration: duration / frequencies.length,
          volume: volume * (1 - index * 0.1), // Slightly decrease volume for each frequency
          waveform,
          envelope,
          pan,
        });
      }, index * 20); // Slight delay between frequencies
    });
  }

  /**
   * Play a chord (multiple frequencies simultaneously)
   */
  playChordSound(options) {
    const { frequencies, duration, volume, waveform, envelope, pan } = options;

    frequencies.forEach((freq, index) => {
      this.createAndPlayOscillator({
        frequency: freq,
        duration,
        volume: (volume / frequencies.length) * (1.2 - index * 0.1), // Balance chord volumes
        waveform,
        envelope,
        pan,
      });
    });
  }

  /**
   * Play a sliding frequency sound
   */
  playSlideSound(options) {
    const { startFreq, endFreq, duration, volume, waveform, pan } = options;

    if (!this.audioManager.audioContext) return;

    const oscillator = this.audioManager.createOscillator(startFreq, waveform);
    const gainNode = this.createGainNode(volume, pan);

    oscillator.connect(gainNode);

    // Slide frequency
    oscillator.frequency.setValueAtTime(startFreq, this.audioManager.getCurrentTime());
    oscillator.frequency.exponentialRampToValueAtTime(
      endFreq,
      this.audioManager.getCurrentTime() + duration,
    );

    // Apply envelope
    this.applyEnvelope(gainNode, duration, 'slide');

    // Play
    oscillator.start();
    oscillator.stop(this.audioManager.getCurrentTime() + duration);
  }

  /**
   * Play an impact sound with a noise component
   */
  playImpactSound(options) {
    const { frequencies, duration, volume, noiseAmount = 0.1, pan } = options;

    // Play tone component
    frequencies.forEach((freq, index) => {
      this.createAndPlayOscillator({
        frequency: freq,
        duration,
        volume: (volume * 0.8) / frequencies.length,
        waveform: 'triangle',
        envelope: 'impact',
        pan,
      });
    });

    // Add noise component for texture
    if (noiseAmount > 0) {
      this.playNoiseSound({
        type: 'brown',
        duration: duration * 0.3,
        volume: volume * noiseAmount,
        envelope: 'sharp',
        pan,
      });
    }
  }

  /**
   * Play a sparkling sound effect
   */
  playSparkleSound(options) {
    const { baseFreq, harmonics, duration, volume, waveform, pan } = options;

    harmonics.forEach((harmonic, index) => {
      const delay = index * (duration / harmonics.length / 2);
      setTimeout(() => {
        this.createAndPlayOscillator({
          frequency: baseFreq * harmonic,
          duration: duration / 2,
          volume: (volume / harmonics.length) * (1.1 - index * 0.1),
          waveform,
          envelope: 'sparkle',
          pan,
        });
      }, delay * 1000);
    });
  }

  /**
   * Play a sequence of notes
   */
  playSequenceSound(options) {
    const { sequence, volume, envelope = 'gentle', pan } = options;

    sequence.forEach(note => {
      setTimeout(() => {
        this.createAndPlayOscillator({
          frequency: note.freq,
          duration: note.duration,
          volume: volume,
          waveform: 'triangle',
          envelope,
          pan,
        });
      }, note.time * 1000);
    });
  }

  /**
   * Play an ascending scale sound
   */
  playAscensionSound(options) {
    const { baseFreq, steps, stepDuration, volume, waveform, envelope, pan } = options;

    steps.forEach((step, index) => {
      setTimeout(
        () => {
          this.createAndPlayOscillator({
            frequency: baseFreq * step,
            duration: stepDuration,
            volume: volume,
            waveform,
            envelope,
            pan,
          });
        },
        index * stepDuration * 1000 * 0.7,
      ); // Overlap slightly
    });
  }

  /**
   * Play a click sound
   */
  playClickSound(options) {
    const { frequencies, duration, volume, pan } = options;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.createAndPlayOscillator({
          frequency: freq,
          duration: duration,
          volume: volume,
          waveform: 'triangle',
          envelope: 'click',
          pan,
        });
      }, index * 20);
    });
  }

  /**
   * Play a chime sound with reverb
   */
  playChimeSound(options) {
    const { frequencies, duration, volume, waveform, pan } = options;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.createAndPlayOscillator({
          frequency: freq,
          duration,
          volume: volume / frequencies.length,
          waveform,
          envelope: 'chime',
          pan,
          reverb: true,
        });
      }, index * 50);
    });
  }

  /**
   * Play a cascading sound
   */
  playCascadeSound(options) {
    const { baseFreq, steps, stepDelay, stepDuration, volume, pan } = options;

    steps.forEach((step, index) => {
      setTimeout(
        () => {
          this.createAndPlayOscillator({
            frequency: baseFreq * step,
            duration: stepDuration,
            volume: volume * (1 - index * 0.1),
            waveform: 'triangle',
            envelope: 'gentle',
            pan,
          });
        },
        index * stepDelay * 1000,
      );
    });
  }

  /**
   * Play a shimmering sound
   */
  playShimmerSound(options) {
    const { baseFreq, harmonics, duration, volume, waveform, pan } = options;

    // Create shimmering effect with slightly detuned oscillators
    harmonics.forEach((harmonic, index) => {
      // Start times are staggered
      const startDelay = ((index * duration) / harmonics.length / 3) * 1000;

      setTimeout(() => {
        this.createAndPlayOscillator({
          frequency: baseFreq * harmonic,
          duration: duration * 0.8,
          volume: (volume / harmonics.length) * (1 - index * 0.15),
          waveform,
          envelope: 'shimmer',
          pan,
          detune: (Math.random() - 0.5) * 10, // Slight random detuning
        });
      }, startDelay);
    });
  }

  /**
   * Play a simple tone
   */
  playToneSound(options) {
    const { frequency, duration, volume, waveform, envelope, pan } = options;

    this.createAndPlayOscillator({
      frequency,
      duration,
      volume,
      waveform,
      envelope,
      pan,
    });
  }

  /**
   * Play noise sound
   */
  playNoiseSound(options) {
    const { type, duration, volume, envelope, pan } = options;

    if (!this.audioManager.audioContext) return;

    const noise = this.audioManager.createNoise(type, duration);
    const gainNode = this.createGainNode(volume, pan);

    noise.connect(gainNode);

    this.applyEnvelope(gainNode, duration, envelope);

    noise.start();
  }

  /**
   * Create and play an oscillator with all options
   */
  createAndPlayOscillator(options) {
    if (!this.audioManager.audioContext) return;

    const {
      frequency,
      duration,
      volume,
      waveform = 'triangle',
      envelope = 'gentle',
      pan = 0,
      reverb = false,
      detune = 0,
    } = options;

    const oscillator = this.audioManager.createOscillator(frequency, waveform);
    const gainNode = this.createGainNode(volume, pan);

    // Apply detuning if specified
    if (detune !== 0) {
      oscillator.detune.setValueAtTime(detune, this.audioManager.getCurrentTime());
    }

    // Connect audio graph
    oscillator.connect(gainNode);

    // Add reverb if requested
    if (reverb) {
      const reverbNode = this.audioManager.createEffect({
        type: 'reverb',
        roomSize: this.soundSettings.reverbAmount,
        decay: 1.5,
      });
      if (reverbNode) {
        const dryGain = this.audioManager.audioContext.createGain();
        const wetGain = this.audioManager.audioContext.createGain();

        dryGain.gain.setValueAtTime(0.7, this.audioManager.getCurrentTime());
        wetGain.gain.setValueAtTime(0.3, this.audioManager.getCurrentTime());

        gainNode.disconnect();
        gainNode.connect(dryGain);
        gainNode.connect(reverbNode);
        reverbNode.connect(wetGain);

        dryGain.connect(this.audioManager.sfxGain);
        wetGain.connect(this.audioManager.sfxGain);
      }
    }

    // Apply envelope
    this.applyEnvelope(gainNode, duration, envelope);

    // Start and stop
    const startTime = this.audioManager.getCurrentTime();
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Create gain node with panning
   */
  createGainNode(volume, pan = 0) {
    if (!this.audioManager.audioContext) return null;

    const gainNode = this.audioManager.audioContext.createGain();
    gainNode.gain.setValueAtTime(
      volume * this.soundSettings.defaultVolume,
      this.audioManager.getCurrentTime(),
    );

    // Add panning if specified
    if (pan !== 0 && this.audioManager.audioContext.createStereoPanner) {
      const panNode = this.audioManager.audioContext.createStereoPanner();
      panNode.pan.setValueAtTime(pan, this.audioManager.getCurrentTime());

      gainNode.connect(panNode);
      panNode.connect(this.audioManager.sfxGain);
    } else {
      gainNode.connect(this.audioManager.sfxGain);
    }

    return gainNode;
  }

  /**
   * Apply envelope to gain node
   */
  applyEnvelope(gainNode, duration, envelopeType) {
    const gain = gainNode.gain;
    const currentTime = this.audioManager.getCurrentTime();

    switch (envelopeType) {
      case 'gentle':
        gain.setValueAtTime(0, currentTime);
        gain.linearRampToValueAtTime(gain.value, currentTime + 0.05);
        gain.linearRampToValueAtTime(gain.value * 0.7, currentTime + duration - 0.1);
        gain.linearRampToValueAtTime(0, currentTime + duration);
        break;

      case 'pluck':
        gain.setValueAtTime(gain.value, currentTime);
        gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
        break;

      case 'impact':
        gain.setValueAtTime(gain.value, currentTime);
        gain.linearRampToValueAtTime(gain.value * 0.3, currentTime + 0.02);
        gain.linearRampToValueAtTime(0, currentTime + duration);
        break;

      case 'sparkle':
        gain.setValueAtTime(0, currentTime);
        gain.linearRampToValueAtTime(gain.value, currentTime + 0.03);
        gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
        break;

      case 'click':
        gain.setValueAtTime(gain.value, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
        break;

      case 'chime':
        gain.setValueAtTime(0, currentTime);
        gain.linearRampToValueAtTime(gain.value, currentTime + 0.02);
        gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
        break;

      case 'shimmer':
        // Tremolo effect
        gain.setValueAtTime(0, currentTime);
        gain.linearRampToValueAtTime(gain.value, currentTime + 0.1);

        // Add tremolo
        for (let i = 0.1; i < duration - 0.1; i += 0.1) {
          const tremoloValue = gain.value * (0.8 + 0.2 * Math.sin(i * 20));
          gain.linearRampToValueAtTime(tremoloValue, currentTime + i);
        }

        gain.linearRampToValueAtTime(0, currentTime + duration);
        break;

      case 'slide':
        gain.setValueAtTime(gain.value, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
        break;

      case 'sharp':
        gain.setValueAtTime(gain.value, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
        break;

      default:
        gain.setValueAtTime(gain.value, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
    }
  }

  /**
   * Check if sound is on cooldown
   */
  isOnCooldown(soundName) {
    const now = Date.now();
    const lastPlayed = this.recentSounds.get(soundName);
    const cooldown = this.soundCooldowns[soundName] || 100;

    return lastPlayed && now - lastPlayed < cooldown;
  }

  /**
   * Set cooldown for sound
   */
  setCooldown(soundName) {
    this.recentSounds.set(soundName, Date.now());
  }

  /**
   * Play sound with spatial positioning based on piece position
   */
  playSpatialSound(soundName, position, options = {}) {
    this.playSound(soundName, {
      ...options,
      position,
    });
  }

  /**
   * Play a combo sound sequence
   */
  playComboSequence(comboLevel) {
    const baseDelay = 100;

    for (let i = 0; i < comboLevel && i < 4; i++) {
      setTimeout(() => {
        this.playSound('combo', {
          volume: 0.3 + i * 0.1,
          baseFreq: 659 + i * 100,
        });
      }, i * baseDelay);
    }
  }

  /**
   * Set global sound effects volume
   */
  setVolume(volume) {
    this.soundSettings.defaultVolume = Math.max(0, Math.min(1, volume));
    if (this.audioManager) {
      this.audioManager.setSfxVolume(volume);
    }
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.soundSettings.defaultVolume;
  }

  /**
   * Enable or disable spatial audio
   */
  setSpatialAudio(enabled) {
    this.spatialSettings.enabled = enabled;
  }

  /**
   * Get available sound names
   */
  getAvailableSounds() {
    return Object.keys(this.soundLibrary);
  }

  /**
   * Get sound information
   */
  getSoundInfo(soundName) {
    const sound = this.soundLibrary[soundName];
    return sound
      ? {
          name: soundName,
          type: sound.type,
          description: sound.description,
          duration:
            sound.duration ||
            (sound.sequence ? Math.max(...sound.sequence.map(n => n.time + n.duration)) : 0),
        }
      : null;
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      soundSettings: this.soundSettings,
      spatialSettings: this.spatialSettings,
      availableSounds: this.getAvailableSounds(),
      recentSounds: Array.from(this.recentSounds.entries()),
    };
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
          console.error(`Error in sound effect event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the sound effects system
   */
  destroy() {
    console.log('🧹 Destroying SoundEffects...');

    this.recentSounds.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}
