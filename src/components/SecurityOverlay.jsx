import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Red-grid background canvas
function ThreatGrid() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(220,38,38,0.07)';
    ctx.lineWidth = 0.5;
    const CELL = 40;
    for (let x = 0; x <= c.width; x += CELL) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
    }
    for (let y = 0; y <= c.height; y += CELL) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }
  }, []);
  return (
    <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.7 }} />
  );
}

export default function SecurityOverlay({ visible, probability, scamMatch, onDismiss }) {
  const pct = Math.round((probability || 0.97) * 100);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ThreatGrid />

          {/* Siren radial pulse */}
          <motion.div
            animate={{ opacity: [0.04, 0.18, 0.04] }}
            transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.24) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          {/* Animated scan line */}
          <motion.div
            animate={{ top: ['-2px', '100vh'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', left: 0, right: 0, height: 2, zIndex: 1,
              background: 'linear-gradient(90deg, transparent 0%, #EF4444 30%, #DC2626 50%, #EF4444 70%, transparent 100%)',
              boxShadow: '0 0 16px rgba(220,38,38,0.6)',
              pointerEvents: 'none',
            }}
          />

          {/* Ghost glitch text */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 72, fontWeight: 900,
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'rgba(220,38,38,0.06)',
            letterSpacing: '-0.02em',
            animation: 'glitch-1 3s ease-in-out infinite',
            userSelect: 'none', pointerEvents: 'none',
            textAlign: 'center',
          }}>SCAM DETECTED</div>

          {/* ── Main Alert Card ── */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ delay: 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative', zIndex: 10,
              background: '#FFFFFF',
              border: '1.5px solid #FECACA',
              borderRadius: 28,
              padding: '38px 48px',
              maxWidth: 500, width: '90vw',
              textAlign: 'center',
              boxShadow: '0 0 0 1px rgba(220,38,38,0.08), 0 12px 64px rgba(220,38,38,0.22), 0 4px 20px rgba(15,23,42,0.08)',
            }}
          >
            {/* Top accent gradient */}
            <motion.div
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: 'linear-gradient(90deg, #DC2626, #EF4444, #F97316, #EF4444, #DC2626)',
                backgroundSize: '300% 100%',
                borderRadius: '28px 28px 0 0',
              }}
            />

            {/* Lock icon */}
            <motion.div
              animate={{ scale: [1, 1.07, 1], boxShadow: ['0 4px 24px rgba(220,38,38,0.18)', '0 8px 36px rgba(220,38,38,0.32)', '0 4px 24px rgba(220,38,38,0.18)'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                border: '1.5px solid #FECACA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </motion.div>

            <div style={{
              display: 'inline-block',
              fontSize: 9.5, fontWeight: 800, letterSpacing: '0.22em',
              color: '#DC2626', fontFamily: 'JetBrains Mono, monospace',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 99, padding: '4px 14px', marginBottom: 12,
            }}>
              ⚠ KAVACH FRAUD ALERT
            </div>

            <h1 style={{
              fontSize: 26, fontWeight: 900, color: '#0F172A',
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8,
            }}>
              Scam Signature<br />Detected
            </h1>

            <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
              A high-risk synthetic/scam voice pattern was matched in this session.
              Access to banking features has been <strong style={{ color: '#DC2626' }}>blocked</strong>.
            </p>

            {/* Scam Profile Details Box */}
            {scamMatch && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(145deg, #FFFDF5, #FFFBEB)',
                  border: '1.5px solid #FDE68A',
                  borderRadius: 16,
                  padding: '12px 18px',
                  marginBottom: 20,
                  textAlign: 'left',
                  boxShadow: '0 2px 12px rgba(245,158,11,0.06)',
                }}
              >
                <div style={{ fontSize: 8.5, fontWeight: 800, color: '#D97706', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Matched Fraud Profile
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: 'Space Grotesk, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🚨</span>
                  <span>{scamMatch.displayName}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, lineHeight: 1.45 }}>
                  {scamMatch.description}
                </div>
              </motion.div>
            )}

            {/* Confidence meter */}
            <div style={{
              background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
              border: '1px solid #FECACA',
              borderRadius: 14, padding: '12px 18px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Signature Match Similarity
                </span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  style={{ fontSize: 24, fontWeight: 900, color: '#DC2626', fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {pct}%
                </motion.span>
              </div>
              <div style={{ height: 6, background: '#FEE2E2', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.25, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #F59E0B, #EF4444, #DC2626)',
                    borderRadius: 99,
                    boxShadow: '0 0 12px rgba(220,38,38,0.6)',
                  }}
                />
              </div>
            </div>

            {/* Status pills */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
              {[
                { icon: '🔒', label: 'Access Suspended' },
                { icon: '📵', label: 'Session Terminated' },
                { icon: '🚨', label: 'Signature Logged' },
              ].map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  style={{
                    fontSize: 10.5, fontWeight: 700, color: '#DC2626',
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 99, padding: '4px 10px',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span>{item.icon}</span> <span>{item.label}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onDismiss}
              whileHover={{ scale: 1.03, y: -2, boxShadow: '0 8px 28px rgba(15,23,42,0.25)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px 32px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                border: 'none', color: '#FFFFFF',
                fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.04em',
                boxShadow: '0 4px 20px rgba(15,23,42,0.22)',
                transition: 'all 0.2s',
              }}
            >
              Clear Alert &amp; Reset Session
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
