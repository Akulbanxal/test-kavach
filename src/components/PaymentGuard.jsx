import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCORING_CONFIG } from '../ai/scoringConfig';

export default function PaymentGuard({ riskScore, triggeredRules, scamCategory, summary, onConfirm, onCancel, onViewReport }) {
    const [acknowledged, setAcknowledged] = useState(false);

    if (riskScore < SCORING_CONFIG.PAYMENT_CONFIRM_THRESHOLD) return null;

    const isBlock = riskScore >= SCORING_CONFIG.PAYMENT_BLOCK_THRESHOLD;
    const isStrongConfirm = riskScore >= SCORING_CONFIG.PAYMENT_STRONG_CONFIRM_THRESHOLD && !isBlock;
    const isWarning = riskScore >= SCORING_CONFIG.PAYMENT_CONFIRM_THRESHOLD && !isStrongConfirm && !isBlock;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    style={{
                        background: '#FFFFFF',
                        borderRadius: 24,
                        width: '100%', maxWidth: 520,
                        boxShadow: '0 24px 50px rgba(0,0,0,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    {isWarning && (
                        <div style={{ padding: '32px' }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Potential Scam Detected</h2>
                            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                                Our AI detected several suspicious indicators during your ongoing conversation. Please verify the caller independently before transferring money.
                            </p>
                            
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 32, border: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Why was this flagged?</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {triggeredRules?.map((rule, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>✓</span>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{rule.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#F1F5F9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel Transaction</button>
                                <button onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#F59E0B', color: '#FFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Continue Payment</button>
                            </div>
                        </div>
                    )}

                    {isStrongConfirm && (
                        <div style={{ padding: '32px' }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>🛡</div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>High-Risk Transaction</h2>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Threat Score</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>{riskScore.toFixed(0)}%</div>
                                </div>
                                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Category</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{scamCategory}</div>
                                </div>
                            </div>

                            <p style={{ color: '#475569', fontSize: 14, fontStyle: 'italic', marginBottom: 20 }}>{summary}</p>

                            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #FECACA' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Why was this flagged?</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {triggeredRules?.map((rule, idx) => (
                                        <div key={idx}>
                                            <div style={{ fontWeight: 700, color: '#991B1B', fontSize: 14 }}>{rule.title}</div>
                                            <div style={{ fontSize: 13, color: '#7F1D1D', marginTop: 2 }}>{rule.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, cursor: 'pointer' }}>
                                <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} style={{ width: 20, height: 20, cursor: 'pointer' }} />
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>I understand the risks and still wish to continue with this transaction.</span>
                            </label>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#F1F5F9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel Transaction</button>
                                <button onClick={onConfirm} disabled={!acknowledged} style={{ flex: 1, padding: '14px', borderRadius: 12, background: acknowledged ? '#DC2626' : '#E2E8F0', color: acknowledged ? '#FFF' : '#94A3B8', fontWeight: 700, border: 'none', cursor: acknowledged ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                                    Continue Payment
                                </button>
                            </div>
                        </div>
                    )}

                    {isBlock && (
                        <div style={{ padding: '32px' }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>🚨</div>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#991B1B', marginBottom: 12 }}>Transaction Blocked</h2>
                            <p style={{ color: '#7F1D1D', lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>
                                This transaction has been blocked because our AI detected multiple high-confidence indicators of financial fraud.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 12, border: '1px solid #FECACA' }}>
                                    <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>Threat Score</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#991B1B' }}>{riskScore.toFixed(0)}%</div>
                                </div>
                                <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 12, border: '1px solid #FECACA' }}>
                                    <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>Category</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B' }}>{scamCategory}</div>
                                </div>
                            </div>

                            <p style={{ color: '#475569', fontSize: 14, fontStyle: 'italic', marginBottom: 20 }}>{summary}</p>

                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 32, border: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Detected indicators:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {triggeredRules?.map((rule, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <span style={{ color: '#DC2626', fontWeight: 'bold' }}>✓</span>
                                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>{rule.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button onClick={onViewReport} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#DC2626', color: '#FFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}>View Investigation Report</button>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#F1F5F9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel Transaction</button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
