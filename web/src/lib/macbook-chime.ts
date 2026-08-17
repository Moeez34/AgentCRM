/**
 * Synthesizes the iconic classic Macintosh / MacBook startup chord chime
 * using the Web Audio API (F-sharp major chord F#3, C#4, F#4, A#4, C#5, F#5)
 */
export function playMacbookChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Iconic F-sharp Major Chord Frequencies
    const frequencies = [185.0, 277.18, 369.99, 466.16, 554.37, 739.99];

    frequencies.forEach((freq, idx) => {
      // Create dual oscillators per harmonic for rich resonance
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      // Slight detune for warm chorus effect
      osc2.frequency.setValueAtTime(freq * 1.002, ctx.currentTime);

      const baseVol = 0.15 / (idx * 0.4 + 1);

      // Volume envelope: fast attack, warm sustain, exponential decay
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(baseVol, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);

      osc1.stop(ctx.currentTime + 3.0);
      osc2.stop(ctx.currentTime + 3.0);
    });
  } catch (err) {
    console.warn("AudioContext initialization prevented or unsupported:", err);
  }
}
