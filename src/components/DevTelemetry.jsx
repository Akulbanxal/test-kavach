import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DevTelemetry({ callActive }) {
  const [isOpen, setIsOpen] = useState(false);
  const [telemetry, setTelemetry] = useState({
    inferenceTime: 0,
    fftTime: 0,
    fps: 0,
    droppedFrames: 0,
    backend: 'heuristics-fallback',
    modelVersion: 'v3.1.0-onnx',
    bufferSize: 0,
    memory: 84
  });

  useEffect(() => {
    const handleScore = (e) => {
      const detail = e.detail || {};
      if (detail.telemetry) {
        setTelemetry(detail.telemetry);
      }
    };

    globalThis.addEventListener('deepfake-score', handleScore);
    return () => {
      globalThis.removeEventListener('deepfake-score', handleScore);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
        marginTop: 16,
      }}
    >
      {/* Clickable Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          background: '#F8FAFC',
          borderBottom: isOpen ? '1.5px solid #E2E8F0' : 'none',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>⚙️</span>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            color: '#475569', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace'
          }}>
            Developer Telemetry
          </span>
        </div>
        <span style={{
          fontSize: 10, color: '#94A3B8',
          fontFamily: 'monospace',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▶
        </span>
      </div>

      {/* Collapsible Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: '#0F172A',
              padding: '16px 20px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#38BDF8',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 24px',
            }}>
              <div>
                <span style={{ color: '#64748B' }}>INFERENCE_TIME:</span>{' '}
                <span style={{ color: '#38BDF8' }}>{callActive ? `${telemetry.inferenceTime} ms` : '0 ms'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>FFT_TIME:</span>{' '}
                <span style={{ color: '#38BDF8' }}>{callActive ? `${telemetry.fftTime} ms` : '0 ms'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>CURRENT_FPS:</span>{' '}
                <span style={{ color: '#34D399' }}>{callActive ? `${telemetry.fps} Hz` : '0 Hz'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>DROPPED_FRAMES:</span>{' '}
                <span style={{ color: telemetry.droppedFrames > 0 ? '#F87171' : '#38BDF8' }}>
                  {telemetry.droppedFrames}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>CONTEXT_BUFFER:</span>{' '}
                <span style={{ color: '#38BDF8' }}>{callActive ? (telemetry.currentContextBuffer || '0.0s / 0 smpl') : '0.0s / 0 smpl'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>ONNX_BACKEND:</span>{' '}
                <span style={{ color: '#F1F5F9', fontSize: 10 }}>{telemetry.backend}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>MODEL_STATUS:</span>{' '}
                <span style={{ color: telemetry.modelStatus === 'failed' ? '#F87171' : telemetry.modelStatus === 'loaded' ? '#34D399' : '#38BDF8' }}>
                  {telemetry.modelStatus || 'unloaded'}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>MODEL_LOADED:</span>{' '}
                <span style={{ color: telemetry.modelLoaded ? '#34D399' : '#64748B' }}>{telemetry.modelLoaded ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>MODEL_VERSION:</span>{' '}
                <span style={{ color: '#F1F5F9' }}>{telemetry.modelVersion}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>HEAP_MEMORY:</span>{' '}
                <span style={{ color: '#F59E0B' }}>{telemetry.memory} MB</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
