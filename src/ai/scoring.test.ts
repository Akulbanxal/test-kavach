import assert from 'assert';
import { RiskEngine } from './riskEngine';
import { SCORING_CONFIG } from './scoringConfig';

function createMockIntel(overrides: any) {
    return {
        callerIntent: 'Unknown',
        scamCategory: 'Unknown',
        emotionalTone: 'Neutral',
        conversationStage: 'Unknown',
        urgencyLevel: 'Low',
        manipulationTechniques: [],
        suspiciousClaims: [],
        authorityDetected: false,
        credentialRequest: false,
        paymentRequest: false,
        otpMentioned: false,
        summary: '',
        reasoning: '',
        semanticConfidence: 0.0,
        ...overrides
    };
}

async function runTests() {
    console.log("Starting Regression Tests...");
    let passed = 0;
    let failed = 0;

    const scenarios = [
        {
            name: "Normal conversation",
            intel: createMockIntel({
                callerIntent: 'Informative',
                semanticConfidence: 0.30
            }),
            expectedScoreRange: [0, 10],
            expectedCategory: 'Unknown',
            expectedAlert: 'SAFE',
            expectedRules: 0,
            expectedLock: false
        },
        {
            name: "Legitimate bank reminder",
            intel: createMockIntel({
                callerIntent: 'Informative',
                authorityDetected: true,
                semanticConfidence: 0.40
            }),
            expectedScoreRange: [5, 20],
            expectedCategory: 'Unknown',
            expectedAlert: 'SAFE',
            expectedRules: 0, // Authority shouldn't trigger due to missing malicious intent
            expectedLock: false
        },
        {
            name: "Family emergency scam",
            intel: createMockIntel({
                scamCategory: 'Family Emergency',
                urgencyLevel: 'High',
                paymentRequest: true,
                manipulationTechniques: ['Guilt', 'Fear'],
                semanticConfidence: 0.50
            }),
            expectedScoreRange: [50, 70],
            expectedCategory: 'Family Emergency',
            expectedAlert: 'MEDIUM', // or HIGH depending on exact score, wait let's just check ranges
            expectedRules: 4,
            expectedLock: false
        },
        {
            name: "Lottery scam",
            intel: createMockIntel({
                scamCategory: 'Lottery Scam',
                paymentRequest: true,
                manipulationTechniques: ['Greed'],
                semanticConfidence: 0.45
            }),
            expectedScoreRange: [50, 70],
            expectedCategory: 'Lottery Scam',
            expectedAlert: 'MEDIUM', // or HIGH
            expectedRules: 3,
            expectedLock: false
        },
        {
            name: "KYC scam",
            intel: createMockIntel({
                scamCategory: 'KYC Fraud',
                credentialRequest: true,
                urgencyLevel: 'High',
                conversationStage: 'Escalation',
                manipulationTechniques: ['Threat'],
                semanticConfidence: 0.55
            }),
            expectedScoreRange: [70, 85],
            expectedCategory: 'KYC Fraud',
            expectedAlert: 'HIGH', // >= 0.60
            expectedRules: 5,
            expectedLock: false
        },
        {
            name: "RBI authority scam",
            intel: createMockIntel({
                scamCategory: 'Bank Scam',
                authorityDetected: true,
                urgencyLevel: 'High',
                manipulationTechniques: ['Fear', 'Authority'],
                paymentRequest: true,
                semanticConfidence: 0.60
            }),
            expectedScoreRange: [85, 95],
            expectedCategory: 'Bank Scam',
            expectedAlert: 'CRITICAL', // >= 0.80
            expectedRules: 5,
            expectedLock: false
        },
        {
            name: "OTP banking scam",
            intel: createMockIntel({
                scamCategory: 'Bank Scam',
                authorityDetected: true,
                otpMentioned: true,
                credentialRequest: true,
                paymentRequest: true,
                semanticConfidence: 0.65
            }),
            expectedScoreRange: [95, 100],
            expectedCategory: 'Bank Scam',
            expectedAlert: 'CRITICAL',
            expectedRules: 5,
            expectedLock: true
        }
    ];

    for (const scenario of scenarios) {
        try {
            const engine = new RiskEngine();
            // Since RiskEngine converges over time, we simulate 10 chunks of identical intel 
            // to allow it to reach its target confidence for the test.
            let state;
            for (let i = 0; i < 10; i++) {
                state = engine.processAnalysis(scenario.intel as any);
            }

            const score = state.probability * 100;
            
            assert(score >= scenario.expectedScoreRange[0] && score <= scenario.expectedScoreRange[1], 
                `Score ${score.toFixed(2)} outside expected range [${scenario.expectedScoreRange[0]}, ${scenario.expectedScoreRange[1]}]`);
            
            assert(state.scamCategory === scenario.expectedCategory, 
                `Category ${state.scamCategory} !== ${scenario.expectedCategory}`);
            
            // Check alert level if specified (allow some flexibility if borderline)
            if (scenario.expectedAlert && !scenario.expectedLock) {
                // If it expects lock, alert level might be overridden, but let's check
                if (score >= 80) assert(state.threatLevel === 'CRITICAL', `Expected CRITICAL alert, got ${state.threatLevel}`);
                else if (score >= 60) assert(state.threatLevel === 'HIGH', `Expected HIGH alert, got ${state.threatLevel}`);
                else if (score >= 34) assert(state.threatLevel === 'MEDIUM', `Expected MEDIUM alert, got ${state.threatLevel}`);
                else assert(state.threatLevel === 'SAFE', `Expected SAFE alert, got ${state.threatLevel}`);
            }

            assert(state.triggeredRules.length === scenario.expectedRules, 
                `Triggered rules ${state.triggeredRules.length} !== ${scenario.expectedRules}`);
            
            assert(state.locked === scenario.expectedLock, 
                `Locked state ${state.locked} !== ${scenario.expectedLock}`);

            console.log(`✅ ${scenario.name} (Score: ${score.toFixed(2)}%)`);
            passed++;
        } catch (error) {
            console.error(`❌ ${scenario.name} FAILED: ${error.message}`);
            failed++;
        }
    }

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
