import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ManipulationBadge } from './ManipulationBadge';
import { RuleCard } from './RuleCard';
import { ConfidenceGauge } from './ConfidenceGauge';
import { ReasoningSummary } from './ReasoningSummary';
import { RiskRule } from '../ai/aiTypes';
import { AITimeline } from './AITimeline';

interface AIAnalysisPanelProps {
    riskScore: number;
    alertLevel: string;
    riskTrend: 'stable' | 'rising' | 'falling';
    scamCategory: string;
    callerIntent: string;
    conversationStage: string;
    emotionalTone: string;
    urgencyLevel: string;
    manipulationTechniques: string[];
    triggeredRules: RiskRule[];
    locked: boolean;
    callActive: boolean;
}

const ContextMetric = ({ label, value }: { label: string, value: string }) => (
    <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
            {label}
        </div>
        <motion.div 
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}
        >
            {value}
        </motion.div>
    </div>
);

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = React.memo((props) => {
    
    // Sort rules by points descending
    const sortedRules = [...props.triggeredRules].sort((a, b) => b.points - a.points);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', width: '100%' }}>
            
            {/* Left Column: AI Intelligence & Reasoning */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(15,23,42,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: props.callActive ? '#10B981' : '#CBD5E1', animation: props.callActive ? 'pulse-dot 2s infinite' : 'none', flexShrink: 0 }} />
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', fontFamily: 'Space Grotesk, sans-serif' }}>
                            Live AI Intelligence
                        </h2>
                    </div>

                    {/* Context Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                        <ContextMetric label="Scam Category" value={props.scamCategory} />
                        <ContextMetric label="Caller Intent" value={props.callerIntent} />
                        <ContextMetric label="Conversation Stage" value={props.conversationStage} />
                        <ContextMetric label="Emotional Tone" value={props.emotionalTone} />
                        <ContextMetric label="Urgency Level" value={props.urgencyLevel} />
                    </div>

                    {/* Manipulation Techniques */}
                    {props.manipulationTechniques.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                Manipulation Techniques Detected
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <AnimatePresence>
                                    {props.manipulationTechniques.map(tech => (
                                        <ManipulationBadge key={tech} technique={tech} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Reasoning Summary */}
                    <ReasoningSummary 
                        scamCategory={props.scamCategory}
                        callerIntent={props.callerIntent}
                        urgencyLevel={props.urgencyLevel}
                        manipulationTechniques={props.manipulationTechniques}
                    />
                </div>

                {/* Triggered Rule Cards */}
                {sortedRules.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginLeft: '4px' }}>
                            Triggered Evidence Rules
                        </h3>
                        <AnimatePresence>
                            {sortedRules.map((rule, idx) => (
                                <RuleCard key={rule.id} rule={rule} isPrimary={idx === 0} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Right Column: Timeline & Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <ConfidenceGauge 
                    riskScore={props.riskScore}
                    alertLevel={props.alertLevel}
                    trend={props.riskTrend}
                />
                
                <div style={{ flex: 1, minHeight: '350px' }}>
                    <AITimeline 
                        callActive={props.callActive}
                        triggeredRules={props.triggeredRules}
                        locked={props.locked}
                    />
                </div>
            </div>

        </div>
    );
});
