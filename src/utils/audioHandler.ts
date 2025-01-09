import { combineAudioChunks } from './audioUtils';

export async function handleAudioProcessing(itemId: string, audioChunks: Int16Array[]) {
    if (!audioChunks || audioChunks.length === 0) return;

    const combinedBuffer = combineAudioChunks(audioChunks);
    console.log(`Combined buffer for item ${itemId}:`, combinedBuffer);

    // Send combined buffer to server
    await fetch('/save-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            itemId: itemId,
            audioData: Array.from(combinedBuffer),
        }),
    });

    return combinedBuffer;
}