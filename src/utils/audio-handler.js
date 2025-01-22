import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import { combineAudioChunks } from '../../relay-server/lib/audioUtils.js';

const app = express();
app.use(express.json());

app.post('/save-audio', async (req, res) => {
    const { itemId, audioData } = req.body;
    const int16Array = new Int16Array(audioData);

    // Save the audio file
    const filename = `response_${itemId}_final.wav`;
    await saveAudioFile(int16Array, filename);

    res.status(200).send({ message: 'Audio saved successfully' });
});

export class AudioHandler {
  constructor(outputDir = 'audio-outputs') {
    this.outputDir = outputDir;
  }

  async saveAudioFile(int16Array, filename) {
    if (!int16Array || int16Array.length === 0) {
      console.error('No audio data to save');
      return;
    }

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Create WAV file
    const wavData = this.createWavData(int16Array, 24000, 1, 16);

    // Write the file
    const filePath = path.join(this.outputDir, filename);
    await fs.writeFile(filePath, Buffer.from(wavData));
    console.log(`Audio file saved at ${filePath}`);
  }

  createWavData(samples, sampleRate, numChannels, bitsPerSample) {
    const header = this.createWavHeader(samples.length * 2, sampleRate, numChannels, bitsPerSample);
    const wavBuffer = new Uint8Array(header.byteLength + samples.length * 2);

    wavBuffer.set(new Uint8Array(header), 0);
    wavBuffer.set(new Uint8Array(samples.buffer), header.byteLength);

    return wavBuffer;
  }

  createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // RIFF identifier 'RIFF'
    this.writeString(view, 0, 'RIFF');
    // File length minus first 8 bytes (4 bytes for 'RIFF' and 4 for file length)
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type 'WAVE'
    this.writeString(view, 8, 'WAVE');
    // Format chunk identifier 'fmt '
    this.writeString(view, 12, 'fmt ');
    // Format chunk length 16 bytes
    view.setUint32(16, 16, true);
    // Sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // Number of channels
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    // Block align (channels * bits/sample / 8)
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    // Bits per sample
    view.setUint16(34, bitsPerSample, true);
    // Data chunk identifier 'data'
    this.writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, dataLength, true);

    return buffer;
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// Store audio chunks for each item
const audioChunks = {};

// Function to handle incoming audio data
function handleIncomingAudio(itemId, audioData) {
    if (!audioChunks[itemId]) {
        audioChunks[itemId] = [];
    }
    audioChunks[itemId].push(audioData);
}

// Function to combine and save audio data
async function saveCombinedAudio(itemId, filename) {
    const chunks = audioChunks[itemId];
    if (!chunks || chunks.length === 0) {
        console.error('No audio chunks to combine');
        return;
    }

    // Calculate total length
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedBuffer = new Int16Array(totalLength);

    // Combine chunks
    let offset = 0;
    chunks.forEach((chunk) => {
        combinedBuffer.set(chunk, offset);
        offset += chunk.length;
    });

    // Save the combined audio
    await saveAudioFile(combinedBuffer, filename);

    // Clean up
    delete audioChunks[itemId];
}

// Example usage
async function processAudio(itemId, audioData, filename) {
    handleIncomingAudio(itemId, audioData);
    // Call saveCombinedAudio when ready to save
    await saveCombinedAudio(itemId, filename);
}