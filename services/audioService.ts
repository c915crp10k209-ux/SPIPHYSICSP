
/**
 * Procedural Audio Synthesis Service for SPIPHYSIC.COM
 * Generates medical-tech sounds without external assets.
 * Refined for subtleness and clinical aesthetic.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private ambientSource: OscillatorNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute && this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
    }
  }

  // Tactical Tick - for slider movement and granular feedback
  playTick() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx!.currentTime + 0.01);

    gain.gain.setValueAtTime(0.02, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.01);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.01);
  }

  // Subtle UI Click - Short high-freq transient
  playClick() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx!.currentTime + 0.03);

    gain.gain.setValueAtTime(0.08, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.03);
  }

  // System Alert - Urgent medical-style beeps for limit warnings
  playSystemAlert() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx!.currentTime;
    const notes = [440, 440, 440]; // A4
    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.03, now + i * 0.12 + 0.01);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.1);
    });
  }

  // Logic Success - Harmonic 'Aha!' moment sound when discovering concepts
  playLogicSuccess() {
      if (this.isMuted) return;
      this.init();
      const now = this.ctx!.currentTime;
      const notes = [659.25, 783.99, 1046.50, 1318.51]; // E5, G5, C6, E6
      notes.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.04);
          gain.gain.setValueAtTime(0, now + i * 0.04);
          gain.gain.linearRampToValueAtTime(0.04, now + i * 0.04 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.3);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.4);
      });
  }

  // Correct Answer - Bright Harmonic Chime
  playCorrect() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx!.currentTime;
    
    [880, 1318.51].forEach((freq, i) => { // A5, E6 (Perfect 5th)
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  // Incorrect Answer - Damped Thud
  playIncorrect() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(now + 0.2);
  }

  // Success Sound - Shimmering Arpeggio
  playSuccess() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.5);
    });
  }

  // Error Sound - Flat Diagnostic Alert
  playError() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx!.currentTime);
    
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    gain.gain.setValueAtTime(0.05, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.2);
  }

  // Harvey Sync - Sonar sweep
  playHarveySync() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const filter = this.ctx!.createBiquadFilter();
    const gain = this.ctx!.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx!.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx!.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, this.ctx!.currentTime + 0.4);
    filter.Q.setValueAtTime(15, this.ctx!.currentTime);

    gain.gain.setValueAtTime(0, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx!.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.6);
  }

  // Level Up - Major flourish
  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    this.playSuccess();
    setTimeout(() => this.playHarveySync(), 150);
  }

  // Ambience Toggling
  toggleFocusAmbience(type: string) {
    if (this.isMuted) return;
    this.init();
    if (this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
      return;
    }
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, this.ctx!.currentTime); // 40Hz hum for focus
    gain.gain.setValueAtTime(0.02, this.ctx!.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    this.ambientSource = osc;
  }
}

export const audioService = new AudioService();
