/**
 * Shadow Dojo Web Audio Synthesizer (Zero External Audio Files)
 * Synthesizes authentic katana blade unsheathe, dojo wooden gong,
 * and Japanese Hirajoshi pentatonic ambient koto chimes.
 */

class DojoSfxController {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private ambientTimer: number | null = null;
  private listeners = new Set<(enabled: boolean) => void>();

  // Hirajoshi Pentatonic Scale frequencies (Hz)
  private readonly kotoScale = [293.66, 311.13, 392.0, 440.0, 523.25, 587.33];

  public isEnabled(): boolean {
    return this.enabled;
  }

  public subscribe(fn: (enabled: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private getAudioCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playSlash();
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
    this.listeners.forEach((cb) => cb(this.enabled));
    return this.enabled;
  }

  private startAmbient() {
    if (this.ambientTimer || !this.enabled) return;
    const tick = () => {
      if (!this.enabled) return;
      const ctx = this.getAudioCtx();
      if (ctx) {
        const freq = this.kotoScale[Math.floor(Math.random() * this.kotoScale.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.028, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.5);
      }
      this.ambientTimer = window.setTimeout(tick, 2400 + Math.random() * 2800);
    };
    this.ambientTimer = window.setTimeout(tick, 700);
  }

  private stopAmbient() {
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  /** Crisp katana blade swipe for buttons & interactive tabs */
  public playSlash() {
    if (!this.enabled) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.14);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  /** Deep temple gong chime for escrow creation / victory release */
  public playGong(victory = false) {
    if (!this.enabled) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const notes = victory ? [392, 587.33, 783.99] : [196, 293.66];
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = victory ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (victory ? 1.4 : 0.9));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.5);
    });
  }
}

export const dojoSfx = new DojoSfxController();
