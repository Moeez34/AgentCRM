const fs = require("fs");
const path = require("path");

function createMacbookChimeWav() {
  const sampleRate = 44100;
  const duration = 3.0; // 3 seconds
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit PCM

  const buffer = Buffer.alloc(44 + numSamples * numChannels * bytesPerSample);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * numChannels * bytesPerSample, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * numChannels * bytesPerSample, 40);

  // Frequencies for the classic Apple F-sharp Major Chord
  const freqs = [185.00, 277.18, 369.99, 466.16, 554.37, 739.99];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Envelope: 0.05s attack, then long exponential decay
    let env = 0;
    if (t < 0.05) {
      env = t / 0.05;
    } else {
      env = Math.exp(-(t - 0.05) * 1.2);
    }

    let sampleVal = 0;
    freqs.forEach((freq, idx) => {
      // Sine + Triangle harmonic blend for acoustic bell chime
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
      const weight = 1 / (idx * 0.5 + 1);
      sampleVal += tone * weight;
    });

    sampleVal = sampleVal * env * 0.35; // Normalize scale

    // Clamp to 16-bit PCM integer bounds
    const pcmSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));

    // Stereo L and R channels
    buffer.writeInt16LE(pcmSample, offset);
    buffer.writeInt16LE(pcmSample, offset + 2);
    offset += 4;
  }

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const filePath = path.join(publicDir, "macbook-chime.wav");
  fs.writeFileSync(filePath, buffer);
  console.log("Successfully generated:", filePath);
}

createMacbookChimeWav();
