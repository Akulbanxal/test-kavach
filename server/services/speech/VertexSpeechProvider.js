import speech from '@google-cloud/speech';
import { SpeechProvider } from './SpeechProvider.js';

export class VertexSpeechProvider extends SpeechProvider {
    constructor(config = {}) {
        super();
        this.client = new speech.SpeechClient();
        this.recognizeStream = null;
        this.config = config;
    }

    startStream(onTranscriptCallback) {
        super.startStream(onTranscriptCallback);

        const request = {
            config: {
                encoding: this.config.encoding || 'WEBM_OPUS',
                sampleRateHertz: this.config.sampleRate || 16000,
                languageCode: 'en-US',
            },
            interimResults: true, // required for partials
        };

        try {
            this.recognizeStream = this.client
                .streamingRecognize(request)
                .on('error', (err) => {
                    console.error('[VertexSpeechProvider] Stream error:', err);

                    if (this.recognizeStream) {
                        this.recognizeStream.removeAllListeners();
                        this.recognizeStream = null;
                    }

                    if (this.onTranscript) {
                        this.onTranscript({
                            type: 'error',
                            message: err.message
                        });
                    }
                })
                .on('close', () => {
                    console.log('[VertexSpeechProvider] Stream closed.');
                    this.recognizeStream = null;
                })
                .on('end', () => {
                    console.log('[VertexSpeechProvider] Stream ended.');
                    this.recognizeStream = null;
                })
                .on('data', data => {
                    const result = data.results[0];
                    if (result && result.alternatives[0]) {
                        const isFinal = result.isFinal;
                        const text = result.alternatives[0].transcript;
                        if (this.onTranscript) {
                            this.onTranscript({
                                type: isFinal ? 'final' : 'partial',
                                text: text.trim()
                            });
                        }
                    }
                });
            console.log('[VertexSpeechProvider] Started.');
        } catch (err) {
            console.error('[VertexSpeechProvider] Initialization error:', err);
            if (this.onTranscript) {
                this.onTranscript({ type: 'error', message: err.message });
            }
        }
    }

    writeAudio(chunk) {
        if (
            !this.recognizeStream ||
            this.recognizeStream.destroyed ||
            this.recognizeStream.writableEnded ||
            this.recognizeStream.writableDestroyed
        ) {
            return;
        }

        try {
            this.recognizeStream.write(chunk);
        } catch (err) {
            console.warn('[VertexSpeechProvider] Ignoring write to closed stream.');
            this.recognizeStream = null;
        }
    }

    stopStream() {
        if (this.recognizeStream) {
            try {
                this.recognizeStream.removeAllListeners();
                this.recognizeStream.end();
            } catch (err) {
                console.warn('[VertexSpeechProvider] Error while stopping stream:', err);
            } finally {
                this.recognizeStream = null;
            }
        }

        super.stopStream();
        console.log('[VertexSpeechProvider] Stopped.');
    }
}
