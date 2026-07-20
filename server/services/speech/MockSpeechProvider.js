import { SpeechProvider } from './SpeechProvider.js';

export class MockSpeechProvider extends SpeechProvider {
    constructor() {
        super();
        this.interval = null;
    }

    startStream(onTranscriptCallback) {
        super.startStream(onTranscriptCallback);
        console.log('[MockSpeechProvider] Started.');
    }

    writeAudio(chunk) {
        // Ignore incoming audio for mock provider
    }

    injectMockText(text) {
        if (!this.onTranscript) return;
        
        // Simulate partials
        const words = text.split(' ');
        let currentText = '';
        
        let i = 0;
        this.interval = setInterval(() => {
            if (i < words.length - 1) {
                currentText += (i === 0 ? '' : ' ') + words[i];
                this.onTranscript({ type: 'partial', text: currentText });
                i++;
            } else {
                currentText += ' ' + words[i];
                this.onTranscript({ type: 'final', text: currentText });
                clearInterval(this.interval);
            }
        }, 300);
    }

    stopStream() {
        if (this.interval) clearInterval(this.interval);
        super.stopStream();
        console.log('[MockSpeechProvider] Stopped.');
    }
}
