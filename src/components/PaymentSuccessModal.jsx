import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentSuccessModal({ data, onClose }) {
    if (!data) return null;

    const mockTxId = 'TXN' + Math.random().toString().slice(2, 14);
    const timestamp = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 3000,
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
                        width: '100%', maxWidth: 400,
                        boxShadow: '0 24px 50px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        textAlign: 'center',
                        padding: '32px'
                    }}
                >
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: '#10B981', color: '#FFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, margin: '0 auto 20px',
                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                    }}>
                        ✓
                    </div>
                    
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
                        Payment Successful
                    </h2>

                    <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '20px', marginBottom: 24, border: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Recipient</span>
                            <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 700 }}>{data.recipient}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Amount</span>
                            <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 800 }}>₹{data.amount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Time</span>
                            <span style={{ color: '#0F172A', fontSize: 13, fontWeight: 500 }}>{timestamp}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Txn ID</span>
                            <span style={{ color: '#475569', fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>{mockTxId}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12,
                            background: '#F1F5F9', color: '#0F172A',
                            fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.target.style.background = '#E2E8F0'}
                        onMouseOut={e => e.target.style.background = '#F1F5F9'}
                    >
                        Close
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
