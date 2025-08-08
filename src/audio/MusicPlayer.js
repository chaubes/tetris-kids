/**
 * MusicPlayer - Programmatic music generation for kid-friendly Tetris
 * Creates pleasant background music using Web Audio API with simple chord progressions
 */

export class MusicPlayer {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.isInitialized = false;

    // Music state
    this.isPlaying = false;
    this.currentTrack = null;
    this.currentLevel = 1;
    this.musicVolume = 0.5;

    // Scheduling and timing
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 25.0; // 25ms ahead
    this.noteLength = 0.5; // Length of each note in seconds
    this.tempo = 120; // BPM
    this.noteIndex = 0;
    this.schedulerTimer = null;

    // Musical elements
    this.activeOscillators = new Set();
    this.tracks = this.defineMusicTracks();
    this.eventListeners = new Map();

    // Kid-friendly music settings
    this.musicSettings = {
      baseVolume: 0.3,
      harmonyVolume: 0.15,
      bassVolume: 0.2,
      fadeTime: 2.0,
      maxSimultaneousNotes: 6,
      gentleAttack: 0.1,
      softRelease: 0.3,
    };
  }

  /**
   * Initialize the music player
   */
  initialize() {
    if (this.isInitialized) return;

    if (!this.audioManager || !this.audioManager.isInitialized) {
      console.warn('AudioManager not initialized, cannot start music player');
      return;
    }

    console.log('🎵 Initializing MusicPlayer...');
    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Define music tracks with kid-friendly chord progressions
   */
  defineMusicTracks() {
    return {
      menu: {
        name: 'Menu Music',
        tempo: 100,
        key: 'C',
        progression: [
          { chord: 'C', melody: [523, 659, 783], duration: 2 },
          { chord: 'Am', melody: [440, 523, 659], duration: 2 },
          { chord: 'F', melody: [349, 440, 523], duration: 2 },
          { chord: 'G', melody: [392, 494, 659], duration: 2 },
        ],
        bass: [262, 220, 175, 196],
        mood: 'happy',
        description: 'Cheerful and welcoming',
      },

      game_easy: {
        name: 'Easy Game Music',
        tempo: 110,
        key: 'G',
        progression: [
          { chord: 'G', melody: [392, 494, 588], duration: 1.5 },
          { chord: 'Em', melody: [330, 392, 494], duration: 1.5 },
          { chord: 'C', melody: [262, 330, 392], duration: 1.5 },
          { chord: 'D', melody: [294, 370, 440], duration: 1.5 },
        ],
        bass: [196, 165, 131, 147],
        mood: 'calm',
        description: 'Gentle and encouraging',
      },

      game_medium: {
        name: 'Medium Game Music',
        tempo: 120,
        key: 'D',
        progression: [
          { chord: 'D', melody: [294, 370, 440], duration: 1.25 },
          { chord: 'Bm', melody: [247, 294, 370], duration: 1.25 },
          { chord: 'G', melody: [196, 247, 294], duration: 1.25 },
          { chord: 'A', melody: [220, 277, 330], duration: 1.25 },
        ],
        bass: [147, 123, 98, 110],
        mood: 'focused',
        description: 'Steady and motivating',
      },

      game_fast: {
        name: 'Fast Game Music',
        tempo: 140,
        key: 'E',
        progression: [
          { chord: 'E', melody: [330, 415, 494], duration: 1 },
          { chord: 'C#m', melody: [277, 330, 415], duration: 1 },
          { chord: 'A', melody: [220, 277, 330], duration: 1 },
          { chord: 'B', melody: [247, 311, 370], duration: 1 },
        ],
        bass: [165, 139, 110, 123],
        mood: 'energetic',
        description: 'Exciting and driving',
      },

      celebration: {
        name: 'Celebration Music',
        tempo: 130,
        key: 'F',
        progression: [
          { chord: 'F', melody: [349, 440, 523], duration: 1 },
          { chord: 'C', melody: [262, 349, 440], duration: 1 },
          { chord: 'Dm', melody: [294, 370, 440], duration: 1 },
          { chord: 'Bb', melody: [233, 294, 370], duration: 1 },
          { chord: 'F', melody: [349, 440, 523], duration: 1 },
          { chord: 'G', melody: [392, 494, 588], duration: 1 },
          { chord: 'C', melody: [523, 659, 783], duration: 2 },
        ],
        bass: [175, 131, 147, 117, 175, 196, 262],
        mood: 'joyful',
        description: 'Triumphant and celebratory',
      },

      ambient: {
        name: 'Ambient Music',
        tempo: 80,
        key: 'Am',
        progression: [
          { chord: 'Am', melody: [220, 262, 330], duration: 3 },
          { chord: 'F', melody: [175, 220, 262], duration: 3 },
          { chord: 'C', melody: [131, 175, 220], duration: 3 },
          { chord: 'G', melody: [147, 196, 247], duration: 3 },
        ],
        bass: [110, 87, 65, 98],
        mood: 'peaceful',
        description: 'Calm and soothing',
      },
    };
  }

  /**
   * Start playing a specific track
   */
  async playTrack(trackName, options = {}) {
    if (!this.isInitialized || !this.audioManager.isInitialized) {
      console.warn('Music player not ready');
      return;
    }

    const track = this.tracks[trackName];
    if (!track) {
      console.warn(`Track '${trackName}' not found`);
      return;
    }

    // Stop current track if playing
    this.stopTrack();

    console.log(`🎵 Starting track: ${track.name}`);

    this.currentTrack = { ...track, name: trackName };
    this.tempo = track.tempo;
    this.noteIndex = 0;
    this.isPlaying = true;

    // Apply options
    if (options.fadeIn !== false) {
      this.fadeIn(options.fadeInDuration || this.musicSettings.fadeTime);
    }

    // Start the scheduler
    this.nextNoteTime = this.audioManager.getCurrentTime();
    this.scheduleNotes();

    this.emit('trackStarted', trackName);
  }

  /**
   * Stop the current track
   */
  stopTrack(options = {}) {
    if (!this.isPlaying) return;

    console.log('🎵 Stopping music track');

    if (options.fadeOut !== false) {
      this.fadeOut(options.fadeOutDuration || this.musicSettings.fadeTime);
      setTimeout(
        () => {
          this.cleanupTrack();
        },
        (options.fadeOutDuration || this.musicSettings.fadeTime) * 1000,
      );
    } else {
      this.cleanupTrack();
    }
  }

  /**
   * Cleanup track resources
   */
  cleanupTrack() {
    this.isPlaying = false;
    this.currentTrack = null;

    // Stop scheduler
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    // Stop all active oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();

    this.emit('trackStopped');
  }

  /**
   * Fade in the music
   */
  fadeIn(duration = 2.0) {
    if (!this.audioManager.musicGain) return;

    const now = this.audioManager.getCurrentTime();
    const musicGain = this.audioManager.musicGain;

    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(0.001, now);
    musicGain.gain.exponentialRampToValueAtTime(this.audioManager.volumes.music, now + duration);
  }

  /**
   * Fade out the music
   */
  fadeOut(duration = 2.0) {
    if (!this.audioManager.musicGain) return;

    const now = this.audioManager.getCurrentTime();
    const musicGain = this.audioManager.musicGain;

    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(musicGain.gain.value, now);
    musicGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  }

  /**
   * Schedule notes for playback
   */
  scheduleNotes() {
    if (!this.isPlaying || !this.currentTrack) return;

    const track = this.currentTrack;
    const progression = track.progression;

    while (this.nextNoteTime < this.audioManager.getCurrentTime() + this.scheduleAheadTime / 1000) {
      const chordIndex = this.noteIndex % progression.length;
      const chord = progression[chordIndex];

      // Schedule chord notes
      this.scheduleChord(chord, this.nextNoteTime);

      // Schedule bass note
      if (track.bass && track.bass[chordIndex]) {
        this.scheduleBass(track.bass[chordIndex], this.nextNoteTime, chord.duration);
      }

      // Move to next note
      const noteDuration = (60.0 / this.tempo) * chord.duration;
      this.nextNoteTime += noteDuration;
      this.noteIndex++;
    }

    // Schedule next batch
    this.schedulerTimer = setTimeout(() => {
      this.scheduleNotes();
    }, this.scheduleAheadTime);
  }

  /**
   * Schedule a chord to play
   */
  scheduleChord(chord, startTime) {
    if (!chord.melody || this.activeOscillators.size >= this.musicSettings.maxSimultaneousNotes) {
      return;
    }

    chord.melody.forEach((frequency, index) => {
      // Stagger chord notes slightly for a more natural sound
      const noteStartTime = startTime + index * 0.02;
      const noteDuration = (60.0 / this.tempo) * chord.duration;

      this.scheduleNote({
        frequency,
        startTime: noteStartTime,
        duration: noteDuration,
        volume: this.musicSettings.baseVolume * (1 - index * 0.1), // Lower notes quieter
        waveform: index === 0 ? 'triangle' : 'sine', // Root note with triangle
        envelope: 'gentle',
      });
    });
  }

  /**
   * Schedule a bass note to play
   */
  scheduleBass(frequency, startTime, duration) {
    if (this.activeOscillators.size >= this.musicSettings.maxSimultaneousNotes) {
      return;
    }

    const noteDuration = (60.0 / this.tempo) * duration;

    this.scheduleNote({
      frequency,
      startTime,
      duration: noteDuration,
      volume: this.musicSettings.bassVolume,
      waveform: 'triangle',
      envelope: 'bass',
    });
  }

  /**
   * Schedule a single note to play
   */
  scheduleNote(noteConfig) {
    if (!this.audioManager.audioContext || !this.audioManager.musicGain) return;

    const {
      frequency,
      startTime,
      duration,
      volume = 0.3,
      waveform = 'sine',
      envelope = 'gentle',
    } = noteConfig;

    try {
      // Create oscillator
      const oscillator = this.audioManager.createOscillator(frequency, waveform);
      const noteGain = this.audioManager.audioContext.createGain();

      // Connect audio graph
      oscillator.connect(noteGain);
      noteGain.connect(this.audioManager.musicGain);

      // Apply envelope
      this.applyEnvelope(noteGain, startTime, duration, volume, envelope);

      // Start and stop oscillator
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      // Track active oscillator
      this.activeOscillators.add(oscillator);

      // Remove from active set when finished
      oscillator.addEventListener('ended', () => {
        this.activeOscillators.delete(oscillator);
      });
    } catch (error) {
      console.error('Error scheduling note:', error);
    }
  }

  /**
   * Apply envelope to a note
   */
  applyEnvelope(gainNode, startTime, duration, volume, envelopeType) {
    const gain = gainNode.gain;

    switch (envelopeType) {
      case 'gentle':
        // Soft attack and release
        gain.setValueAtTime(0, startTime);
        gain.linearRampToValueAtTime(volume, startTime + this.musicSettings.gentleAttack);
        gain.linearRampToValueAtTime(
          volume * 0.7,
          startTime + duration - this.musicSettings.softRelease,
        );
        gain.linearRampToValueAtTime(0, startTime + duration);
        break;

      case 'bass':
        // Strong attack, sustained
        gain.setValueAtTime(0, startTime);
        gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.linearRampToValueAtTime(volume * 0.8, startTime + duration - 0.2);
        gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        break;

      case 'pluck':
        // Sharp attack, quick decay
        gain.setValueAtTime(volume, startTime);
        gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        break;

      default:
        gain.setValueAtTime(volume, startTime);
        gain.linearRampToValueAtTime(0, startTime + duration);
    }
  }

  /**
   * Adjust music based on game level
   */
  updateForLevel(level) {
    this.currentLevel = level;

    // Don't change track during gameplay, but adjust tempo slightly
    if (this.isPlaying && this.currentTrack) {
      // Gradually increase tempo with level (max 20% increase)
      const tempoMultiplier = 1 + Math.min((level - 1) * 0.02, 0.2);
      this.tempo = this.currentTrack.tempo * tempoMultiplier;

      console.log(`🎵 Adjusted tempo for level ${level}: ${this.tempo} BPM`);
    }
  }

  /**
   * Get appropriate track for game state
   */
  getTrackForGameState(gameState, level = 1) {
    switch (gameState) {
      case 'menu':
        return 'menu';
      case 'playing':
        if (level <= 3) return 'game_easy';
        if (level <= 7) return 'game_medium';
        return 'game_fast';
      case 'celebration':
      case 'levelUp':
        return 'celebration';
      case 'paused':
        return 'ambient';
      default:
        return 'menu';
    }
  }

  /**
   * Transition between tracks smoothly
   */
  async transitionToTrack(trackName, options = {}) {
    const duration = options.transitionDuration || 3.0;

    if (this.isPlaying) {
      // Fade out current track
      this.fadeOut(duration / 2);

      // Start new track after fade out
      setTimeout(
        () => {
          this.playTrack(trackName, {
            fadeIn: true,
            fadeInDuration: duration / 2,
          });
        },
        (duration / 2) * 1000,
      );
    } else {
      this.playTrack(trackName, options);
    }
  }

  /**
   * Play a short musical stinger (like for level up)
   */
  playStinger(stingerName, volume = 0.4) {
    if (!this.isInitialized) return;

    const stingers = {
      levelUp: {
        notes: [
          { freq: 523, time: 0, duration: 0.2 }, // C5
          { freq: 659, time: 0.1, duration: 0.2 }, // E5
          { freq: 784, time: 0.2, duration: 0.3 }, // G5
          { freq: 1047, time: 0.3, duration: 0.5 }, // C6
        ],
      },
      achievement: {
        notes: [
          { freq: 440, time: 0, duration: 0.15 }, // A4
          { freq: 554, time: 0.1, duration: 0.15 }, // C#5
          { freq: 659, time: 0.2, duration: 0.15 }, // E5
          { freq: 880, time: 0.3, duration: 0.4 }, // A5
        ],
      },
    };

    const stinger = stingers[stingerName];
    if (!stinger) return;

    const startTime = this.audioManager.getCurrentTime();

    stinger.notes.forEach(note => {
      this.scheduleNote({
        frequency: note.freq,
        startTime: startTime + note.time,
        duration: note.duration,
        volume,
        waveform: 'triangle',
        envelope: 'gentle',
      });
    });
  }

  /**
   * Set music volume
   */
  setVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.audioManager) {
      this.audioManager.setMusicVolume(this.musicVolume);
    }
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.musicVolume;
  }

  /**
   * Check if music is playing
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Get current track info
   */
  getCurrentTrack() {
    return this.currentTrack
      ? {
          name: this.currentTrack.name,
          tempo: this.tempo,
          mood: this.currentTrack.mood,
          description: this.currentTrack.description,
        }
      : null;
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack?.name || null,
      tempo: this.tempo,
      noteIndex: this.noteIndex,
      activeOscillators: this.activeOscillators.size,
      musicVolume: this.musicVolume,
      availableTracks: Object.keys(this.tracks),
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
          console.error(`Error in music event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the music player
   */
  destroy() {
    console.log('🧹 Destroying MusicPlayer...');

    this.stopTrack({ fadeOut: false });
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}
