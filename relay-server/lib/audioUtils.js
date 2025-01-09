/**
 * Combines an array of Int16Array audio chunks into a single Int16Array.
 * @param {Int16Array[]} chunks - An array of Int16Array audio chunks.
 * @returns {Int16Array} - A single Int16Array containing all the combined audio data.
 */
export function combineAudioChunks(chunks) {
    // Calculate the total length of the combined buffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedBuffer = new Int16Array(totalLength);

    // Combine all chunks into the combined buffer
    let offset = 0;
    chunks.forEach((chunk) => {
        combinedBuffer.set(chunk, offset);
        offset += chunk.length;
    });

    return combinedBuffer;
} 