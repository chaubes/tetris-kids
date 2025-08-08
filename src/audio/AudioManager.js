/**
 * AudioManager - Comprehensive Web Audio API management system
 * Handles audio context, volume controls, and audio loading/caching for kid-friendly Tetris
 */

import { AUDIO_CONFIG } from '../core/Constants.js';

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Audio state
    this.isInitialized = false;
    this.isMuted = false;
    this.isUserInteractionReceived = false;

    // Volume settings (0.0 to 1.0)
    this.volumes = {
      master: AUDIO_CONFIG.MASTER_VOLUME || 0.7,
      music: AUDIO_CONFIG.MUSIC_VOLUME || 0.5,
      sfx: AUDIO_CONFIG.SFX_VOLUME || 0.8,
    };

    // Audio caching system
    this.audioCache = new Map();
    this.loadingPromises = new Map();

    // Event system
    this.eventListeners = new Map();

    // Kid-friendly audio settings
    this.kidMode = {
      enabled: true,
      maxVolume: 0.8,
      gentleFadeTime: 0.3,
      softAttack: 0.05,
      warmDecay: 0.2,
    };

    // Auto-play restrictions handling
    this.setupUserInteractionDetection();
  }

  /**
   * Initialize the audio system
   * Must be called after user interaction due to browser autoplay policies
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('🔊 AudioManager already initialized');
      return;
    }

    try {
      console.log('🎵 Initializing AudioManager...');

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context if suspended (Safari/iOS requirement)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create master gain nodes
      this.createGainNodes();

      // Apply kid-friendly audio processing
      this.setupKidFriendlyProcessing();

      this.isInitialized = true;
      console.log('✅ AudioManager initialized successfully');

      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AudioManager:', error);
      throw error;
    }
  }

  /**
   * Create the gain node hierarchy for volume control
   */
  createGainNodes() {
    if (!this.audioContext) return;

    // Master gain (controls overall volume)
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.setValueAtTime(
      this.volumes.master * (this.kidMode.enabled ? this.kidMode.maxVolume : 1.0),
      this.audioContext.currentTime,
    );
    this.masterGain.connect(this.audioContext.destination);

    // Music gain (for background music)
    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.setValueAtTime(this.volumes.music, this.audioContext.currentTime);
    this.musicGain.connect(this.masterGain);

    // SFX gain (for sound effects)
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.audioContext.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  /**
   * Setup kid-friendly audio processing
   */
  setupKidFriendlyProcessing() {
    if (!this.audioContext) return;

    // Create a gentle compressor to prevent harsh sounds
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(3, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    // Insert compressor before master gain
    this.masterGain.disconnect();
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.audioContext.destination);

    // Create a gentle low-pass filter for warmth
    this.warmthFilter = this.audioContext.createBiquadFilter();
    this.warmthFilter.type = 'lowpass';
    this.warmthFilter.frequency.setValueAtTime(8000, this.audioContext.currentTime);
    this.warmthFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

    // Insert filter in the chain
    this.compressor.disconnect();
    this.compressor.connect(this.warmthFilter);
    this.warmthFilter.connect(this.audioContext.destination);
  }

  /**
   * Setup user interaction detection for audio context activation
   */
  setupUserInteractionDetection() {
    const handleFirstInteraction = () => {
      this.isUserInteractionReceived = true;

      if (!this.isInitialized) {
        this.initialize().catch(console.error);
      } else if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
  }

  /**
   * Get appropriate gain node for audio type
   */
  getGainNode(type = 'sfx') {
    if (!this.isInitialized) return null;

    switch (type) {
      case 'music':
        return this.musicGain;
      case 'sfx':
      default:
        return this.sfxGain;
    }
  }

  /**
   * Create an audio source with kid-friendly envelope
   */
  createKidFriendlySource(gainNode) {
    if (!this.audioContext || !gainNode) return null;

    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.connect(gainNode);

    return {
      envelope,
      fadeIn: (duration = this.kidMode.gentleFadeTime) => {
        const now = this.audioContext.currentTime;
        envelope.gain.cancelScheduledValues(now);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1, now + duration);
      },
      fadeOut: (duration = this.kidMode.gentleFadeTime) => {
        const now = this.audioContext.currentTime;
        envelope.gain.cancelScheduledValues(now);
        envelope.gain.setValueAtTime(envelope.gain.value, now);
        envelope.gain.linearRampToValueAtTime(0, now + duration);
      },
    };
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    volume = Math.max(0, Math.min(1, volume)); // Clamp to 0-1
    this.volumes.master = volume;

    if (this.masterGain && this.audioContext) {
      const adjustedVolume = volume * (this.kidMode.enabled ? this.kidMode.maxVolume : 1.0);
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, adjustedVolume), // Avoid 0 for exponential ramp
        this.audioContext.currentTime + 0.1,
      );
    }

    this.emit('volumeChanged', { type: 'master', volume });
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume) {
    volume = Math.max(0, Math.min(1, volume));
    this.volumes.music = volume;

    if (this.musicGain && this.audioContext) {
      this.musicGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, volume),
        this.audioContext.currentTime + 0.1,
      );
    }

    this.emit('volumeChanged', { type: 'music', volume });
  }

  /**
   * Set sound effects volume
   */
  setSfxVolume(volume) {
    volume = Math.max(0, Math.min(1, volume));
    this.volumes.sfx = volume;

    if (this.sfxGain && this.audioContext) {
      this.sfxGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, volume),
        this.audioContext.currentTime + 0.1,
      );
    }

    this.emit('volumeChanged', { type: 'sfx', volume });
  }

  /**
   * Get current volumes
   */
  getVolumes() {
    return { ...this.volumes };
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.setMuted(!this.isMuted);
  }

  /**
   * Set mute state
   */
  setMuted(muted) {
    this.isMuted = muted;

    if (this.masterGain && this.audioContext) {
      const targetVolume = muted
        ? 0.001
        : this.volumes.master * (this.kidMode.enabled ? this.kidMode.maxVolume : 1.0);
      this.masterGain.gain.exponentialRampToValueAtTime(
        targetVolume,
        this.audioContext.currentTime + 0.1,
      );
    }

    this.emit('muteChanged', this.isMuted);
  }

  /**
   * Check if audio system is muted
   */
  isMuted() {
    return this.isMuted;
  }

  /**
   * Enable/disable kid mode
   */
  setKidMode(enabled) {
    this.kidMode.enabled = enabled;

    // Reapply volume settings
    this.setMasterVolume(this.volumes.master);

    this.emit('kidModeChanged', enabled);
  }

  /**
   * Create oscillator with kid-friendly settings
   */
  createOscillator(frequency = 440, type = 'sine') {
    if (!this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Kid-friendly waveforms (softer sounds)
    switch (type) {
      case 'warm-sine':
        oscillator.type = 'sine';
        break;
      case 'soft-square':
        oscillator.type = 'square';
        // Add slight detuning for warmth
        oscillator.detune.setValueAtTime(2, this.audioContext.currentTime);
        break;
      case 'gentle-sawtooth':
        oscillator.type = 'sawtooth';
        // Lower the intensity
        oscillator.detune.setValueAtTime(-5, this.audioContext.currentTime);
        break;
      case 'triangle':
      default:
        oscillator.type = 'triangle'; // Softest waveform
        break;
    }

    return oscillator;
  }

  /**
   * Create noise generator for percussion-like sounds
   */
  createNoise(type = 'white', duration = 0.1) {
    if (!this.audioContext) return null;

    const bufferSize = this.audioContext.sampleRate * duration;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Generate different types of noise
    for (let i = 0; i < bufferSize; i++) {
      switch (type) {
        case 'pink':
          // Simplified pink noise approximation
          data[i] = (Math.random() * 2 - 1) * (1 / Math.sqrt(i + 1));
          break;
        case 'brown':
          // Simplified brown noise
          data[i] = (Math.random() * 2 - 1) * (1 / (i + 1));
          break;
        case 'white':
        default:
          data[i] = Math.random() * 2 - 1;
          break;
      }
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    return noiseSource;
  }

  /**
   * Play a generated sound with specified parameters
   */
  playGeneratedSound(soundConfig) {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('AudioManager not initialized, cannot play sound');
      return null;
    }

    try {
      const {
        type = 'sfx',
        frequency = 440,
        waveform = 'triangle',
        duration = 0.2,
        volume = 1.0,
        envelope = 'gentle',
        effects = [],
      } = soundConfig;

      const gainNode = this.getGainNode(type);
      if (!gainNode) return null;

      // Create the sound source
      const oscillator = this.createOscillator(frequency, waveform);
      const { envelope: envGain, fadeIn, fadeOut } = this.createKidFriendlySource(gainNode);

      // Apply volume
      envGain.gain.setValueAtTime(volume, this.audioContext.currentTime);

      // Connect oscillator to envelope
      oscillator.connect(envGain);

      // Apply effects
      let currentNode = oscillator;
      effects.forEach(effect => {
        const effectNode = this.createEffect(effect);
        if (effectNode) {
          currentNode.disconnect();
          currentNode.connect(effectNode);
          effectNode.connect(envGain);
          currentNode = effectNode;
        }
      });

      // Apply envelope
      switch (envelope) {
        case 'gentle':
          fadeIn(this.kidMode.softAttack);
          setTimeout(
            () => fadeOut(this.kidMode.warmDecay),
            duration * 1000 - this.kidMode.warmDecay * 1000,
          );
          break;
        case 'sharp':
          // Quick attack, linear decay
          envGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
          envGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
          break;
        case 'pluck':
          // Instant attack, exponential decay
          envGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
          envGain.gain.exponentialRampToValueAtTime(
            0.001,
            this.audioContext.currentTime + duration,
          );
          break;
      }

      // Start and schedule stop
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      return { oscillator, envelope: envGain };
    } catch (error) {
      console.error('Error playing generated sound:', error);
      return null;
    }
  }

  /**
   * Create audio effect nodes
   */
  createEffect(effectConfig) {
    if (!this.audioContext) return null;

    const { type, ...params } = effectConfig;

    switch (type) {
      case 'reverb':
        return this.createReverb(params.roomSize || 0.3, params.decay || 2);
      case 'delay':
        return this.createDelay(params.time || 0.3, params.feedback || 0.3);
      case 'filter':
        return this.createFilter(params.frequency || 1000, params.type || 'lowpass', params.Q || 1);
      default:
        return null;
    }
  }

  /**
   * Create reverb effect
   */
  createReverb(roomSize = 0.3, decayTime = 2) {
    if (!this.audioContext) return null;

    const convolver = this.audioContext.createConvolver();

    // Create impulse response for room simulation
    const length = this.audioContext.sampleRate * decayTime;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        data[i] = (Math.random() * 2 - 1) * decay * roomSize;
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Create delay effect
   */
  createDelay(delayTime = 0.3, feedback = 0.3) {
    if (!this.audioContext) return null;

    const delay = this.audioContext.createDelay(1.0);
    delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);

    const feedbackGain = this.audioContext.createGain();
    feedbackGain.gain.setValueAtTime(feedback, this.audioContext.currentTime);

    const wetGain = this.audioContext.createGain();
    wetGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);

    // Create delay feedback loop
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(wetGain);

    return wetGain;
  }

  /**
   * Create filter effect
   */
  createFilter(frequency = 1000, type = 'lowpass', Q = 1) {
    if (!this.audioContext) return null;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    filter.Q.setValueAtTime(Q, this.audioContext.currentTime);

    return filter;
  }

  /**
   * Get audio context current time
   */
  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  /**
   * Check if audio is supported
   */
  isSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Get system info for debugging
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isUserInteractionReceived: this.isUserInteractionReceived,
      audioContextState: this.audioContext ? this.audioContext.state : 'none',
      sampleRate: this.audioContext ? this.audioContext.sampleRate : 0,
      volumes: this.volumes,
      isMuted: this.isMuted,
      kidMode: this.kidMode,
      cacheSize: this.audioCache.size,
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
          console.error(`Error in audio event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and destroy the audio manager
   */
  destroy() {
    console.log('🧹 Destroying AudioManager...');

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.audioCache.clear();
    this.loadingPromises.clear();
    this.eventListeners.clear();

    this.isInitialized = false;
  }
}
