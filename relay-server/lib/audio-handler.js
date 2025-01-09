import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(express.json());

app.post('/save-audio', async (req, res) => {
    try {
        if (!req.files || !req.files.audio) {
            return res.status(400).send('No audio file uploaded');
        }

        const audioFile = req.files.audio;
        const uploadPath = path.join(__dirname, '../audio-outputs', audioFile.name);
        
        await audioFile.mv(uploadPath);
        console.log(`Audio file saved at ${uploadPath}`);
        res.status(200).send({ message: 'Audio saved successfully' });
    } catch (error) {
        console.error('Error saving audio file:', error);
        res.status(500).send({ error: 'Failed to save audio' });
    }
});

// Function to create a WAV file header
function createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (raw)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, byteRate, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // Bits per sample
    view.setUint16(34, bitsPerSample, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, dataLength, true);

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

app.listen(8081, () => {
    console.log('Server is running on port 8081');
}); 