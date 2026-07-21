import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StreamingTimeline({ callActive, locked, riskState, amplitude }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!callActive) return;

    const scoreHandler = () => {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 250);
      return () => clearTimeout(timer);
    };

    globalThis.addEventListener('deepfake-score', scoreHandler);
    return () => {
      globalThis.removeEventListener('deepfake-score', scoreHandler);
    };
  }, [callActive]);

  // Define the 8 pipeline stages
  const getStages = () => {
    const isSpeaking = callActive && amplitude > 0.15;
    
    return [
      {
        id: 'start',
        label: 'Call Started',
        active: callActive,
        color: '#3B82F6',
        desc: callActive ? 'Secure VoIP Socket Connected' : 'Session Inactive',
        type: 'state'
      },
      {
        id: 'dsp',
        label: 'DSP Initialized',
        active: callActive,
        color: '#10B981',
        desc: callActive ? '16kHz Audio Resampling Active' : 'Filter Banks Standby',
        type: 'state'
      },
      {
        id: 'voice',
        label: 'Voice Activity',
        active: callActive,
        color: isSpeaking ? '#10B981' : '#64748B',
        desc: callActive ? (isSpeaking ? 'Acoustic Frame Captured' : 'Silence Gate Active') : 'Standby',
        type: 'state'
      },
      {
        id: 'spectrogram',
        label: 'Spectrogram Generated',
        active: callActive && pulse,
        color: '#06B6D4',
        desc: callActive ? (pulse ? 'Mel-Spectrogram Calculated' : 'Idle Buffer') : 'Standby',
        type: 'pulse'
      },
      {
        id: 'onnx',
        label: 'ONNX Inference',
        active: callActive && pulse,
        color: '#8B5CF6',
        desc: callActive ? (pulse ? 'Neural Classification Run' : 'Idle Buffer') : 'Standby',
        type: 'pulse'
      },
      {
        id: 'evidence',
        label: 'Evidence Calculated',
        active: callActive && pulse,
        color: '#F59E0B',
        desc: callActive ? (pulse ? 'Attribution Vectors Output' : 'Idle Buffer') : 'Standby',
        type: 'pulse'
      },
      {
        id: 'risk',
        label: 'Risk Updated',
        active: callActive,
        color: riskState === 'LOCKDOWN' || riskState === 'CONFIRMED' ? '#EF4444' : riskState === 'SUSPICIOUS' ? '#F59E0B' : '#10B981',
        desc: callActive ? `Threat Level State: ${riskState}` : 'Standby',
        type: 'state'
      },
      {
        id: 'lockdown',
        label: 'Lockdown',
        active: locked,
        color: '#EF4444',
        desc: locked ? 'ACCESS TERMINATED — PROTOCOL RED' : 'Armed',
        type: 'lockdown'
      }
    ];
  };

  const stages = getStages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 24,
        padding: '22px 24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        marginTop: 16,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Visual Accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: '#3B82F6',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{
            fontSize: 15, fontWeight: 800, color: '#0F172A',
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em',
          }}>
            Pipeline Streaming Audit
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Real-time DSP & Neural Event Flow
          </div>
        </div>

        {/* Visual SOC Node ID */}
        <span style={{
          fontSize: 9, fontWeight: 700, color: '#94A3B8',
          fontFamily: 'JetBrains Mono, monospace', background: '#F1F5F9',
          padding: '2px 8px', borderRadius: 4
        }}>
          SOC-PIPELINE-01
        </span>
      </div>

      {/* Timeline nodes container */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* Continuous vertical linking track */}
        <div style={{
          position: 'absolute', left: 7, top: 8, bottom: 8, width: 2,
          background: '#E2E8F0',
          zIndex: 1,
        }} />

        {stages.map((stage, index) => {
          const isGlowing = stage.active;
          const nodeColor = isGlowing ? stage.color : '#E2E8F0';
          const isPulseType = stage.type === 'pulse';
          const isLockdown = stage.type === 'lockdown';
          
          return (
            <div key={stage.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', zIndex: 2 }}>
              
              {/* Timeline circle node */}
              <div style={{ position: 'relative', width: 16, height: 16, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{
                    scale: isGlowing ? (isPulseType ? [1, 1.25, 1] : 1) : 1,
                    background: nodeColor,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#E2E8F0',
                  }}
                />

                {/* Outer pulsing ring for active animations */}
                {isGlowing && (isPulseType || isSpeakingActivity(stage.id, amplitude) || (isLockdown && locked)) && (
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: isLockdown ? 1.2 : 0.8, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', width: 14, height: 14,
                      borderRadius: '50%', border: `1.5px solid ${stage.color}`,
                    }}
                  />
                )}
              </div>

              {/* Text Label & Monospace Status description */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: isGlowing ? 700 : 500,
                  color: isGlowing ? '#1E293B' : '#64748B',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.3s'
                }}>
                  {stage.label}
                </div>
                <div style={{
                  fontSize: 10, color: isGlowing ? (isLockdown ? '#EF4444' : '#475569') : '#94A3B8',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: 2,
                  transition: 'all 0.3s'
                }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function isSpeakingActivity(id, amp) {
  return id === 'voice' && amp > 0.15;
}
