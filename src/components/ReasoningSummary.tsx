import React from 'react';
import { motion } from 'framer-motion';

interface ReasoningSummaryProps {
    scamCategory: string;
    callerIntent: string;
    urgencyLevel: string;
    manipulationTechniques: string[];
}

export const ReasoningSummary: React.FC<ReasoningSummaryProps> = React.memo(({ scamCategory, callerIntent, urgencyLevel, manipulationTechniques }) => {
    
    if (scamCategory === 'Unknown' && callerIntent === 'Unknown') {
        return (
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>
                Analyzing conversation for threats...
            </div>
        );
    }

    const techniquesText = manipulationTechniques.length > 0 
        ? `and attempted to manipulate the victim using ${manipulationTechniques.join(', ').toLowerCase()}`
        : 'to influence the victim';

    const text = `The conversation was classified as a ${scamCategory} scam because the caller established an intent of ${callerIntent.toLowerCase()}, created a ${urgencyLevel.toLowerCase()} sense of urgency, ${techniquesText}.`;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={text}
            style={{
                background: 'linear-gradient(to right, #F0F6FF, #F8FAFC)',
                borderLeft: '4px solid #3B82F6',
                padding: '16px 20px',
                borderRadius: '0 12px 12px 0',
                fontSize: '15px',
                lineHeight: 1.65,
                color: '#1E293B',
                fontFamily: 'Inter, sans-serif'
            }}
        >
            <span style={{ fontWeight: 700, color: '#0F172A', marginRight: '6px' }}>AI Conclusion:</span>
            {text}
        </motion.div>
    );
});
