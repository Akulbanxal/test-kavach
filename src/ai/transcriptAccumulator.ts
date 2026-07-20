import { TranscriptChunk } from './aiTypes';

export type FlushCallback = (finalChunk: TranscriptChunk) => void;

export class TranscriptAccumulator {
    private buffer: string[] = [];
    private lastPartial: string = '';
    private flushTimer: any = null;
    private timeoutMs: number;
    private onFlush: FlushCallback;

    constructor(onFlush: FlushCallback, timeoutMs: number = 3000) {
        this.onFlush = onFlush;
        this.timeoutMs = timeoutMs;
    }

    public pushPartial(text: string) {
        if (!text) return;
        this.lastPartial = text;
        this.resetTimer();
    }

    public pushFinal(text: string, timestamp: number) {
        if (!text) return;
        this.buffer.push(text);
        this.lastPartial = '';
        this.flush(timestamp);
    }

    private resetTimer() {
        if (this.flushTimer) clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => {
            if (this.buffer.length > 0 || this.lastPartial.length > 0) {
                this.flush(Date.now());
            }
        }, this.timeoutMs);
    }

    private flush(timestamp: number) {
        if (this.flushTimer) clearTimeout(this.flushTimer);
        
        let combinedText = this.buffer.join(' ');
        if (this.lastPartial && !combinedText.endsWith(this.lastPartial)) {
            combinedText += (combinedText ? ' ' : '') + this.lastPartial;
        }
        
        if (combinedText.trim().length > 0) {
            this.buffer = [];
            this.lastPartial = '';
            
            this.onFlush({
                id: `flush_${Date.now()}`,
                text: combinedText,
                timestamp,
                isFinal: true
            });
        }
    }
    
    public clear() {
        this.buffer = [];
        this.lastPartial = '';
        if (this.flushTimer) clearTimeout(this.flushTimer);
    }
}
