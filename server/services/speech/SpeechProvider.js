export class SpeechProvider {
    constructor() {
        this.onTranscript = null;
    }

    startStream(onTranscriptCallback) {
        this.onTranscript = onTranscriptCallback;
    }

    writeAudio(chunk) {
        throw new Error("Method 'writeAudio' must be implemented.");
    }

    stopStream() {
        this.onTranscript = null;
    }
}
