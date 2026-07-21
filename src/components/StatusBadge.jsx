import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Giant Circular Gauge ──────────────────────────────────────────────────────
function RiskGauge({ probability, threatLevel, trend }) {
  const pct    = Math.round(Math.max(0, Math.min(1, probability)) * 100);
  const r      = 80;
  const circ   = 2 * Math.PI * r;
  const arc    = circ * 0.72;           // 72% of circle
  const offset = arc - (pct / 100) * arc;

  // Zone-based color
  const color = pct > 80 ? '#DC2626'
    : pct > 30 ? '#F59E0B'
    : '#10B981';

  const trackColor = pct > 80 ? '#FEE2E2'
    : pct > 30 ? '#FEF3C7'
    : '#DCFCE7';

  const bgGlow = pct > 80 ? 'rgba(220,38,38,0.12)'
    : pct > 30 ? 'rgba(245,158,11,0.10)'
    : 'rgba(16,185,129,0.08)';

  const statusLabel = pct > 80 ? 'SCAM MATCHED'
    : pct > 30 ? 'SUSPICIOUS'
    : 'SECURE';

  const statusBg = pct > 80 ? '#FEF2F2'
    : pct > 30 ? '#FFFBEB'
    : '#ECFDF5';

  const trendIcon = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→';
  const trendColor = trend === 'rising' ? '#DC2626' : trend === 'falling' ? '#10B981' : '#64748B';
  const trendLabel = trend === 'rising' ? 'Matching' : trend === 'falling' ? 'Fading' : 'Stable';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {/* Outer glow container */}
      <div style={{
        position: 'relative', width: 208, height: 208,
        filter: `drop-shadow(0 0 28px ${bgGlow})`,
      }}>
        {/* Multi-ring decorative halos */}
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          border: `1px solid ${color}12`,
          transition: 'border-color 0.6s',
        }} />
        <div style={{
          position: 'absolute', inset: -18, borderRadius: '50%',
          border: `1px solid ${color}06`,
          transition: 'border-color 0.6s',
        }} />

        {/* SVG gauge — rotated so arc starts from bottom-left */}
        <svg width="208" height="208" viewBox="0 0 208 208"
          style={{ transform: 'rotate(126deg)', position: 'relative', zIndex: 1 }}>
          {/* Background track */}
          <circle cx="104" cy="104" r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ - arc}`}
            style={{ transition: 'stroke 0.5s' }}
          />
          {/* Filled arc */}
          <motion.circle cx="104" cy="104" r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ - arc}`}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
              transition: 'stroke 0.5s',
            }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
          {/* Big percentage */}
          <motion.div
            key={pct}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: 44, fontWeight: 900,
              color, letterSpacing: '-0.03em',
              fontFamily: 'Space Grotesk, sans-serif',
              lineHeight: 1,
              transition: 'color 0.5s',
            }}
          >
            {pct}<span style={{ fontSize: 24, fontWeight: 700 }}>%</span>
          </motion.div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#64748B', fontFamily: 'JetBrains Mono, monospace',
          }}>FRAUD RISK SCORE</div>

          {/* Trend indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
            background: `${trendColor}12`,
            borderRadius: 99, padding: '3px 10px',
            border: `1px solid ${trendColor}20`,
          }}>
            <span style={{ fontSize: 13, color: trendColor }}>{trendIcon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: trendColor, fontFamily: 'JetBrains Mono, monospace' }}>
              {trendLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Status pill */}
      <AnimatePresence mode="wait">
        <motion.div
          key={statusLabel}
          initial={{ scale: 0.8, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          style={{
            padding: '6px 20px', borderRadius: 99,
            background: statusBg,
            border: `1.5px solid ${color}30`,
            color, fontSize: 11, fontWeight: 800,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: `0 2px 10px ${color}20`,
          }}
        >
          {pct > 80 ? '⚠ ' : pct > 30 ? '▲ ' : '✓ '}{statusLabel}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Feature Bar ───────────────────────────────────────────────────────────────
function FeatureBar({ label, value, color, icon }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13 }}>{icon}</span>
          <span style={{ fontSize: 12, color: '#334155', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: `${color}10`, borderRadius: 99, padding: '1px 8px',
          border: `1px solid ${color}20`,
        }}>
          <span style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color}70, ${color})`,
            borderRadius: 99,
            boxShadow: `0 0 6px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StatusBadge({ probability, threatLevel, callActive, features, trend }) {
  const f = features || {};
  const pct = Math.round((probability || 0) * 100);

  const headerColor = !callActive ? '#94A3B8'
    : pct > 80 ? '#DC2626'
    : pct > 30 ? '#D97706'
    : '#10B981';

  const statusText = !callActive ? 'IDLE' : pct > 80 ? 'MATCH FOUND' : 'MONITORING';

  return (
    <div style={{
      background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)',
      border: `1.5px solid ${callActive && pct > 80 ? '#FECACA' : callActive && pct > 30 ? '#FDE68A' : '#E2E8F0'}`,
      borderRadius: 24,
      padding: 24,
      boxShadow: callActive && pct > 80
        ? '0 0 0 1px #FECACA, 0 8px 40px rgba(220,38,38,0.10)'
        : '0 4px 20px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04)',
      transition: 'border-color 0.5s, box-shadow 0.6s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: callActive && pct > 80
          ? 'linear-gradient(90deg, #DC2626, #EF4444)'
          : callActive && pct > 30
          ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
          : 'linear-gradient(90deg, #10B981, #34D399)',
        borderRadius: '24px 24px 0 0',
        opacity: callActive ? 1 : 0.25,
        transition: 'background 0.5s, opacity 0.4s',
      }} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            Fraud Risk Analysis
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Acoustic Anomaly Heuristics
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            {callActive && (
              <div style={{
                position: 'absolute', inset: -3, borderRadius: '50%',
                background: headerColor, opacity: 0.25,
                animation: 'pulse-ring 1.6s ease-out infinite',
              }} />
            )}
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: callActive ? headerColor : '#CBD5E1',
              boxShadow: callActive ? `0 0 8px ${headerColor}` : 'none',
              animation: callActive ? 'pulse-dot 2s ease-in-out infinite' : 'none',
              transition: 'all 0.3s',
            }} />
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 800,
            color: callActive ? headerColor : '#94A3B8',
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
            transition: 'color 0.4s',
          }}>
            {statusText}
          </span>
        </div>
      </div>

      {callActive ? (
        <>
          {/* Giant gauge — hero element */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <RiskGauge probability={probability} threatLevel={threatLevel} trend={trend} />
          </div>

          {/* Acoustic breakdown */}
          <div style={{
            background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
            border: '1px solid #E2E8F0',
            borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: '#94A3B8',
              fontFamily: 'JetBrains Mono, monospace', marginBottom: 12, textTransform: 'uppercase',
            }}>
              Acoustic Heuristics <span style={{ fontWeight: 400, fontSize: 8, letterSpacing: '0.05em', color: '#CBD5E1' }}>(DSP · capped 30%)</span>
            </div>
            <FeatureBar icon="📊" label="Spectral Match Index" value={f.zcr      || 0} color="#3B82F6" />
            <FeatureBar icon="〰" label="Cadence Consistency"  value={f.flatness || 0} color="#8B5CF6" />
            <FeatureBar icon="🎵" label="Robotic Artifacts"    value={f.pitch    || 0} color="#10B981" />
            <FeatureBar icon="🔊" label="Synthesis Index"       value={f.hfRatio  || 0} color="#F59E0B" />
            <FeatureBar icon="🌀" label="Urgency Score"        value={f.entropy  || 0} color="#06B6D4" />
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 0' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)',
            border: '2px dashed #CBD5E1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 2px 8px rgba(15,23,42,0.04)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1', marginBottom: 5 }}>Shield Standby</div>
            <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
              Start a secure banking call to<br/>activate voice scam matching
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
