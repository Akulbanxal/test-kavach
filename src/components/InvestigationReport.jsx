import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function InvestigationReport({ data, logs, onClose }) {
    const reportRef = useRef(null);

    const exportPDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('AI_Investigation_Report.pdf');
        } catch (error) {
            console.error('Failed to export PDF:', error);
        }
    };

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Deduplicate and filter logs for timeline (excluding ok/info unless it's start/end)
    const timelineLogs = logs.filter((l, idx, arr) => {
        if (l.type === 'info' || l.type === 'ok') {
            if (!l.msg.includes('established') && !l.msg.includes('terminated')) return false;
        }
        // Remove exact duplicate consecutive messages
        if (idx > 0 && arr[idx - 1].msg === l.msg) return false;
        return true;
    });

    const getTimelineColor = (type, msg) => {
        if (msg.includes('established')) return '#3B82F6'; // Blue
        if (type === 'threat') return '#DC2626'; // Red
        if (type === 'warn' && msg.includes('suspicious')) return '#F97316'; // Orange
        if (type === 'warn') return '#F59E0B'; // Yellow
        return '#10B981'; // Green
    };

    const isBlocked = data.locked;
    const reportDate = new Date().toLocaleString();
    
    // Deterministic IDs so PDF doesn't re-roll them on render
    const reportMeta = useMemo(() => {
        const hash = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
            return Math.abs(h).toString(16).toUpperCase();
        };
        const idBase = data.summary + data.scamCategory;
        return {
            reportId: `REP-${hash(idBase + '1').padStart(6, '0')}`,
            sessionId: `SES-${hash(idBase + '2').padStart(6, '0')}`,
            latency: data.aiSource === 'Local Fallback' ? '4ms (Deterministic)' : '842ms (Network)'
        };
    }, [data.summary, data.scamCategory, data.aiSource]);

    // Unique Rule Evidence
    const getRuleEvidence = (rule) => {
        if (rule.id === 'AUTH_IMPERSONATION') return "Claimed legal or institutional authority to pressure the victim.";
        if (rule.id === 'OTP_REQUEST') return "Explicitly demanded a secure verification code (OTP).";
        if (rule.id === 'CREDENTIAL_REQUEST') return "Requested sensitive banking PINs, passwords, or card details.";
        if (rule.id === 'PAYMENT_REQUEST') return "Attempted to coerce an immediate financial transfer.";
        if (rule.id === 'HIGH_URGENCY') return "Fabricated an artificial deadline to force compliance.";
        if (rule.id === 'KNOWN_SCAM') return `Matches the acoustic and semantic profile of a ${data.scamCategory}.`;
        if (rule.id === 'MANIPULATION') return `Deployed psychological tactics: ${(data.manipulationTechniques || []).join(', ')}.`;
        if (rule.id === 'ESCALATION') return "Conversation escalated to threats or aggressive demands.";
        return rule.evidence;
    };

    // Severity Colors
    const getSeverityColor = (level) => {
        if (level === 'CRITICAL') return { bg: '#FEE2E2', text: '#DC2626' };
        if (level === 'HIGH') return { bg: '#FEF3C7', text: '#D97706' };
        if (level === 'MEDIUM') return { bg: '#FEF9C3', text: '#CA8A04' };
        return { bg: '#D1FAE5', text: '#059669' };
    };

    // Summary text generation
    const score = data.probability * 100;
    
    let executiveSummary = "";
    let reportTitle = "";
    const isCritical = score >= 95;
    const isHigh = score >= 80 && score < 95;

    if (score >= 95) {
        executiveSummary = "Critical threat detected. Automatic protection mechanisms successfully prevented disclosure of sensitive information. Immediate termination of the interaction is recommended.";
        reportTitle = "Critical Security Incident Report";
    } else if (score >= 80) {
        executiveSummary = "High-confidence scam attempt detected. Strong evidence suggests fraud or social engineering. Sensitive information should never be disclosed.";
        reportTitle = "Security Incident Report";
    } else if (score >= 50) {
        executiveSummary = "Potential scam indicators were detected. Avoid sharing sensitive credentials until the caller has been independently verified.";
        reportTitle = "Session Analysis Summary";
    } else if (score >= 20) {
        executiveSummary = "Minor suspicious indicators were observed. Proceed cautiously and independently verify unexpected requests.";
        reportTitle = "Session Analysis Summary";
    } else {
        executiveSummary = "Secure banking session completed. No suspicious indicators were detected.";
        reportTitle = "Session Analysis Summary";
    }

    const getRecommendation = () => {
        switch (data.scamCategory) {
            case 'Authority Impersonation': 
                return ['Do not share personal details.', 'Hang up immediately.', 'Verify claims independently.', 'Contact your local authorities.'];
            case 'Bank Scam':
            case 'KYC Fraud':
                return ['Do not share OTPs or passwords.', 'Do not authorize any transactions.', 'Contact your bank securely via the official app.'];
            case 'Family Emergency':
                return ['Hang up and verify with family members directly.', 'Do not transfer funds hastily.', 'Check their real phone number.'];
            default:
                if (data.paymentRequest || data.otpMentioned) return ['Do not share OTPs or passwords.', 'Do not authorize any transactions.'];
                return ['Stay vigilant.', 'Never share personal banking details over the phone.'];
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            overscrollBehavior: 'contain'
        }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                    width: '100%', maxWidth: 900, maxHeight: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 24,
                    boxShadow: '0 24px 50px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header Actions */}
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '20px 32px', borderBottom: '1px solid #E2E8F0',
                    background: '#F8FAFC'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: isBlocked ? '#DC2626' : '#10B981' }} />
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Space Grotesk, sans-serif' }}>
                            AI Investigation Report
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={exportPDF} style={{
                            padding: '8px 16px', borderRadius: 8, background: '#2563EB', color: '#fff',
                            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export PDF
                        </button>
                        <button onClick={onClose} style={{
                            padding: '8px 16px', borderRadius: 8, background: '#F1F5F9', color: '#475569',
                            border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}>
                            Close
                        </button>
                    </div>
                </div>

                {/* PDF Content Area */}
                <div ref={reportRef} style={{ padding: '32px 40px', background: '#FFFFFF', overflowY: 'auto', overscrollBehavior: 'contain', flex: 1 }}>
                    
                    {/* Timestamp & Meta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, fontSize: 12, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                        <div>DATE: {reportDate}</div>
                        <div>NODE: KAVACH-CORE-01 | {reportMeta.reportId}</div>
                    </div>

                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em', marginBottom: 24 }}>
                        {reportTitle}
                    </h1>

                    {/* 1. Executive Summary */}
                    <section style={{ marginBottom: 40 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Executive Summary</div>
                        <div style={{ 
                            padding: 20, borderRadius: 12, 
                            background: isCritical ? '#FEF2F2' : isHigh ? '#FFF7ED' : score < 20 ? '#F0FDF4' : '#F8FAFC', 
                            border: `1px solid ${isCritical ? '#FECACA' : isHigh ? '#FED7AA' : score < 20 ? '#BBF7D0' : '#E2E8F0'}`,
                            fontSize: 16, color: isCritical ? '#991B1B' : isHigh ? '#C2410C' : score < 20 ? '#166534' : '#334155', lineHeight: 1.6, fontWeight: 500
                        }}>
                            {executiveSummary}
                        </div>
                    </section>

                    {/* 2. AI Findings */}
                    <section style={{ marginBottom: 40 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>AI Findings</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            {[
                                { label: 'Scam Category', val: data.scamCategory },
                                { label: 'Caller Intent', val: data.callerIntent },
                                { label: 'Conv. Stage', val: data.conversationStage },
                                { label: 'Emotional Tone', val: data.emotionalTone },
                                { label: 'Risk Score', val: `${(data.probability * 100).toFixed(0)}%`, highlight: true }
                            ].map((item, idx) => (
                                <div key={idx} style={{ 
                                    padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' 
                                }}>
                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>{item.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: item.highlight && data.probability > 0.8 ? '#DC2626' : '#0F172A' }}>
                                        {item.val}
                                    </div>
                                </div>
                            ))}

                            {/* Alert Level Box */}
                            <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>Alert Level</div>
                                <div style={{ 
                                    display: 'inline-block', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                    background: getSeverityColor(data.threatLevel).bg,
                                    color: getSeverityColor(data.threatLevel).text
                                }}>
                                    {data.threatLevel}
                                </div>
                            </div>
                            
                            {/* AI Source Box */}
                            <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>AI Source</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                                    {data.aiSource || 'Unknown'}
                                </div>
                            </div>

                            {/* Techniques Box */}
                            <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>Techniques</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {data.manipulationTechniques && data.manipulationTechniques.length > 0 ? (
                                        data.manipulationTechniques.map((tech, i) => (
                                            <span key={i} style={{
                                                padding: '2px 8px', borderRadius: 4, background: '#E2E8F0', color: '#334155', fontSize: 11, fontWeight: 600
                                            }}>{tech}</span>
                                        ))
                                    ) : (
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>None Detected</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Evidence */}
                    {data.triggeredRules && data.triggeredRules.length > 0 && (
                        <section style={{ marginBottom: 40 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Triggered Rules & Evidence</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                                        <th style={{ padding: '12px 16px', color: '#334155', fontWeight: 700, fontSize: 14 }}>Rule</th>
                                        <th style={{ padding: '12px 16px', color: '#334155', fontWeight: 700, fontSize: 14 }}>Evidence</th>
                                        <th style={{ padding: '12px 16px', color: '#334155', fontWeight: 700, fontSize: 14, textAlign: 'right' }}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.triggeredRules.map((rule, idx) => {
                                        const confidence = Math.min(99, 85 + Math.floor(rule.points / 3));
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '16px', fontWeight: 600, color: '#0F172A', verticalAlign: 'top', width: '25%', fontSize: 14 }}>{rule.title}</td>
                                                <td style={{ padding: '16px', color: '#334155', verticalAlign: 'top', fontSize: 14 }}>
                                                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#0F172A' }}>{rule.description || getRuleEvidence(rule)}</div>
                                                    <div style={{ fontStyle: 'italic', marginBottom: 8, background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #CBD5E1', fontSize: 13 }}>
                                                        "{rule.evidence}"
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>+{rule.points} Risk Points</div>
                                                </td>
                                                <td style={{ padding: '16px', color: '#2563EB', fontWeight: 700, verticalAlign: 'top', width: '15%', textAlign: 'right' }}>
                                                    {confidence}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* 3.5 Similar Scam Patterns (Vector Search Results) */}
                    {data.similarScams && data.similarScams.length > 0 && (
                        <section style={{ marginBottom: 40 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                                Similar Scam Patterns (Vector Search)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                                {data.similarScams.map((scam, idx) => {
                                    const isWeak = scam.belowThreshold;
                                    const displayPct = scam.displaySimilarity ?? `${(scam.similarity * 100).toFixed(1)}%`;
                                    const matchColor = isWeak ? '#94A3B8' : scam.similarity > 0.6 ? '#DC2626' : '#2563EB';
                                    return (
                                        <div key={idx} style={{
                                            padding: 16, borderRadius: 12,
                                            border: `1px solid ${isWeak ? '#E2E8F0' : '#E2E8F0'}`,
                                            background: isWeak ? '#FAFAFA' : '#F8FAFC',
                                            display: 'flex', flexDirection: 'column', gap: 8,
                                            opacity: isWeak ? 0.6 : 1,
                                            transition: 'opacity 0.2s',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: isWeak ? '#64748B' : '#0F172A' }}>
                                                        {scam.title}
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginLeft: 8 }}>({scam.category})</span>
                                                    </div>
                                                    {isWeak && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 700, color: '#94A3B8',
                                                            background: '#F1F5F9', border: '1px solid #E2E8F0',
                                                            borderRadius: 4, padding: '2px 6px', letterSpacing: '0.05em'
                                                        }}>WEAK SIGNAL</span>
                                                    )}
                                                </div>
                                                {!isWeak && (
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: matchColor, minWidth: 80, textAlign: 'right' }}>
                                                        {displayPct} Match
                                                    </div>
                                                )}
                                            </div>
                                            {scam.explanation && (
                                                <div style={{ fontSize: 13, color: isWeak ? '#94A3B8' : '#475569', fontStyle: 'italic' }}>{scam.explanation}</div>
                                            )}
                                            {!isWeak && (
                                                <div style={{ fontSize: 12, color: '#166534', background: '#F0FDF4', padding: '6px 12px', borderRadius: 6, display: 'inline-block', alignSelf: 'flex-start', marginTop: 4 }}>
                                                    <strong>Action:</strong> {scam.recommendedAction}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* 3.6 Regulatory Citations (RAG) */}
                    {data.ragCitations && data.ragCitations.length > 0 && (
                        <section style={{ marginBottom: 40 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                                Regulatory Citations
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                                {data.ragCitations.map((citation, idx) => {
                                    return (
                                        <div key={idx} style={{
                                            padding: 16, borderRadius: 12,
                                            border: `1px solid #E2E8F0`,
                                            background: '#F8FAFC',
                                            display: 'flex', flexDirection: 'column', gap: 8,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, color: '#FFFFFF',
                                                        background: citation.source === 'RBI' ? '#1D4ED8' : citation.source === 'CERT-In' ? '#047857' : '#B45309',
                                                        borderRadius: 4, padding: '3px 8px', letterSpacing: '0.05em'
                                                    }}>
                                                        {citation.source}
                                                    </span>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                                                        {citation.title}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', minWidth: 80, textAlign: 'right' }}>
                                                    {citation.displaySimilarity} Match
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 }}>
                                                "{citation.excerpt}"
                                            </div>
                                            {citation.url && (
                                                <a href={citation.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#3B82F6', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                                                    Read official guidance ↗
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        {/* 4. Timeline */}
                        <section>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Fraud Probability Timeline</div>
                            
                            <div style={{ padding: '24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', width: 40 }}>0%</div>
                                <div style={{ flex: 1, height: 8, background: '#E2E8F0', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, data.probability * 100)}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                        style={{ 
                                            position: 'absolute', top: 0, left: 0, bottom: 0, 
                                            background: isBlocked ? 'linear-gradient(90deg, #F59E0B, #DC2626)' : 'linear-gradient(90deg, #10B981, #F59E0B)',
                                            borderRadius: 4 
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: isBlocked ? '#DC2626' : '#F59E0B', width: 80, textAlign: 'right' }}>
                                    {isBlocked ? 'Lockdown' : `${(data.probability * 100).toFixed(0)}%`}
                                </div>
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, marginTop: 24 }}>Incident Timeline</div>
                            <div style={{ position: 'relative', paddingLeft: 20 }}>
                                <div style={{ position: 'absolute', top: 10, bottom: 10, left: 5, width: 2, background: '#E2E8F0' }} />
                                {timelineLogs.map((log, idx) => (
                                    <div key={idx} style={{ position: 'relative', marginBottom: 20 }}>
                                        <div style={{ 
                                            position: 'absolute', left: -20, top: 2, width: 10, height: 10, borderRadius: '50%', 
                                            background: getTimelineColor(log.type, log.msg),
                                            border: '2px solid #fff'
                                        }} />
                                        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{log.time}</div>
                                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{log.msg}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div>
                            {/* 5. Investigation Metadata */}
                            <section style={{ marginBottom: 32 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Investigation Status</div>
                                <div style={{ padding: 16, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12, color: '#475569', lineHeight: 1.8, fontFamily: 'JetBrains Mono, monospace' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Status:</span>
                                        <span style={{ fontWeight: 600, color: isBlocked ? '#DC2626' : '#10B981' }}>{isBlocked ? 'Incident Mitigated' : 'Session Safe'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Detection Time:</span>
                                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{reportDate}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>AI Source:</span>
                                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{data.aiSource}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Session ID:</span>
                                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{reportMeta.sessionId}</span>
                                    </div>
                                </div>
                            </section>

                            <section style={{ marginBottom: 32 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>AI Decision Reasoning</div>
                                <div style={{ padding: 16, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                                    {data.reasoning || 'Deterministic rule execution based on semantic intent matching.'}
                                </div>
                            </section>

                            <section>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Recommended Actions</div>
                                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#0F172A', lineHeight: 1.8 }}>
                                    {getRecommendation().map((rec, idx) => (
                                        <li key={idx}><strong>{rec}</strong></li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
