import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToExplainability } from '../ai/explainability.js';

export default function AIEvidence({ callActive }) {
  const [explainability, setExplainability] = useState(null);

  useEffect(() => {
    if (!callActive) {
      setExplainability(null);
      return;
      }

    const unsubscribe = subscribeToExplainability((data) => {
      setExplainability(data);
    });

    return unsubscribe;
  }, [callActive]);

  // Default values for standby state
  const defaultFeatures = {
    pitchStability: { label: 'Pitch Stability', value: 0, contribution: 0 },
    entropy: { label: 'Entropy', value: 0, contribution: 0 },
    spectralFlatness: { label: 'Spectral Flatness', value: 0, contribution: 0 },
    highFrequencyLeakage: { label: 'High Frequency Leakage', value: 0, contribution: 0 },
    voiceSimilarity: { label: 'Voice Similarity', value: 0, contribution: 0 },
  };

  const data = explainability || defaultFeatures;

  const cardBorderColor = '#E2E8F0';
  const cardShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${cardBorderColor}`,
        borderRadius: 24,
        padding: 24,
        boxShadow: cardShadow,
        transition: 'border-color 0.25s, box-shadow 0.25s',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 16,
      }}
    >
      {/* Top micro accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: '#475569',
        opacity: callActive ? 1 : 0.25,
        transition: 'opacity 0.25s',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 800, color: '#0F172A',
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em',
          }}>
            AI Evidence
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Real-time Feature Attribution
          </div>
        </div>

        {/* Live / Standby status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: callActive ? '#F1F5F9' : '#F8FAFC',
          border: `1.5px solid ${callActive ? '#E2E8F0' : '#F1F5F9'}`,
          borderRadius: 99, padding: '4px 12px',
          transition: 'all 0.25s',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: callActive ? '#475569' : '#CBD5E1',
            transition: 'all 0.25s',
          }} />
          <span style={{
            fontSize: 9.5, fontWeight: 700,
            color: callActive ? '#475569' : '#94A3B8',
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {callActive ? 'Active' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Feature Contributions List */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        opacity: callActive ? 1 : 0.45,
        transition: 'opacity 0.25s ease-in-out',
      }}>
        {Object.keys(data).map((key) => {
          const item = data[key];
          const valPct = item.value * 100;
          return (
            <div key={key}>
              {/* Row: Name and Values */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#334155',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {item.label}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 10.5, color: '#64748B',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 500
                  }}>
                    {item.value.toFixed(2)}
                  </span>
                  
                  <span style={{
                    fontSize: 10, color: '#475569',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    background: '#F1F5F9', padding: '2px 6px', borderRadius: 4
                  }}>
                    {item.contribution.toFixed(1)}% contr.
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div style={{ height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${Math.min(100, Math.max(0, valPct))}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: '#64748B',
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
