import { TranscriptChunk } from './aiTypes';

export type TranscriptCallback = (chunk: TranscriptChunk) => void;
export type StateCallback = (state: string) => void;

export class SpeechProvider {
    private onTranscript: TranscriptCallback | null = null;
    private onStateChange: StateCallback | null = null;
    private ws: WebSocket | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private chunkIdCounter = 0;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isStreaming = false;

    public onConnectionState(callback: StateCallback) {
        this.onStateChange = callback;
    }

    private setState(state: string) {
        console.log(`[SpeechProvider] State: ${state}`);
        if (this.onStateChange) this.onStateChange(state);
    }

    public async startStreaming(onTranscript: TranscriptCallback) {
        this.onTranscript = onTranscript;
        this.isStreaming = true;
        this.connectSocket();
    }

    private connectSocket() {
        this.setState('Connecting');

        // Determine WS URL based on current host if not local, but we know backend is 3001
        const wsUrl = `ws://localhost:3000/ws/speech`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = async () => {
            this.reconnectAttempts = 0;
            this.setState('Connected');

            this.ws?.send(JSON.stringify({
                type: 'start',
                config: { sampleRate: 16000, encoding: 'WEBM_OPUS' }
            }));

            // Only start mic if we aren't purely mock injected. 
            // In a real app we'd ask for mic permission here.
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.startMicrophone(stream);
            } catch (err) {
                console.warn('[SpeechProvider] Mic access denied or unavailable. Running in Mock/Simulated mode only.');
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'state') {
                    this.setState(data.state);
                }
                else if (data.type === 'partial' || data.type === 'final') {
                    if (this.onTranscript) {
                        this.onTranscript({
                            id: `chunk_${this.chunkIdCounter++}`,
                            text: data.text,
                            timestamp: Date.now(),
                            isFinal: data.type === 'final'
                        });
                    }
                }
                else if (data.type === 'error') {
                    console.error('[SpeechProvider] Backend error:', data.message);
                    this.setState('Error');
                }
            } catch (e) {
                console.error('[SpeechProvider] Failed to parse WS message:', e);
            }
        };

        this.ws.onclose = () => {
            if (this.isStreaming && this.reconnectAttempts < 3) {
                this.reconnectAttempts++;
                this.setState('Reconnecting');
                this.reconnectTimer = setTimeout(() => {
                    this.reconnectTimer = null;
                    if (this.isStreaming) this.connectSocket();
                }, 2000);
            } else if (this.isStreaming) {
                this.setState('Error');
            }
            this.stopMicrophone();
        };

        this.ws.onerror = (err) => {
            console.error('[SpeechProvider] WS Error:', err);
        };
    }

    private startMicrophone(stream: MediaStream) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        this.mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
                // Send raw binary Blob to WS
                this.ws.send(e.data);
            }
        };
        // Slice audio every 250ms
        this.mediaRecorder.start(250);
    }

    private stopMicrophone() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
        this.mediaRecorder = null;
    }

    public stopStreaming() {
        this.isStreaming = false;
        // Cancel any pending reconnect timer before closing — prevents orphaned WS
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.reconnectAttempts = 0;
        this.stopMicrophone();
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'stop' }));
            }
            this.ws.close();
            this.ws = null;
        }
        this.onTranscript = null;
        console.log('[SpeechProvider] Stopped audio capture stream.');
    }

    public injectSimulatedTranscript(text: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'mock_inject',
                text: text
            }));
        } else {
            // Surface the failure — do NOT silently drop the inject
            const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
            const wsState = this.ws ? (stateNames[this.ws.readyState] ?? `UNKNOWN(${this.ws.readyState})`) : 'NULL (no socket)';
            const msg = `[SpeechProvider] injectSimulatedTranscript failed: WebSocket is not open (state=${wsState}). Start a call first.`;
            console.error(msg);
            this.setState(`Inject Failed: WS ${wsState}`);
        }
    }
}
