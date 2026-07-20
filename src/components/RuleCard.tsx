import React from 'react';
import { motion } from 'framer-motion';
import { RiskRule } from '../ai/aiTypes';

interface RuleCardProps {
    rule: RiskRule;
    isPrimary?: boolean;
}

export const RuleCard: React.FC<RuleCardProps> = React.memo(({ rule, isPrimary = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                background: isPrimary ? 'linear-gradient(145deg, #FEF2F2, #FFFFFF)' : '#FFFFFF',
                border: `1px solid ${isPrimary ? '#FCA5A5' : '#E2E8F0'}`,
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '10px',
                boxShadow: isPrimary ? '0 4px 12px rgba(220, 38, 38, 0.08)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {isPrimary && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: 'linear-gradient(to bottom, #EF4444, #DC2626)', borderRadius: '12px 0 0 12px' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {rule.title}
                </div>
                <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    color: isPrimary ? '#DC2626' : '#475569',
                    background: isPrimary ? '#FEE2E2' : '#F1F5F9',
                    padding: '3px 10px',
                    borderRadius: '12px'
                }}>
                    +{rule.points} PTS
                </div>
            </div>

            {rule.evidence && (
                <div style={{ marginBottom: '8px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Extracted Evidence</div>
                    <div style={{ fontSize: '13px', color: '#334155', fontStyle: 'italic', fontFamily: 'serif' }}>"{rule.evidence}"</div>
                </div>
            )}
            
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>Reason: </span>{rule.description}
            </div>
        </motion.div>
    );
});
