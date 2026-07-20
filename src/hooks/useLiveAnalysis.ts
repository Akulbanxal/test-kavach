import { useState, useEffect } from 'react';
import { orchestrator, UIOrchestratorState } from '../services/analysisOrchestrator';

export function useLiveAnalysis() {
    const [state, setState] = useState<UIOrchestratorState>({
        probability: 0.05,
        threatLevel: 'SAFE',
        locked: false,
        scamMatch: null,
        features: { zcr: 0, flatness: 0, pitch: 0, hfRatio: 0, entropy: 0 },
        amplitude: 0.08,
        trend: 'stable',
        rollingScores: [],
        triggeredRules: [],
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
        aiSource: 'None',
        similarScams: [],
        ragCitations: []
    });

    useEffect(() => {
        const unsubscribe = orchestrator.subscribe((newState) => {
            setState(newState);
        });
        return () => unsubscribe();
    }, []);

    const startAnalysis = () => orchestrator.start();
    const stopAnalysis = () => orchestrator.stop();
    const resetAnalysis = () => orchestrator.reset();
    const injectSimulatedScam = (scamType: string) => orchestrator.injectScamScenario(scamType);

    return {
        ...state,
        startAnalysis,
        stopAnalysis,
        resetAnalysis,
        injectSimulatedScam
    };
}
