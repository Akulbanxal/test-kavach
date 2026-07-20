export type ScamCategory = 'Authority Impersonation' | 'Bank Scam' | 'Family Emergency' | 'KYC Fraud' | 'Investment Scam' | 'Lottery Scam' | 'Unknown';

export type RiskLevel = 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ThreatReason {
    type: string;
    description: string;
    confidence: number;
}

export interface TranscriptChunk {
    id: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
}

export interface AnalysisResult {
    scamCategory: ScamCategory;
    riskLevel: RiskLevel;
    confidenceScore: number;
    reasons: ThreatReason[];
    analyzedText: string;
    timestamp: number;
}

export interface GeminiInferenceResponse {
    callerIntent: string;
    scamCategory: string;
    emotionalTone: string;
    urgencyLevel: string;
    authorityDetected: boolean;
    credentialRequest: boolean;
    paymentRequest: boolean;
    otpMentioned: boolean;
    manipulationTechniques: string[];
    suspiciousClaims: string[];
    conversationStage: string;
    summary: string;
    reasoning: string;
    aiSource?: 'Gemini Live' | 'Local Fallback' | 'Local Semantic Engine' | 'Vertex AI (Gemini)';
    similarScams?: any[];
    ragCitations?: any[];
    semanticConfidence?: number;
}

export interface RiskRule {
    id: string;
    title: string;
    description: string;
    points: number;
    triggered: boolean;
    evidence?: string;
}

export interface RuleEngineResult {
    riskScore: number;
    alertLevel: RiskLevel;
    triggeredRules: RiskRule[];
    riskTrend: 'stable' | 'rising' | 'falling';
    thresholdCrossed: boolean;
    analyzedText: string;
    timestamp: number;
    scamCategory: string;
}
