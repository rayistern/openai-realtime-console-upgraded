const saveAudioToFile = (audioData: Int16Array, filename: string) => {
    const createWavHeader = (length: number) => {
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);
        
        view.setUint32(0, 0x52494646, false);
        view.setUint32(4, 36 + length, true);
        view.setUint32(8, 0x57415645, false);
        view.setUint32(12, 0x666D7420, false);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 24000, true);
        view.setUint32(28, 48000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        view.setUint32(36, 0x64617461, false);
        view.setUint32(40, length, true);
        
        return buffer;
    };

    const header = createWavHeader(audioData.length * 2);
    const blob = new Blob([header, audioData.buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'audio.wav';
    link.click();
    URL.revokeObjectURL(url);
};

export { saveAudioToFile };