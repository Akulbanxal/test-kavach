import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskRule } from '../ai/aiTypes';

interface TimelineEvent {
    id: string;
    timestamp: string;
    title: string;
}

interface AITimelineProps {
    callActive: boolean;
    triggeredRules: RiskRule[];
    locked: boolean;
}

export const AITimeline: React.FC<AITimelineProps> = React.memo(({ callActive, triggeredRules, locked }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const startTime = useRef<number | null>(null);
    const lockedEventAdded = useRef(false);

    // Format relative time (e.g. 00:18)
    const getRelativeTime = () => {
        if (!startTime.current) return '00:00';
        const diffSecs = Math.floor((Date.now() - startTime.current) / 1000);
        const mins = Math.floor(diffSecs / 60).toString().padStart(2, '0');
        const secs = (diffSecs % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // Reset when call starts/stops
    useEffect(() => {
        if (callActive && !startTime.current) {
            startTime.current = Date.now();
            lockedEventAdded.current = false;
            setEvents([{ id: 'start', timestamp: '00:00', title: 'Conversation Started' }]);
        } else if (!callActive) {
            startTime.current = null;
        }
    }, [callActive]);

    // Watch for new triggered rules
    useEffect(() => {
        if (!callActive) return;

        setEvents(prev => {
            const newEvents = [...prev];
            let changed = false;

            triggeredRules.forEach(rule => {
                // If we haven't added this rule yet
                if (!newEvents.find(e => e.id === rule.id)) {
                    newEvents.push({
                        id: rule.id,
                        timestamp: getRelativeTime(),
                        title: `${rule.title} detected`
                    });
                    changed = true;
                }
            });

            return changed ? newEvents : prev;
        });
    }, [triggeredRules, callActive]);

    // Watch for locked state
    useEffect(() => {
        if (locked && !lockedEventAdded.current && callActive) {
            lockedEventAdded.current = true;
            setEvents(prev => [
                ...prev, 
                { id: 'lock', timestamp: getRelativeTime(), title: 'Transaction blocked' }
            ]);
        }
    }, [locked, callActive]);

    return (
        <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(15,23,42,0.03)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>
                AI Analysis Timeline
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingLeft: '8px' }}>
                {/* Vertical connecting line */}
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: '#E2E8F0', zIndex: 0 }} />

                <AnimatePresence>
                    {events.map((event, index) => {
                        const isLast = index === events.length - 1;
                        const isLock = event.id === 'lock';

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -10, y: 10 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                style={{ display: 'flex', gap: '16px', marginBottom: isLast ? '0' : '24px', position: 'relative', zIndex: 1 }}
                            >
                                {/* Node */}
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: isLock ? '#EF4444' : '#3B82F6',
                                    marginTop: '5px',
                                    boxShadow: `0 0 0 4px ${isLock ? '#FEE2E2' : '#EFF6FF'}`,
                                    border: '2px solid #FFFFFF',
                                    flexShrink: 0,
                                }} />

                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {event.timestamp}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: isLock ? '#DC2626' : '#1E293B', marginTop: '2px' }}>
                                        {event.title}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {events.length === 0 && !callActive && (
                    <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', marginTop: '10px' }}>
                        Waiting for call to start...
                    </div>
                )}
            </div>
        </div>
    );
});
