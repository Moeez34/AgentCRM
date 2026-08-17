/**
 * Synthesizes the iconic Windows Vista / 7 / 8 / 10 startup sound
 * using the Web Audio API.
 *
 * The Windows startup sound (composed by Robert Fripp for Vista) is a
 * 4-second ascending melodic phrase with warm pad timbre and soft reverb.
 *
 * Notes (approximate): C5 → E5 → G5 → C6 with smooth overlap and reverb tail.
 */
export function playWindowsStartup(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create a convolver-style reverb using a generated impulse response
    const convolver = ctx.createConvolver();
    const reverbLength = ctx.sampleRate * 2.5;
    const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = reverbBuffer.getChannelData(channel);
      for (let i = 0; i < reverbLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.5);
      }
    }
    convolver.buffer = reverbBuffer;

    // Wet/dry mix for reverb
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.35, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0, now);
    masterGain.gain.linearRampToValueAtTime(0.85, now + 0.05);
    masterGain.gain.setValueAtTime(0.85, now + 3.6);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    /**
     * Windows startup chord progression:
     * Each note is a soft-attack pad with 2 oscillators (sine + triangle).
     * Times are staggered to create the flowing, ascending phrase.
     *
     * Reference notes:
     *   Note 1: C5  (523.25 Hz) — 0.00s, soft onset
     *   Note 2: E5  (659.26 Hz) — 0.55s, overlapping with note 1
     *   Note 3: G5  (784.00 Hz) — 1.10s, mid phrase
     *   Note 4: C6  (1046.50 Hz) — 1.70s, peak
     *   Chord fill: E5 + G5 sustained from 1.70s for warmth
     */
    const notes: Array<{ freq: number; start: number; duration: number; vol: number }> = [
      { freq: 523.25,  start: 0.00, duration: 2.8, vol: 0.22 }, // C5
      { freq: 659.26,  start: 0.55, duration: 2.5, vol: 0.20 }, // E5
      { freq: 784.00,  start: 1.10, duration: 2.2, vol: 0.18 }, // G5
      { freq: 1046.50, start: 1.70, duration: 2.0, vol: 0.22 }, // C6  (peak)
      { freq: 659.26,  start: 1.70, duration: 2.2, vol: 0.12 }, // E5 (chord fill)
      { freq: 784.00,  start: 1.70, duration: 2.2, vol: 0.10 }, // G5 (chord fill)
    ];

    notes.forEach(({ freq, start, duration, vol }) => {
      const noteStart = now + start;
      const noteEnd = noteStart + duration;

      // Primary oscillator (sine wave — warm, clear tone)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, noteStart);

      // Harmonic oscillator (triangle — soft overtone for richness)
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2.0, noteStart); // octave harmonic
      
      // Very slight frequency drift for organic warmth
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 1.0015, noteStart); // tiny detune chorus

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.linearRampToValueAtTime(vol, noteStart + 0.12);     // soft attack
      gainNode.gain.setValueAtTime(vol * 0.85, noteStart + 0.4);        // slight dip
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);       // smooth decay

      // Sub-harmonic oscillator for gentle bass warmth
      const oscSub = ctx.createOscillator();
      oscSub.type = "sine";
      oscSub.frequency.setValueAtTime(freq * 0.5, noteStart);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.0001, noteStart);
      subGain.gain.linearRampToValueAtTime(vol * 0.08, noteStart + 0.15);
      subGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      // Secondary harmonic at 1/4 volume for richness
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(vol * 0.15, noteStart);

      osc1.connect(gainNode);
      osc3.connect(gainNode);
      gainNode.connect(masterGain);
      gainNode.connect(convolver);

      osc2.connect(harmGain);
      harmGain.connect(masterGain);
      harmGain.connect(convolver);

      oscSub.connect(subGain);
      subGain.connect(masterGain);

      osc1.start(noteStart); osc1.stop(noteEnd + 0.1);
      osc2.start(noteStart); osc2.stop(noteEnd + 0.1);
      osc3.start(noteStart); osc3.stop(noteEnd + 0.1);
      oscSub.start(noteStart); oscSub.stop(noteEnd + 0.1);
    });

  } catch (err) {
    console.warn("Windows startup sound: AudioContext unavailable:", err);
  }
}
