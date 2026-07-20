import { GeminiInferenceResponse, RiskRule } from './aiTypes';
import { SCORING_CONFIG } from './scoringConfig';

type RuleEvaluator = (intel: GeminiInferenceResponse) => RiskRule | null;

export class RuleEngine {
    private rules: RuleEvaluator[] = [];

    constructor() {
        this.registerRules();
        console.log('[RuleEngine] Initialized with explainable rules.');
    }

    private registerRules() {
        this.rules.push(this.authorityImpersonationRule);
        this.rules.push(this.otpRequestRule);
        this.rules.push(this.credentialRequestRule);
        this.rules.push(this.paymentRequestRule);
        this.rules.push(this.highUrgencyRule);
        this.rules.push(this.knownScamCategoryRule);
        this.rules.push(this.multipleManipulationTechniquesRule);
        this.rules.push(this.conversationEscalationRule);
    }

    public evaluate(intel: GeminiInferenceResponse): { score: number, triggeredRules: RiskRule[] } {
        let totalScore = 0;
        const triggeredRules: RiskRule[] = [];

        for (const rule of this.rules) {
            const result = rule(intel);
            if (result && result.triggered) {
                totalScore += result.points;
                triggeredRules.push(result);
            }
        }

        const ruleScore = totalScore;
        const semanticBonus = (intel.semanticConfidence || 0) * SCORING_CONFIG.SEMANTIC_BONUS_MULTIPLIER;
        
        let finalScore = ruleScore + semanticBonus;

        // Cap score at 100
        finalScore = Math.min(100, Math.max(0, finalScore));

        console.log("========== SCORING DEBUG (RuleEngine) ==========");
        console.log(`Rule Score: ${ruleScore}`);
        console.log(`Semantic Bonus: ${semanticBonus.toFixed(2)}`);
        console.log(`Final RuleEngine Score: ${finalScore.toFixed(2)}`);
        console.log(`Triggered Rules: ${triggeredRules.map(r => r.title).join(', ')}`);
        console.log("================================================");

        return {
            score: finalScore,
            triggeredRules
        };
    }

    // ─── Rule Definitions ─────────────────────────────────────────────────────────────

    private authorityImpersonationRule(intel: GeminiInferenceResponse): RiskRule | null {
        const maliciousIntent =
            intel.credentialRequest ||
            intel.otpMentioned ||
            intel.paymentRequest ||
            (intel.manipulationTechniques?.length ?? 0) > 0 ||
            intel.urgencyLevel === "High" ||
            intel.urgencyLevel === "Critical" ||
            (intel.suspiciousClaims?.length ?? 0) > 0;

        if (intel.authorityDetected && maliciousIntent) {
            return {
                id: 'AUTH_IMPERSONATION',
                title: 'Authority Impersonation',
                description: 'The caller is attempting to use authority to pressure the user.',
                points: SCORING_CONFIG.RULES.AUTHORITY_POINTS,
                triggered: true,
                evidence: intel.reasoning || 'Caller claimed authority status.'
            };
        }
        return null;
    }

    private otpRequestRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.otpMentioned) {
            return {
                id: 'OTP_REQUEST',
                title: 'OTP Requested',
                description: 'The caller explicitly asked for a One-Time Password.',
                points: SCORING_CONFIG.RULES.OTP_POINTS,
                triggered: true,
                evidence: intel.reasoning || 'OTP mentioned during the conversation.'
            };
        }
        return null;
    }

    private credentialRequestRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.credentialRequest) {
            return {
                id: 'CREDENTIAL_REQUEST',
                title: 'Credential Request',
                description: 'The caller asked for sensitive login details, PINs, or card numbers.',
                points: SCORING_CONFIG.RULES.CREDENTIAL_POINTS,
                triggered: true,
                evidence: intel.reasoning || 'Sensitive credentials were requested.'
            };
        }
        return null;
    }

    private paymentRequestRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.paymentRequest) {
            return {
                id: 'PAYMENT_REQUEST',
                title: 'Payment Request',
                description: 'The caller made a direct request for a financial transfer.',
                points: SCORING_CONFIG.RULES.PAYMENT_POINTS,
                triggered: true,
                evidence: intel.reasoning || 'Direct payment requested.'
            };
        }
        return null;
    }

    private highUrgencyRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.urgencyLevel === 'High' || intel.urgencyLevel === 'Critical') {
            return {
                id: 'HIGH_URGENCY',
                title: 'High Urgency',
                description: 'The caller is creating artificial time pressure.',
                points: SCORING_CONFIG.RULES.URGENCY_POINTS,
                triggered: true,
                evidence: intel.reasoning || 'High or Critical urgency level detected.'
            };
        }
        return null;
    }

    private knownScamCategoryRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.scamCategory !== 'Unknown') {
            return {
                id: 'KNOWN_SCAM',
                title: 'Known Scam Profile',
                description: 'The conversation matches a known fraud profile.',
                points: SCORING_CONFIG.RULES.KNOWN_SCAM_POINTS,
                triggered: true,
                evidence: `Categorized as: ${intel.scamCategory}`
            };
        }
        return null;
    }

    private multipleManipulationTechniquesRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.manipulationTechniques && intel.manipulationTechniques.length > 0) {
            const points = Math.min(intel.manipulationTechniques.length * 4, 12);
            return {
                id: 'MANIPULATION',
                title: 'Manipulation Techniques Detected',
                description: 'The caller is using psychological manipulation tactics.',
                points,
                triggered: true,
                evidence: `Detected techniques: ${intel.manipulationTechniques.join(', ')}`
            };
        }
        return null;
    }

    private conversationEscalationRule(intel: GeminiInferenceResponse): RiskRule | null {
        if (intel.conversationStage === 'Escalation' || intel.emotionalTone === 'Aggressive') {
            return {
                id: 'ESCALATION',
                title: 'Conversation Escalation',
                description: 'The tone is aggressive or the conversation is rapidly escalating.',
                points: SCORING_CONFIG.RULES.ESCALATION_POINTS,
                triggered: true,
                evidence: `Tone: ${intel.emotionalTone}, Stage: ${intel.conversationStage}`
            };
        }
        return null;
    }
}
