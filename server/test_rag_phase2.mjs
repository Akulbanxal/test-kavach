import { getRagOrchestrator } from './services/rag/RAGOrchestrator.js';

async function test() {
    const rag = await getRagOrchestrator();

    const tests = [
        {
            label: 'Police / Authority Scam',
            text: 'This is the police. We have a warrant for your arrest. Pay the fine now or you will be arrested.'
        },
        {
            label: 'UPI / QR Scam',
            text: 'I am sending money to your UPI. Just scan the QR code and enter your PIN to receive the payment.'
        },
        {
            label: 'OTP / KYC Scam',
            text: 'Your KYC is pending. Share the OTP to reactivate your RBI bank account immediately.'
        }
    ];

    for (const t of tests) {
        const citations = await rag.retrieveCitations(t.text, 3);
        console.log('\n--- ' + t.label + ' ---');
        if (citations.length === 0) {
            console.log('  (no citations returned)');
        }
        for (const c of citations) {
            console.log('  [' + c.source + '] ' + c.title.slice(0, 55) + ' | sim=' + c.displaySimilarity);
        }
    }

    console.log('\n[PASS] Phase 2 RAG retrieval verified.');
}

test().catch(err => {
    console.error('[FAIL]', err);
    process.exit(1);
});
