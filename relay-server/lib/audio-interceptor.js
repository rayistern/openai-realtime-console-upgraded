import { AudioHandler } from '../../src/utils/audio-handler.js';

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
      activeChunks: Object.keys(this.audioChunks)
    });

    if (event.type === 'response.audio.delta') {
      const itemId = event.item_id;
      
      // Debug the incoming audio data type
      console.log('[AudioInterceptor] Audio delta details:', {
        itemId,
        deltaType: event.delta?.constructor?.name,
        isInt16Array: event.delta instanceof Int16Array,
        dataLength: event.delta?.length
      });

      if (itemId && event.delta) {
        // Store the raw delta without conversion
        if (!this.audioChunks[itemId]) {
          this.audioChunks[itemId] = [];
        }
        this.audioChunks[itemId].push(event.delta);
        console.log(`[AudioInterceptor] Added raw chunk:`, {
          itemId,
          chunkLength: event.delta.length,
          totalChunks: this.audioChunks[itemId].length
        });
      }
    }
    else if (event.type === 'response.audio.done') {
      const itemId = event.item_id;
      console.log('[AudioInterceptor] Processing done:', {
        itemId,
        hasChunks: !!this.audioChunks[itemId],
        numChunks: this.audioChunks[itemId]?.length
      });

      if (itemId && this.audioChunks[itemId]) {
        try {
          const chunks = this.audioChunks[itemId];
          
          // Convert chunks to Int16Array if they aren't already
          const convertedChunks = chunks.map(chunk => {
            if (chunk instanceof Int16Array) {
              return chunk;
            }
            console.log('Converting chunk:', {
              originalType: chunk.constructor.name,
              length: chunk.length
            });
            return new Int16Array(chunk);
          });

          const totalLength = convertedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
          console.log('[AudioInterceptor] Combining chunks:', {
            totalChunks: convertedChunks.length,
            totalLength
          });
          
          const combinedBuffer = new Int16Array(totalLength);
          let offset = 0;
          
          convertedChunks.forEach((chunk, index) => {
            console.log(`Setting chunk ${index}:`, {
              chunkLength: chunk.length,
              offset,
              isInt16Array: chunk instanceof Int16Array
            });
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
          });

          const filename = `response_${itemId}_final.wav`;
          await this.audioHandler.saveAudioFile(combinedBuffer, filename);
          console.log(`[AudioInterceptor] Saved file:`, {
            filename,
            finalLength: combinedBuffer.length
          });
          
          delete this.audioChunks[itemId];
        } catch (error) {
          console.error(`[AudioInterceptor] Error saving audio:`, error);
        }
      }
    }
    return event;
  }
} 