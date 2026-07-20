import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Stable layout constants ───────────────────────────────────────────────────
const BAR_COUNT    = 48;
const BAR_DELAYS   = Array.from({ length: BAR_COUNT }, (_, i) => (i / BAR_COUNT) * 0.6);
const BAR_SPEEDS   = Array.from({ length: BAR_COUNT }, () => 0.35 + Math.random() * 0.65);
const BAR_BASE_H   = Array.from({ length: BAR_COUNT }, () => 0.08 + Math.random() * 0.35);

// ── Real-time waveform that reacts to mic amplitude ───────────────────────────
function LiveWaveform({ active, threatLevel, amplitude }) {
  const bars = BAR_COUNT;
  const amp  = Math.max(0.08, amplitude || 0.08);

  const trackColor = threatLevel === 'CRITICAL' ? '#FECACA'
    : threatLevel === 'HIGH' ? '#FEF3C7'
    : '#DBEAFE';

  const fillColor = threatLevel === 'CRITICAL' ? '#EF4444'
    : threatLevel === 'HIGH' ? '#F59E0B'
    : '#2563EB';

  const glowColor = threatLevel === 'CRITICAL' ? 'rgba(239,68,68,0.35)'
    : threatLevel === 'HIGH' ? 'rgba(245,158,11,0.30)'
    : 'rgba(37,99,235,0.25)';

  const label = active
    ? (threatLevel === 'CRITICAL' ? '⚠ THREAT · LIVE' : threatLevel === 'HIGH' ? '▲ SUSPICIOUS · LIVE' : '● ANALYZING · LIVE')
    : '○ STANDBY';

  const labelColor = threatLevel === 'CRITICAL' ? '#DC2626'
    : threatLevel === 'HIGH' ? '#D97706'
    : active ? '#2563EB' : '#94A3B8';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
      border: `1.5px solid ${active ? fillColor + '30' : '#E2E8F0'}`,
      borderRadius: 16,
      padding: '18px 20px 14px',
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: active
        ? `inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px ${fillColor}15, 0 4px 20px ${glowColor}`
        : 'inset 0 1px 0 rgba(255,255,255,0.8)',
      transition: 'border-color 0.4s, box-shadow 0.5s',
    }}>
      {/* Subtle bg shimmer when active */}
      {active && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${fillColor}06 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' }}>
        {/* Animated dot */}
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          {active && (
            <div style={{
              position: 'absolute', inset: -3, borderRadius: '50%',
              background: fillColor,
              opacity: 0.25,
              animation: 'pulse-ring 1.4s ease-out infinite',
            }} />
          )}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: active ? fillColor : '#CBD5E1',
            boxShadow: active ? `0 0 8px ${fillColor}` : 'none',
            animation: active ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
            transition: 'background 0.4s, box-shadow 0.4s',
          }} />
        </div>

        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
          color: labelColor, fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase', transition: 'color 0.4s',
        }}>{label}</span>

        <div style={{ flex: 1 }} />

        {active && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: fillColor + '10',
            border: `1px solid ${fillColor}25`,
            borderRadius: 99, padding: '2px 10px',
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span style={{ fontSize: 9, color: fillColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
              WebRTC
            </span>
          </div>
        )}
      </div>

      {/* Waveform bars */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        height: 64, position: 'relative',
      }}>
        {Array.from({ length: bars }).map((_, i) => {
          const baseH  = BAR_BASE_H[i];
          const speed  = BAR_SPEEDS[i];
          const delay  = BAR_DELAYS[i];
          const targetH = active ? baseH * amp * 3.5 : 0.04;

          return (
            <div key={i} style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '100%',
                borderRadius: 3,
                transformOrigin: 'center',
                background: active
                  ? `linear-gradient(to top, ${fillColor}, ${fillColor}70)`
                  : trackColor,
                boxShadow: active ? `0 0 3px ${fillColor}40` : 'none',
                height: `${Math.min(100, targetH * 100)}%`,
                minHeight: 2,
                animationName: active ? 'waveform' : 'none',
                animationDuration: `${speed}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${delay}s`,
                transition: 'background 0.5s, box-shadow 0.4s, height 0.3s',
              }} />
            </div>
          );
        })}
      </div>

      {/* Bottom status bar */}
      {active && (
        <div style={{
          marginTop: 10, display: 'flex', gap: 12, alignItems: 'center',
          borderTop: `1px solid ${fillColor}15`, paddingTop: 10,
        }}>
          <span style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
            Listening to voice stream...
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
            Analyzing voice signature...
          </span>
        </div>
      )}
    </div>
  );
}

// ── Pulse Rings around mic orb ────────────────────────────────────────────────
function PulseRings({ active, color }) {
  if (!active) return null;
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          inset: -(i * 9),
          borderRadius: '50%',
          border: `1px solid ${color}${Math.round(40 / i).toString(16).padStart(2, '0')}`,
          animation: `pulse-ring ${0.8 + i * 0.35}s ease-out infinite`,
          animationDelay: `${i * 0.18}s`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

// ── Telemetry Card ────────────────────────────────────────────────────────────
function TelCard({ label, value, unit, color, active }) {
    return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(145deg, #FFFFFF, #F8FAFC)',
      border: `1px solid ${active ? color + '25' : '#E2E8F0'}`,
      borderRadius: 12,
      padding: '11px 12px',
      boxShadow: active ? `0 2px 10px ${color}15` : '0 1px 3px rgba(15,23,42,0.04)',
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontSize: 17, fontWeight: 800,
        color: active ? color : '#CBD5E1',
        fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
        transition: 'color 0.4s',
      }}>
        {value}<span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2, fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CallPanel({
  callActive, threatLevel, onStart, onEnd, onSimulateAttack, locked,
  latency, packetInteg, entropy, amplitude,
}) {
  const isActive   = callActive;
  const threat     = threatLevel || 'SAFE';

  const primaryColor = threat === 'CRITICAL' ? '#DC2626'
    : threat === 'HIGH' ? '#F59E0B'
    : '#2563EB';

  const cardBorderColor = isActive && threat === 'CRITICAL'
    ? '#FECACA'
    : isActive && threat === 'HIGH'
    ? '#FDE68A'
    : '#E2E8F0';

  const cardShadow = isActive && threat === 'CRITICAL'
    ? '0 0 0 1px #FECACA, 0 8px 40px rgba(220,38,38,0.12), 0 2px 8px rgba(15,23,42,0.06)'
    : isActive
    ? `0 0 0 1px ${primaryColor}20, 0 8px 32px rgba(37,99,235,0.08), 0 2px 8px rgba(15,23,42,0.05)`
    : '0 4px 20px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04)';

  return (
    <motion.div
      animate={isActive && threat === 'CRITICAL' ? { x: [0, -1.5, 1.5, -1, 1, 0] } : { x: 0 }}
      transition={{ duration: 0.5, repeat: isActive && threat === 'CRITICAL' ? Infinity : 0, repeatDelay: 2 }}
      style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)',
        border: `1.5px solid ${cardBorderColor}`,
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: cardShadow,
        transition: 'border-color 0.4s, box-shadow 0.6s',
      }}
    >
      {/* Top gradient accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: isActive && threat === 'CRITICAL'
          ? 'linear-gradient(90deg, #DC2626, #EF4444, #DC2626)'
          : isActive && threat === 'HIGH'
          ? 'linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)'
          : 'linear-gradient(90deg, #2563EB, #06B6D4, #2563EB)',
        backgroundSize: '200% 100%',
        animation: 'gradient-shift 3s linear infinite',
        borderRadius: '24px 24px 0 0',
        opacity: isActive ? 1 : 0.3,
        transition: 'opacity 0.4s',
      }} />

      {/* Subtle inner glow when critical */}
      {isActive && threat === 'CRITICAL' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 60%)',
          pointerEvents: 'none', borderRadius: 24,
        }} />
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 800, color: '#0F172A',
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em',
          }}>
            Scam Signature Monitor
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Voice Signature Verification
          </div>
        </div>

        {/* Mic orb */}
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <PulseRings active={isActive} color={primaryColor} />
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: isActive
              ? `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08)`
              : 'linear-gradient(135deg, #F1F5F9, #E2E8F0)',
            border: `2px solid ${isActive ? primaryColor + '50' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isActive ? `0 0 20px ${primaryColor}30, inset 0 1px 0 rgba(255,255,255,0.6)` : 'inset 0 1px 0 rgba(255,255,255,0.8)',
            transition: 'all 0.5s ease',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={isActive ? primaryColor : '#94A3B8'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'stroke 0.4s' }}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Live Waveform ── */}
      <LiveWaveform active={isActive} threatLevel={threat} amplitude={amplitude} />

      {/* ── Telemetry row ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TelCard label="Latency"   value={isActive ? latency    : '--'} unit="ms"   color="#2563EB" active={isActive} />
        <TelCard label="Integrity" value={isActive ? packetInteg : '--'} unit="%"    color="#10B981" active={isActive} />
        <TelCard label="Entropy"   value={isActive ? entropy    : '--'} unit="b"    color="#8B5CF6" active={isActive} />
        <TelCard label="Stream"    value={isActive ? 'E2E'      : 'OFF'} unit=""     color={isActive ? '#10B981' : '#94A3B8'} active={isActive} />
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!isActive ? (
          <motion.button
            id="start-call-btn"
            onClick={onStart}
            disabled={locked}
            whileHover={{ scale: locked ? 1 : 1.02, y: locked ? 0 : -2 }}
            whileTap={{ scale: locked ? 1 : 0.98 }}
            style={{
              width: '100%', padding: '14px 0',
              borderRadius: 12,
              background: locked
                ? 'linear-gradient(135deg, #F1F5F9, #E2E8F0)'
                : 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
              color: locked ? '#94A3B8' : '#fff',
              fontWeight: 700, fontSize: 14,
              border: 'none',
              cursor: locked ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: locked ? 'none' : '0 6px 20px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.17 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Start Secure Call
          </motion.button>
        ) : (
          <motion.button
            id="end-call-btn"
            onClick={onEnd}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '14px 0',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(220,38,38,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6.33-6.32A19.79 19.79 0 011.77 4.17 2 2 0 013.72 2H6.7a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.19 8.91"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            End Call
          </motion.button>
        )}

        {/* 2x2 Scam Simulation Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 4,
        }}>
          {[
            { id: 'police', label: 'Police Scam', icon: '🚔' },
            { id: 'rbi', label: 'RBI Scam', icon: '🏦' },
            { id: 'family', label: 'Voice Clone', icon: '👥' },
            { id: 'kyc', label: 'KYC Fraud', icon: '📋' },
          ].map((scam) => {
            const isClickable = !locked && isActive;
            return (
              <motion.button
                key={scam.id}
                id={`simulate-${scam.id}-btn`}
                // Maintain simulate-attack-btn on the first one for automated scripting/compat if needed
                {...(scam.id === 'police' ? { id: 'simulate-attack-btn' } : {})}
                onClick={() => onSimulateAttack(scam.id)}
                disabled={!isClickable}
                whileHover={{ scale: isClickable ? 1.02 : 1, y: isClickable ? -1 : 0 }}
                whileTap={{ scale: isClickable ? 0.98 : 1 }}
                style={{
                  padding: '12px 8px',
                  borderRadius: 12,
                  background: isClickable
                    ? 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.03))'
                    : '#F8FAFC',
                  color: isClickable ? '#2563EB' : '#CBD5E1',
                  fontWeight: 700, fontSize: 12.5,
                  cursor: isClickable ? 'pointer' : 'not-allowed',
                  border: `1.5px solid ${isClickable ? 'rgba(37,99,235,0.2)' : '#E2E8F0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  boxShadow: isClickable ? '0 2px 8px rgba(37,99,235,0.06)' : 'none',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
              >
                <span>{scam.icon}</span>
                <span>{scam.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
