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
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async saveAudioFile(audioData, filename) {
    const filePath = path.join(this.outputDir, filename);
    
    // Convert audioData from String to Int16Array if necessary
    if (typeof audioData === 'string') {
        // Assuming audioData is a base64 encoded string
        const buffer = Buffer.from(audioData, 'base64');
        audioData = new Int16Array(buffer.buffer);
    }

    // Check if audioData is an Int16Array
    if (!(audioData instanceof Int16Array)) {
        console.error('Audio data is not an Int16Array');
        return;
    }
    
    // Create WAV header
    const header = this.createWavHeader(audioData.length * 2);
    
    // Combine header and audio data
    const fullBuffer = Buffer.concat([
        Buffer.from(header),
        Buffer.from(audioData.buffer)
    ]);
    
    try {
        await fs.writeFile(filePath, fullBuffer);
        console.log(`Audio file saved at ${filePath}`);
    } catch (error) {
        console.error('Error saving audio file:', error);
    }
    return filePath;
  }

  createWavHeader(length) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    // File length minus RIFF header
    view.setUint32(4, 36 + length, true);
    // WAVE identifier
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // Format chunk identifier
    view.setUint32(12, 0x666D7420, false); // "fmt "
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (raw)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, 1, true);
    // Sample rate
    view.setUint32(24, 24000, true);
    // Byte rate
    view.setUint32(28, 48000, true);
    // Block align
    view.setUint16(32, 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    view.setUint32(36, 0x64617461, false); // "data"
    // Data chunk length
    view.setUint32(40, length, true);
    
    return buffer;
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