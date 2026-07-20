import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskRule, RiskLevel } from '../ai/aiTypes';

interface AIReasoningPanelProps {
    riskScore: number;
    alertLevel: RiskLevel;
    triggeredRules: RiskRule[];
    callerIntent: string;
    scamCategory: string;
    emotionalTone: string;
    conversationStage: string;
    riskTrend: 'stable' | 'rising' | 'falling';
}

export default function AIReasoningPanel(props: AIReasoningPanelProps) {
    const {
        riskScore, alertLevel, triggeredRules, callerIntent, scamCategory,
        emotionalTone, conversationStage, riskTrend
    } = props;

    // Sort rules by points (descending) so highest impact is first
    const sortedRules = [...triggeredRules].sort((a, b) => b.points - a.points);
    const topRule = sortedRules.length > 0 ? sortedRules[0] : null;

    const generateExplanation = () => {
        if (!topRule) return null;
        
        const base = `The conversation was flagged because the caller triggered the '${topRule.title}' rule`;
        
        let context = '';
        if (scamCategory !== 'Unknown') {
            context += ` while exhibiting behaviors of a ${scamCategory}`;
        }
        
        if (emotionalTone !== 'Neutral' && emotionalTone !== 'Unknown') {
            context += ` with a ${emotionalTone.toLowerCase()} emotional tone`;
        }
        
        return `${base}${context}.`;
    };

    if (triggeredRules.length === 0) {
        return (
            <div style={{
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '16px',
                padding: '24px',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{ textAlign: 'center' }}>
                    <svg style={{ margin: '0 auto 12px', opacity: 0.5 }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>No suspicious behaviour detected yet.</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(to bottom right, #0F172A, #1E293B)',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '24px',
            color: '#F8FAFC',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Top Accent Line */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: alertLevel === 'CRITICAL' || alertLevel === 'HIGH' ? '#EF4444' : '#F59E0B'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '0.05em', color: '#CBD5E1', textTransform: 'uppercase' }}>
                    AI Reasoning Engine
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {riskTrend !== 'stable' && (
                        <div style={{ fontSize: '12px', color: riskTrend === 'rising' ? '#EF4444' : '#10B981' }}>
                            {riskTrend === 'rising' ? '↗ Rising' : '↘ Falling'}
                        </div>
                    )}
                    <div style={{
                        background: alertLevel === 'CRITICAL' ? '#7F1D1D' : alertLevel === 'HIGH' ? '#991B1B' : '#78350F',
                        color: alertLevel === 'CRITICAL' ? '#FECACA' : alertLevel === 'HIGH' ? '#FCA5A5' : '#FDE68A',
                        padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'
                    }}>
                        Risk Score: {Math.round(riskScore)}/100
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* Section 1: AI Analysis */}
                <div style={{
                    background: '#0B0F19', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Context Analysis</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Category</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{scamCategory}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Intent</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{callerIntent}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Stage</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{conversationStage}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Tone</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{emotionalTone}</span>
                    </div>
                </div>

                {/* Section 4: AI Decision (Explanation) */}
                <div style={{
                    background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Deterministic Decision
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#E2E8F0', fontWeight: 400 }}>
                        {generateExplanation()}
                    </p>
                </div>
            </div>

            {/* Section 3: Triggered Rules */}
            <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    Triggered Rules Matrix ({sortedRules.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence>
                        {sortedRules.map((rule, idx) => (
                            <motion.div
                                key={rule.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                style={{
                                    background: idx === 0 ? 'rgba(239, 68, 68, 0.1)' : '#0B0F19',
                                    border: idx === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #1E293B',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: idx === 0 ? '#FCA5A5' : '#E2E8F0' }}>
                                        {rule.title}
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: idx === 0 ? '#EF4444' : '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
                                        +{rule.points} PTS
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                                    {rule.description}
                                </div>
                                {rule.evidence && (
                                    <div style={{
                                        marginTop: '4px',
                                        padding: '8px',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderLeft: '2px solid #475569',
                                        fontSize: '11px',
                                        color: '#CBD5E1',
                                        fontFamily: 'JetBrains Mono, monospace'
                                    }}>
                                        Evidence: "{rule.evidence}"
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
}
