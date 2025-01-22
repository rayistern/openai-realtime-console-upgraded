import { AudioHandler } from './audio-handler.js';

export class AudioInterceptor {
  constructor(outputDir = 'audio-outputs') {
    this.audioHandler = new AudioHandler(outputDir);
    this.audioChunks = {};
    this.currentItemId = null;
    console.log('[AudioInterceptor] Initialized with output dir:', outputDir);
  }

  async handleEvent(event) {
    console.log('\n[AudioInterceptor] Event received:', {
      type: event.type,
      itemId: event.item_id,
      currentItemId: this.currentItemId,
      activeChunks: Object.keys(this.audioChunks),
    });

    if (event.type === 'response.audio.delta') {
      const itemId = event.item_id;

      // Debug the incoming audio data type
      console.log('[AudioInterceptor] Audio delta details:', {
        itemId,
        deltaType: typeof event.delta,
        isInt16Array: event.delta instanceof Int16Array,
        dataLength: event.delta?.length,
      });

      if (itemId && event.delta) {
        // Decode base64 string if necessary
        let audioData;
        if (typeof event.delta === 'string') {
          const decodedData = Buffer.from(event.delta, 'base64');
          audioData = new Int16Array(decodedData.buffer);
        } else if (event.delta instanceof Int16Array) {
          audioData = event.delta;
        } else {
          console.error('Unsupported audio data type:', typeof event.delta);
          return;
        }

        // Store the audio data
        if (!this.audioChunks[itemId]) {
          this.audioChunks[itemId] = [];
        }
        this.audioChunks[itemId].push(audioData);
        console.log(`[AudioInterceptor] Added chunk:`, {
          itemId,
          chunkLength: audioData.length,
          totalChunks: this.audioChunks[itemId].length,
        });
      }
    } else if (event.type === 'response.audio.done') {
      const itemId = event.item_id;
      console.log('[AudioInterceptor] Processing done:', {
        itemId,
        hasChunks: !!this.audioChunks[itemId],
        numChunks: this.audioChunks[itemId]?.length,
      });

      if (itemId && this.audioChunks[itemId]) {
        try {
          const chunks = this.audioChunks[itemId];
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          console.log('[AudioInterceptor] Combining chunks:', {
            totalChunks: chunks.length,
            totalLength,
          });

          const combinedBuffer = new Int16Array(totalLength);
          let offset = 0;

          chunks.forEach((chunk, index) => {
            console.log(`Setting chunk ${index}:`, {
              chunkLength: chunk.length,
              offset,
              isInt16Array: chunk instanceof Int16Array,
            });
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
          });

          const filename = `response_${itemId}_final.wav`;
          await this.audioHandler.saveAudioFile(combinedBuffer, filename);
          console.log(`[AudioInterceptor] Saved file:`, {
            filename,
            finalLength: combinedBuffer.length,
          });

          delete this.audioChunks[itemId];
        } catch (error) {
          console.error(`[AudioInterceptor] Error saving audio:`, error);
        }
      }
    }
    return event;
  }

  async addChunk(itemId, data) {
    if (!this.audioChunks[itemId]) {
      this.audioChunks[itemId] = [];
    }
    this.audioChunks[itemId].push(data);
  }

  combineChunks(itemId) {
    const chunks = this.audioChunks[itemId];
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Int16Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined;
  }
} 