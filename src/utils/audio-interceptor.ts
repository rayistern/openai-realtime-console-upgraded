import { handleConversationAudioUpdate } from '../pages/ConsolePage';
import { handleAudioProcessing } from './audioHandler';
import { WavStreamPlayer } from '../lib/wavtools/index.js';

interface AudioInterceptorOptions {
    sampleRate?: number;
    channels?: number;
}

export class AudioInterceptor {
    private chunks: Int16Array[] = [];
    private sampleRate: number;
    private channels: number;
    private isRecording: boolean = false;
    private wavStreamPlayer: WavStreamPlayer;
    private audioChunks: Record<string, Int16Array[]> = {};

    constructor(options: AudioInterceptorOptions = {}) {
        this.sampleRate = options.sampleRate || 24000;
        this.channels = options.channels || 1;
        this.wavStreamPlayer = new WavStreamPlayer({ sampleRate: this.sampleRate });
    }

    public async handleAudioEvent(item: any, delta: any) {
        await handleConversationAudioUpdate(
            item,
            delta,
            this.wavStreamPlayer,
            this.audioChunks,
            { current: this }
        );
    }

    public start(): void {
        this.isRecording = true;
        this.chunks = [];
    }

    public stop(): void {
        this.isRecording = false;
    }

    public async addChunk(chunk: Int16Array): Promise<void> {
        if (!this.isRecording) return;
        this.chunks.push(chunk);
    }

    public async processAudio(): Promise<Int16Array | undefined> {
        if (this.chunks.length === 0) return;

        try {
            const itemId = Date.now().toString(); // Simple unique ID generation
            const result = await handleAudioProcessing(itemId, this.chunks);
            this.chunks = []; // Clear chunks after processing
            return result;
        } catch (error) {
            console.error('Error processing audio:', error);
            throw error;
        }
    }

    public isActive(): boolean {
        return this.isRecording;
    }

    public getChunks(): Int16Array[] {
        return this.chunks;
    }

    public clear(): void {
        this.chunks = [];
    }

    public getSampleRate(): number {
        return this.sampleRate;
    }

    public getChannels(): number {
        return this.channels;
    }
}

// Create and export a default instance
export const defaultInterceptor = new AudioInterceptor();

// Export the class for custom instances
export default AudioInterceptor; 