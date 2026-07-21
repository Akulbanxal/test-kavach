import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVoiceEnrollments, deleteVoiceEnrollment } from '../ai/db.js';
import { startEnrollment, stopEnrollment, loadEnrolledVoices } from '../ai/model-runner.js';

export default function TrustedVoices({ callActive }) {
  const [nameInput, setNameInput] = useState('');
  const [enrolledList, setEnrolledList] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [identityMatch, setIdentityMatch] = useState(null);

  // Load enrolled templates from DB
  const loadTemplates = async () => {
    try {
      const list = await getVoiceEnrollments();
      setEnrolledList(list || []);
    } catch (err) {
      console.error("[Trusted Voices] Failed to load voice templates:", err);
    }
  };

  useEffect(() => {
    loadTemplates();

    // 1. Listen for deepfake-score identity matches
    const scoreHandler = (e) => {
      if (!callActive) {
        setIdentityMatch(null);
        return;
      }
      const detail = e.detail || {};
      if (detail.identityMatch) {
        setIdentityMatch(detail.identityMatch);
      }
    };

    // 2. Listen for enrollment progress
    const progressHandler = (e) => {
      const detail = e.detail || {};
      setIsRecording(true);
      setProgress(detail.progress || 0);
      setProgressText(`Recording... ${Math.round(detail.progress)}% (${detail.framesCollected}/20 frames)`);
    };

    // 3. Listen for enrollment complete
    const completeHandler = (e) => {
      const detail = e.detail || {};
      setIsRecording(false);
      setProgress(0);
      setProgressText('');
      setNameInput('');
      loadTemplates();
      if (detail.success) {
        console.log(`[Trusted Voices] Voice print '${detail.name}' enrolled successfully!`);
      } else {
        alert(`Enrollment failed: ${detail.error}`);
      }
    };

    globalThis.addEventListener('deepfake-score', scoreHandler);
    globalThis.addEventListener('voice-enrollment-progress', progressHandler);
    globalThis.addEventListener('voice-enrollment-complete', completeHandler);

    return () => {
      globalThis.removeEventListener('deepfake-score', scoreHandler);
      globalThis.removeEventListener('voice-enrollment-progress', progressHandler);
      globalThis.removeEventListener('voice-enrollment-complete', completeHandler);
    };
  }, [callActive]);

  const handleEnroll = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsRecording(true);
    setProgress(0);
    setProgressText('Preparing stream...');
    startEnrollment(nameInput.trim());
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoiceEnrollment(id);
      loadTemplates();
      loadEnrolledVoices();
    } catch (err) {
      console.error("[Trusted Voices] Failed to delete print:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 24,
        padding: 24,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 16,
      }}
    >
      {/* Top visual accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: '#10B981',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 800, color: '#0F172A',
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em',
          }}>
            Trusted Voices
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Identity Verification Registry
          </div>
        </div>

        {/* Verification Status Badge */}
        {callActive && (
          <div style={{
            background: identityMatch?.verified ? '#ECFDF5' : '#F1F5F9',
            border: `1.5px solid ${identityMatch?.verified ? '#A7F3D0' : '#E2E8F0'}`,
            borderRadius: 99, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: identityMatch?.verified ? '#10B981' : '#64748B',
            }} />
            <span style={{
              fontSize: 9.5, fontWeight: 700,
              color: identityMatch?.verified ? '#059669' : '#475569',
              fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
            }}>
              {identityMatch?.verified ? 'Verified' : 'Unknown'}
            </span>
          </div>
        )}
      </div>

      {/* Identity match feedback banner during active calls */}
      {callActive && (
        <div style={{
          background: identityMatch?.verified ? '#F0FDF4' : '#F8FAFC',
          border: `1px solid ${identityMatch?.verified ? 'rgba(16,185,129,0.15)' : '#E2E8F0'}`,
          borderRadius: 14, padding: '12px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
          gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>{identityMatch?.verified ? '🛡️' : '👤'}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
              color: '#94A3B8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace'
            }}>
              Identity Match
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: identityMatch?.verified ? '#15803D' : '#475569',
              marginTop: 1,
            }}>
              {identityMatch?.verified ? identityMatch.name : 'Unknown Caller'}
            </div>
          </div>
          {identityMatch && (
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: identityMatch.verified ? '#16A34A' : '#64748B',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {Math.round(identityMatch.similarity * 100)}%
              </span>
              <div style={{ fontSize: 8.5, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>Match</div>
            </div>
          )}
        </div>
      )}

      {/* Enrollment input form */}
      {!isRecording ? (
        <form onSubmit={handleEnroll} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Name (e.g. Mother, Father, Self)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={!callActive}
            style={{
              flex: 1,
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              color: '#0F172A',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12.5,
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              opacity: callActive ? 1 : 0.5,
              cursor: callActive ? 'text' : 'not-allowed',
            }}
          />
          <button
            type="submit"
            disabled={!callActive || !nameInput.trim()}
            style={{
              padding: '0 16px',
              borderRadius: 10,
              background: (callActive && nameInput.trim()) ? '#10B981' : '#F1F5F9',
              color: (callActive && nameInput.trim()) ? '#FFFFFF' : '#94A3B8',
              fontWeight: 700,
              fontSize: 12,
              border: 'none',
              cursor: (callActive && nameInput.trim()) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            Enroll
          </button>
        </form>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 6,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#10B981',
              fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
            }}>
              Attribution Sampling
            </span>
            <span style={{
              fontSize: 10.5, color: '#64748B',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {progressText}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
              style={{
                height: '100%',
                background: '#10B981',
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      )}

      {/* Enrolled Trusted templates registry list */}
      <div>
        <div style={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em',
          color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase', marginBottom: 10,
        }}>
          Enrolled Voice Templates ({enrolledList.length})
        </div>

        {enrolledList.length === 0 ? (
          <div style={{
            fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic',
            textAlign: 'center', padding: '14px 0', border: '1.5px dashed #F1F5F9',
            borderRadius: 14,
          }}>
            {!callActive ? 'Start call and enroll a trusted voice print.' : 'Type a name above and speak to enroll a voice.'}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            maxHeight: 110, overflowY: 'auto', paddingRight: 4,
          }}>
            {enrolledList.map((voice) => (
              <div
                key={voice.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  borderRadius: 10, padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>🗣️</span>
                  <span style={{
                    fontSize: 12.5, fontWeight: 700, color: '#334155',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {voice.name}
                  </span>
                  <span style={{
                    fontSize: 9, color: '#10B981', background: '#ECFDF5',
                    padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                  }}>
                    Verified Template
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(voice.id)}
                  style={{
                    border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 12, padding: 4,
                    color: '#94A3B8', transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#EF4444')}
                  onMouseLeave={(e) => (e.target.style.color = '#94A3B8')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
