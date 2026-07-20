import React from 'react';
import { motion } from 'framer-motion';

interface ManipulationBadgeProps {
    technique: string;
}

export const ManipulationBadge: React.FC<ManipulationBadgeProps> = React.memo(({ technique }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '5px 12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.02em',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)'
            }}
        >
            <span style={{ marginRight: '4px' }}>⚠</span>
            {technique}
        </motion.div>
    );
});
