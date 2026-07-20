import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BiometricsShield({ callActive, probability, locked }) {
  const [matchScore, setMatchScore] = useState(0);
  const [scanState, setScanState] = useState('IDLE');

  useEffect(() => {
    if (!callActive) { setScanState('IDLE'); setMatchScore(0); return; }
    if (locked) { setScanState('MISMATCH'); setMatchScore(12 + Math.floor(Math.random() * 8)); return; }
    setScanState('SCANNING');
    const t = setTimeout(() => { setScanState('VERIFIED'); setMatchScore(94 + Math.floor(Math.random() * 4)); }, 2500);
    return () => clearTimeout(t);
  }, [callActive, locked]);

  useEffect(() => {
    if (scanState !== 'VERIFIED' || locked) return;
    const i = setInterval(() => setMatchScore(94 + Math.floor(Math.random() * 4)), 2000);
    return () => clearInterval(i);
  }, [scanState, locked]);

  const colors = {
    IDLE: '#94A3B8',
    SCANNING: '#2563EB',
    VERIFIED: '#10B981',
    MISMATCH: '#DC2626',
  };
  const c = colors[scanState];

  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${scanState === 'MISMATCH' ? '#FECACA' : scanState === 'VERIFIED' ? '#A7F3D0' : '#E2E8F0'}`,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Voice Bio-Signature</div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Identity Assurance · Kavach Shield</div>
        </div>
        <div style={{
          padding: '3px 10px', borderRadius: 6,
          background: `${c}12`, border: `1px solid ${c}30`,
          color: c, fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
        }}>{scanState}</div>
      </div>

      {/* Scanner */}
      <div style={{
        position: 'relative', height: 72, background: '#F8FAFC',
        borderRadius: 10, border: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', marginBottom: 12,
      }}>
        {scanState === 'IDLE' && (
          <span style={{ fontSize: 11, color: '#CBD5E1', fontFamily: 'JetBrains Mono, monospace' }}>AWAITING VOICE SIGNATURE</span>
        )}

        {scanState !== 'IDLE' && (
          <>
            {/* Wave bars */}
            <div style={{ position: 'absolute', inset: '0 16px', display: 'flex', alignItems: 'center', gap: 3, opacity: 0.35 }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} style={{ flex: 1, background: c, borderRadius: 2, height: `${20 + Math.sin(i * 0.6) * 50}%`, transition: 'background 0.3s' }} />
              ))}
            </div>
            {/* Scan sweep */}
            {scanState === 'SCANNING' && (
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, zIndex: 2 }}
              />
            )}
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1.5px dashed ${c}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: scanState === 'SCANNING' ? 'shield-rotate 6s linear infinite' : 'none', zIndex: 2 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5">
                {scanState === 'VERIFIED' ? <polyline points="20 6 9 17 4 12" /> : scanState === 'MISMATCH' ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>}
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Info row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>OWNER MATCH</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: c, fontFamily: 'JetBrains Mono, monospace' }}>
            {scanState === 'IDLE' ? '--' : `${matchScore}%`}
          </div>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>PROFILE</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
            {scanState === 'IDLE' ? 'No Stream' : scanState === 'MISMATCH' ? '⚠ Clone Detected' : 'Account Holder'}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {scanState === 'VERIFIED' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 11, color: '#10B981', textAlign: 'center', marginTop: 10, fontWeight: 600 }}>
            ✓ Identity verified — safe to transact
          </motion.div>
        )}
        {scanState === 'MISMATCH' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 11, color: '#DC2626', textAlign: 'center', marginTop: 10, fontWeight: 700 }}>
            ✕ Voiceprint mismatch — access blocked
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
