import { GeminiInferenceResponse, RiskLevel, RiskRule } from './aiTypes';
import { RuleEngine } from './ruleEngine';
import { SCORING_CONFIG } from './scoringConfig';

export interface DashboardState {
    probability: number;
    threatLevel: RiskLevel;
    locked: boolean;
    scamMatch: { name: string; displayName: string; description: string; confidence: number; } | null;

    // AI Reasoning Fields
    triggeredRules: RiskRule[];
    callerIntent: string;
    scamCategory: string;
    emotionalTone: string;
    conversationStage: string;
    urgencyLevel: string;
    manipulationTechniques: string[];
    suspiciousClaims: string[];
    authorityDetected: boolean;
    credentialRequest: boolean;
    paymentRequest: boolean;
    otpMentioned: boolean;
    summary: string;
    reasoning: string;
    aiSource: 'Gemini Live' | 'Local Fallback' | 'Local Semantic Engine' | 'Vertex AI (Gemini)' | 'None' | string;
    similarScams: any[];
    ragCitations: any[];
}

export class RiskEngine {
    private probabilityThreshold = 0.70;
    private lockThreshold = SCORING_CONFIG.THRESHOLDS.LOCKDOWN;

    // Internal state
    private currentProbability = 0.05;
    private currentThreatLevel: RiskLevel = 'SAFE';
    private isLocked = false;
    private activeMatch: DashboardState['scamMatch'] = null;

    private triggeredRules: RiskRule[] = [];
    private callerIntent = 'Unknown';
    private scamCategory = 'Unknown';
    private emotionalTone = 'Neutral';
    private conversationStage = 'Unknown';
    private urgencyLevel = 'Low';
    private manipulationTechniques: string[] = [];
    private suspiciousClaims: string[] = [];
    private authorityDetected = false;
    private credentialRequest = false;
    private paymentRequest = false;
    private otpMentioned = false;
    private summary = '';
    private reasoning = '';
    private aiSource: 'Gemini Live' | 'Local Fallback' | 'Local Semantic Engine' | 'Vertex AI (Gemini)' | 'None' | string = 'None';
    private similarScams: any[] = [];
    private ragCitations: any[] = [];

    private ruleEngine: RuleEngine;

    constructor() {
        this.ruleEngine = new RuleEngine();
        console.log('[RiskEngine] Initialized with RuleEngine.');
    }

    public processAnalysis(intel: GeminiInferenceResponse | null): DashboardState {
        if (!intel || intel.callerIntent === 'Unknown' && intel.scamCategory === 'Unknown') {
            // Decay risk slowly if no threats detected
            this.currentProbability = Math.max(0.05, this.currentProbability * 0.9);
            this.updateThreatLevel();
            return this.getState();
        }

        // If locked, we don't recover automatically
        if (this.isLocked) {
            return this.getState();
        }

        const engineResult = this.ruleEngine.evaluate(intel);
        const targetConfidence = engineResult.score / 100.0;

        // Adaptive convergence algorithm
        // Replaces the old fixed-bracket system to gracefully handle both long live sessions and short mock bursts.
        // Base rate scales from 0.35 (low risk) up to 0.75 (high risk).
        let convergenceRate = 0.25 + (targetConfidence * 0.50);

        // If there is a massive sudden jump in evidence (common in fast mock scenarios), accelerate
        const diff = Math.max(0, targetConfidence - this.currentProbability);
        if (diff > 0.40) {
            convergenceRate += 0.20;
        }

        // Cap convergence to avoid instant teleportation and preserve UI animation fluidity
        convergenceRate = Math.min(0.95, convergenceRate);

        this.currentProbability =
            this.currentProbability * (1 - convergenceRate) +
            targetConfidence * convergenceRate;

        this.currentProbability = Math.min(1.0, this.currentProbability);

        console.log("========== SCORING DEBUG (RiskEngine) ==========");
        console.log(`RiskEngine Target Confidence: ${targetConfidence}`);
        console.log(`RiskEngine Current Probability: ${this.currentProbability}`);
        console.log("================================================");

        this.updateThreatLevel();

        if (engineResult.triggeredRules.length > 0 && this.currentProbability > 0.4) {
            const topRule = engineResult.triggeredRules[0];
            const category = intel.scamCategory !== 'Unknown' ? intel.scamCategory : topRule.title;

            this.activeMatch = {
                name: category,
                displayName: this.getDisplayName(category),
                description: topRule.evidence || topRule.description,
                confidence: this.currentProbability
            };
        } else if (this.currentProbability <= 0.3) {
            this.activeMatch = null;
        }

        if (this.currentProbability >= this.lockThreshold) {
            this.isLocked = true;
            console.warn('[RiskEngine] THRESHOLD EXCEEDED. TRIGGERING TRANSACTION LOCK.');
        }

        // Store latest intelligence for UI Reasoning Panel
        this.triggeredRules = engineResult.triggeredRules;
        this.callerIntent = intel.callerIntent;
        this.scamCategory = intel.scamCategory;
        this.emotionalTone = intel.emotionalTone;
        this.conversationStage = intel.conversationStage;
        this.urgencyLevel = intel.urgencyLevel;
        this.manipulationTechniques = intel.manipulationTechniques;
        this.suspiciousClaims = intel.suspiciousClaims;
        this.authorityDetected = intel.authorityDetected;
        this.credentialRequest = intel.credentialRequest;
        this.paymentRequest = intel.paymentRequest;
        this.otpMentioned = intel.otpMentioned;
        this.summary = intel.summary;
        this.reasoning = intel.reasoning;
        this.aiSource = intel.aiSource ?? 'None';
        this.similarScams = intel.similarScams || [];
        this.ragCitations = intel.ragCitations || [];

        return this.getState();
    }

    private updateThreatLevel() {
        if (this.currentProbability >= SCORING_CONFIG.THRESHOLDS.CRITICAL) {
            this.currentThreatLevel = 'CRITICAL';
        } else if (this.currentProbability >= SCORING_CONFIG.THRESHOLDS.HIGH) {
            this.currentThreatLevel = 'HIGH';
        } else if (this.currentProbability >= SCORING_CONFIG.THRESHOLDS.MEDIUM) {
            this.currentThreatLevel = 'MEDIUM';
        } else {
            this.currentThreatLevel = 'SAFE';
        }
    }

    private getDisplayName(category: string): string {
        switch (category) {
            case 'Authority Impersonation': return 'Police / Authority Impersonation';
            case 'Bank Scam': return 'RBI / Bank Impersonator';
            case 'Family Emergency': return 'Family Emergency Clone';
            case 'KYC Fraud': return 'KYC Update Scam';
            case 'Investment Scam': return 'High-Yield Investment Scam';
            case 'Lottery Scam': return 'Lottery / Prize Fraud';
            default: return category;
        }
    }

    public getState(): DashboardState {
        return {
            probability: this.currentProbability,
            threatLevel: this.currentThreatLevel,
            locked: this.isLocked,
            scamMatch: this.activeMatch,
            triggeredRules: this.triggeredRules,
            callerIntent: this.callerIntent,
            scamCategory: this.scamCategory,
            emotionalTone: this.emotionalTone,
            conversationStage: this.conversationStage,
            urgencyLevel: this.urgencyLevel,
            manipulationTechniques: this.manipulationTechniques,
            suspiciousClaims: this.suspiciousClaims,
            authorityDetected: this.authorityDetected,
            credentialRequest: this.credentialRequest,
            paymentRequest: this.paymentRequest,
            otpMentioned: this.otpMentioned,
            summary: this.summary,
            reasoning: this.reasoning,
            aiSource: this.aiSource,
            similarScams: this.similarScams,
            ragCitations: this.ragCitations
        };
    }

    public reset() {
        this.currentProbability = 0.05;
        this.currentThreatLevel = 'SAFE';
        this.isLocked = false;
        this.activeMatch = null;
        this.triggeredRules = [];
        this.callerIntent = 'Unknown';
        this.scamCategory = 'Unknown';
        this.emotionalTone = 'Neutral';
        this.conversationStage = 'Unknown';
        this.urgencyLevel = 'Low';
        this.manipulationTechniques = [];
        this.suspiciousClaims = [];
        this.authorityDetected = false;
        this.credentialRequest = false;
        this.paymentRequest = false;
        this.otpMentioned = false;
        this.summary = '';
        this.reasoning = '';
        this.aiSource = 'None';
        this.similarScams = [];
        this.ragCitations = [];
    }
}
