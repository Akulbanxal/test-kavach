import { SpeechProvider } from '../ai/speechProvider';
import { GeminiAnalyzer } from '../ai/geminiAnalyzer';
import { RiskEngine, DashboardState } from '../ai/riskEngine';
import { TranscriptChunk } from '../ai/aiTypes';
import { TranscriptAccumulator } from '../ai/transcriptAccumulator';
import { SCAM_SIGNATURES } from '../ai/scam-signatures';
import { localFallbackAnalyzer } from '../ai/localFallbackAnalyzer';
import { RuleEngine } from '../ai/ruleEngine';

export interface UIOrchestratorState extends DashboardState {
    features: { zcr: number; flatness: number; pitch: number; hfRatio: number; entropy: number; };
    amplitude: number;
    trend: 'stable' | 'rising' | 'falling';
    rollingScores: number[];
    latestTranscript: string;
    connectionState: string;
    /**
     * Interim risk score (0–100) produced instantly by LocalFallbackAnalyzer +
     * RuleEngine on each transcript chunk, before Gemini completes (~9s).
     * Used to trigger payment friction tiers during the analysis window so
     * the user is never unprotected while awaiting cloud analysis.
     * Resets to 0 once Gemini result overwrites the full pipeline state.
     */
    interimRiskScore: number;
    /** True while a Gemini /api/analyze round-trip is in-flight. */
    isAnalyzingChunk: boolean;
}

type StateListener = (state: UIOrchestratorState) => void;

class AnalysisOrchestrator {
    private speechProvider: SpeechProvider;
    private analyzer: GeminiAnalyzer;
    private riskEngine: RiskEngine;
    private ruleEngine: RuleEngine;
    private accumulator: TranscriptAccumulator;

    private listeners: Set<StateListener> = new Set();
    private isRunning = false;

    // Interim protection state
    private interimRiskScore = 0;
    private isAnalyzingChunk = false;

    // ─── Single-slot latest-wins analysis queue ────────────────────────────
    //
    // Invariant: at most ONE /api/analyze request is in-flight at any time.
    //
    // If a new transcript is flushed while analysis is running, it is stored
    // as `pendingChunk` (overwriting any previously pending chunk so that only
    // the freshest conversation state is retained).
    //
    // When the current analysis completes, the queue drains `pendingChunk`
    // immediately in a recursive loop — no setTimeout, no microtask gap.
    //
    // States:
    //   isAnalyzing=F, pendingChunk=null  → idle
    //   isAnalyzing=T, pendingChunk=null  → running, no backlog
    //   isAnalyzing=T, pendingChunk=chunk → running, latest transcript waiting
    // ──────────────────────────────────────────────────────────────────────
    private isAnalyzing = false;
    private pendingChunk: TranscriptChunk | null = null;

    // Visual states for dashboard
    private mockFeatures = { zcr: 0, flatness: 0, pitch: 0, hfRatio: 0, entropy: 0 };
    private mockAmplitude = 0.08;
    private trend: 'stable' | 'rising' | 'falling' = 'stable';
    private rollingScores: number[] = [];
    private prevProbability = 0;
    private latestTranscript = '';
    private connectionState = 'Disconnected';

    constructor() {
        this.speechProvider = new SpeechProvider();
        this.analyzer = new GeminiAnalyzer();
        this.riskEngine = new RiskEngine();
        this.ruleEngine = new RuleEngine();

        this.accumulator = new TranscriptAccumulator(
            (finalChunk: TranscriptChunk) => this.enqueue(finalChunk),
            3000 // 3 second silence timeout
        );

        this.speechProvider.onConnectionState((state) => {
            this.connectionState = state;
            this.notifyListeners();
        });
    }

    /**
     * Enqueue a flushed transcript for analysis.
     *
     * Entry point — called synchronously by TranscriptAccumulator.onFlush().
     * No async here: we do not await; we either start a new analysis loop
     * immediately (idle case) or park the chunk as pending (busy case).
     */
    private enqueue(chunk: TranscriptChunk): void {
        // ── Interim Protection: run instant local analysis BEFORE Gemini ────────
        // This produces a zero-latency interim risk score that allows PaymentGuard
        // to start showing friction tiers immediately, during the ~9s Gemini window.
        // The interim score is replaced once the full Gemini result is published.
        this.runInterimAnalysis(chunk.text);

        if (!this.isAnalyzing) {
            // Idle — start the analysis loop immediately.
            this.isAnalyzing = true;
            this.isAnalyzingChunk = true;
            this.notifyListeners();
            this.runAnalysisLoop(chunk);
        } else {
            // Busy — store only the latest chunk, discard any older pending.
            if (this.pendingChunk) {
                console.log(
                    `[Orchestrator] Replacing pending transcript "${this.pendingChunk.id}" ` +
                    `with "${chunk.id}" (latest-wins).`
                );
            } else {
                console.log(`[Orchestrator] Analysis in-flight — queuing "${chunk.id}" as pending.`);
            }
            this.pendingChunk = chunk;
        }
    }

    /**
     * Stage 1 (Instant) interim analysis using LocalFallbackAnalyzer + RuleEngine.
     * Executes synchronously (<0.1 ms) so payment friction tiers can activate
     * immediately — before the ~9s Stage 2 (Gemini /api/analyze) call completes.
     *
     * ⚠ RECALL TRADEOFF (same engine as Fallback Mode):
     *   This is identical to the localFallbackAnalyzer that runs when Gemini is
     *   unavailable and the UI shows "⚠ REDUCED ACCURACY MODE". On the 32-sample
     *   adversarial test set its recall is:
     *     - MEDIUM  (0.34) : ~85.0%   (misses paraphrased evasion)
     *     - HIGH    (0.60) : ~50.0%   (misses semantic re-phrasings)
     *     - CRITICAL(0.80) : ~20.0%   (misses most non-keyword scams)
     *
     * Design intent: Stage 1 is deliberately biased toward friction (conservative)
     * to protect the ~9s window. It is NOT a substitute for Stage 2 (Gemini).
     * The UI labels this score as "provisional" and PaymentGuard tiers only
     * relax after stage2Confirmed=true (Stage 2 completion).
     */
    private runInterimAnalysis(text: string): void {
        try {
            const interimIntel = localFallbackAnalyzer.analyze(text);
            const { score, triggeredRules } = this.ruleEngine.evaluate(interimIntel);
            this.interimRiskScore = score;
            console.log(`[Orchestrator] Interim risk score (local, instant): ${score.toFixed(1)} pts`);
            this.notifyListeners();
        } catch (err) {
            // Non-critical — Gemini result will still follow
            console.warn('[Orchestrator] Interim analysis failed:', err);
            this.interimRiskScore = 0;
            this.notifyListeners();
        }
    }

    /**
     * Core analysis loop.
     *
     * Runs one analysis, then checks for a pending chunk.
     * If one exists it drains it immediately, otherwise idles.
     *
     * The loop is NEVER recursive in the call-stack sense — each iteration
     * runs as a continuation after the awaited Promise resolves, so stack
     * depth remains constant regardless of how many transcripts are queued.
     */
    private async runAnalysisLoop(chunk: TranscriptChunk): Promise<void> {
        // isAnalyzing is already true when entering.
        let current = chunk;

        while (true) {
            try {
                console.log(
                    `[Orchestrator] Analyzing "${current.id}" (${current.text.length} chars).`
                );

                const result = await this.analyzer.analyzeStream(current);

                // User may have stopped/reset while Gemini was thinking.
                if (!this.isRunning) {
                    console.log(
                        "[Orchestrator] Analysis completed after stop(); discarding result."
                    );
                    this.isAnalyzing = false;
                    this.isAnalyzingChunk = false;
                    this.interimRiskScore = 0;
                    this.pendingChunk = null;
                    return;
                }

                // Gemini result is in — clear interim score, publish full result
                this.interimRiskScore = 0;
                this.isAnalyzingChunk = this.pendingChunk !== null;
                this.riskEngine.processAnalysis(result);
                this.notifyListeners();
            } catch (err) {
                console.error(
                    "[Orchestrator] analyzeStream() threw — continuing queue drain:",
                    err
                );

                // If the pipeline has been stopped, exit immediately.
                if (!this.isRunning) {
                    this.isAnalyzing = false;
                    this.pendingChunk = null;
                    return;
                }
            }

            // Drain latest pending transcript.
            if (this.pendingChunk !== null) {
                current = this.pendingChunk;
                this.pendingChunk = null;

                console.log(
                    `[Orchestrator] Draining pending "${current.id}".`
                );

                continue;
            }

            // Queue empty.
            this.isAnalyzing = false;
            this.isAnalyzingChunk = false;
            this.interimRiskScore = 0;
            this.notifyListeners();
            console.log("[Orchestrator] Queue drained — idle.");
            return;
        }
    }

    // ─── Subscriber API ───────────────────────────────────────────────────

    public subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        listener(this.getFullState());
        return () => this.listeners.delete(listener);
    }

    private getFullState(): UIOrchestratorState {
        const baseState = this.riskEngine.getState();
        return {
            ...baseState,
            features: this.mockFeatures,
            amplitude: this.mockAmplitude,
            trend: this.trend,
            rollingScores: this.rollingScores,
            latestTranscript: this.latestTranscript,
            connectionState: this.connectionState,
            interimRiskScore: this.interimRiskScore,
            isAnalyzingChunk: this.isAnalyzingChunk,
        };
    }

    private notifyListeners() {
        const state = this.getFullState();

        // Update trend based on change in probability
        const delta = state.probability - this.prevProbability;
        if (Math.abs(delta) < 0.012) this.trend = 'stable';
        else if (delta > 0) this.trend = 'rising';
        else this.trend = 'falling';
        this.prevProbability = state.probability;

        // Update rolling scores
        this.rollingScores.push(state.probability);
        if (this.rollingScores.length > 5) this.rollingScores.shift();

        this.listeners.forEach(l => l(this.getFullState()));
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.reset();

        console.log('[Orchestrator] Starting AI pipeline.');

        this.speechProvider.startStreaming(async (chunk: TranscriptChunk) => {
            // Update ambient features for UI purely for visuals
            this.mockFeatures = {
                zcr: 0.15 + Math.random() * 0.1,
                flatness: 0.2 + Math.random() * 0.1,
                pitch: 0.1 + Math.random() * 0.1,
                hfRatio: 0.1 + Math.random() * 0.05,
                entropy: 0.2 + Math.random() * 0.1,
            };
            this.mockAmplitude = 0.1 + Math.random() * 0.05;

            // Update UI with transcript immediately
            this.latestTranscript = chunk.text;
            this.notifyListeners();

            // Pass to accumulator (will trigger Gemini on final or timeout)
            if (chunk.isFinal) {
                this.accumulator.pushFinal(chunk.text, chunk.timestamp);
            } else {
                this.accumulator.pushPartial(chunk.text);
            }
        });
    }

    public stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        this.speechProvider.stopStreaming();
        this.accumulator.clear();

        // Cancel any queued work.
        this.pendingChunk = null;
        this.isAnalyzing = false;

        console.log("[Orchestrator] Stopped AI pipeline.");
    }

    public reset() {
        this.analyzer.reset();
        this.riskEngine.reset();
        this.accumulator.clear();

        this.rollingScores = [];
        this.trend = 'stable';
        this.prevProbability = 0;
        this.latestTranscript = '';
        this.interimRiskScore = 0;
        this.isAnalyzingChunk = false;

        this.mockFeatures = {
            zcr: 0,
            flatness: 0,
            pitch: 0,
            hfRatio: 0,
            entropy: 0,
        };

        this.mockAmplitude = 0.08;

        this.notifyListeners();
    }
    // ─── Mock Injection ───────────────────────────────────────────────────

    public injectScamScenario(scamType: string) {
        console.log(`[Orchestrator] Injecting mock scenario: ${scamType}`);

        // Boost mock features to simulate scam profile
        this.mockFeatures = {
            zcr: 0.8 + Math.random() * 0.1,
            flatness: 0.85 + Math.random() * 0.1,
            pitch: 0.9 + Math.random() * 0.1,
            hfRatio: 0.75 + Math.random() * 0.1,
            entropy: 0.88 + Math.random() * 0.1,
        };
        this.mockAmplitude = 0.8 + Math.random() * 0.2;

        const sig = SCAM_SIGNATURES[scamType];
        const text = sig?.spokenSentence || 'Warning. Unauthorized bank transfer requested.';

        this.speechProvider.injectSimulatedTranscript(text);
    }
}

export const orchestrator = new AnalysisOrchestrator();
