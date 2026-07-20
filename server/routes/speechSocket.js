import { WebSocketServer } from 'ws';
import { VertexSpeechProvider } from '../services/speech/VertexSpeechProvider.js';
import { MockSpeechProvider } from '../services/speech/MockSpeechProvider.js';

export function setupSpeechSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws/speech' });

    wss.on('connection', (ws) => {
        console.log('[WebSocket] Client connected.');

        let provider = null;
        const enableMock = process.env.VITE_ENABLE_MOCK_SCENARIOS === 'true';

        const sendEvent = (event) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(event));
            }
        };

        const handleTranscript = (event) => {
            if (event.type === 'error') {
                console.error('[WebSocket] Provider error:', event.message);
                if (provider instanceof VertexSpeechProvider && enableMock) {
                    console.log('[WebSocket] Falling back to MockSpeechProvider.');
                    provider.stopStream();
                    provider = new MockSpeechProvider();
                    provider.startStream(handleTranscript);
                    sendEvent({ type: 'state', state: 'Mock Mode' });
                } else {
                    sendEvent(event);
                }
            } else {
                sendEvent(event);
            }
        };

        ws.on('message', (message, isBinary) => {
            if (!isBinary) {
                try {
                    const data = JSON.parse(message.toString());

                    if (data.type === 'start') {
                        if (enableMock) {
                            provider = new MockSpeechProvider();
                        } else {
                            try {
                                provider = new VertexSpeechProvider(data.config);
                            } catch (e) {
                                sendEvent({ type: 'error', message: 'Failed to initialize Vertex STT' });
                                return;
                            }
                        }
                        provider.startStream(handleTranscript);
                        sendEvent({ type: 'state', state: provider instanceof MockSpeechProvider ? 'Mock Mode' : 'Connected' });
                    }

                    else if (data.type === 'mock_inject') {
                        console.log('[WebSocket] Injecting mock transcript.');

                        handleTranscript({
                            type: 'final',
                            text: data.text
                        });
                    }

                    else if (data.type === 'stop') {
                        if (provider) {
                            provider.stopStream();
                            provider = null;
                        }
                    }
                } catch (e) {
                    console.error('[WebSocket] Invalid JSON message:', e);
                }
            } else {

                console.log(
                    '[WebSocket] Binary audio:',
                    message.length ?? message.byteLength
                );
                // Binary message (Audio chunk)
                if (provider && typeof provider.writeAudio === 'function') {
                    provider.writeAudio(message);
                }
            }
        });

        ws.on('close', () => {
            console.log('[WebSocket] Client disconnected.');
            if (provider) {
                provider.stopStream();
                provider = null;
            }
        });
    });

    console.log('[WebSocket] Server initialized on /ws/speech');
}
