import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceGaugeProps {
    riskScore: number;
    alertLevel: string;
    trend: 'stable' | 'rising' | 'falling';
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = React.memo(({ riskScore, alertLevel, trend }) => {
    const isCritical = riskScore >= 80;
    const color = isCritical ? '#EF4444' : riskScore >= 40 ? '#F59E0B' : '#10B981';
    
    return (
        <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(15,23,42,0.03)'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Risk Confidence
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <motion.div 
                        key={riskScore}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '44px', fontWeight: 900, color: color, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1, letterSpacing: '-0.02em' }}
                    >
                        {riskScore.toFixed(0)}
                    </motion.div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#94A3B8' }}>/ 100</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: '99px', 
                    background: `${color}15`, 
                    color: color,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                }}>
                    {alertLevel} ALERT
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    Trend: 
                    <span style={{ 
                        color: trend === 'rising' ? '#EF4444' : trend === 'falling' ? '#10B981' : '#64748B' 
                    }}>
                        {trend === 'rising' ? '📈 Escalating' : trend === 'falling' ? '📉 Decreasing' : '➖ Stable'}
                    </span>
                </div>

                <div style={{ width: '120px', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${riskScore}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        style={{ height: '100%', background: color, borderRadius: '4px', boxShadow: `0 0 8px ${color}60` }}
                    />
                </div>
            </div>
        </div>
    );
});
