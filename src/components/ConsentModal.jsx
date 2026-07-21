import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ConsentModal — shown before getUserMedia is called.
 * Informs the user that audio will be transcribed and sent to Google Gemini.
 * Required before startSecureCall() + startAnalysis() are invoked.
 */
export default function ConsentModal({ onAccept, onDecline }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 24px 80px rgba(15,23,42,0.22), 0 4px 16px rgba(15,23,42,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header accent */}
          <div style={{
            height: 4,
            background: 'linear-gradient(90deg, #2563EB, #06B6D4, #8B5CF6)',
          }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {/* Icon + Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                  Audio Recording Consent
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  Required before session starts
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.65, margin: 0 }}>
                By starting this session, you agree that:
              </p>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
                <li>Your microphone audio will be <strong>streamed and transcribed</strong> via Google Cloud Speech-to-Text.</li>
                <li>Transcripts will be <strong>sent to Google Gemini AI</strong> for real-time fraud analysis.</li>
                <li>No audio is stored on our servers. Transcripts are processed in-flight and discarded.</li>
                <li>This is a <strong>hackathon demo</strong> — not a production compliance-certified product.</li>
              </ul>
            </div>

            {/* Privacy link */}
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 20, lineHeight: 1.5 }}>
              Read our full{' '}
              <a
                href="https://github.com/swapnilyt1234/Kavach-AI/blob/main/PRIVACY.md"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
              >
                Privacy Policy
              </a>{' '}
              before proceeding.
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onDecline}
                style={{
                  flex: 1, padding: '12px 0',
                  borderRadius: 10,
                  background: '#F1F5F9',
                  color: '#64748B',
                  fontWeight: 700, fontSize: 13.5,
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
              >
                Cancel
              </button>
              <motion.button
                onClick={onAccept}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 2, padding: '12px 0',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#fff',
                  fontWeight: 700, fontSize: 13.5,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                  letterSpacing: '0.01em',
                }}
              >
                I Understand — Start Session
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
