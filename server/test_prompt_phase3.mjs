import { getAnalyzePrompt } from './prompts/analyzePrompt.js';

const payload = {
    transcript: 'I am sending money to your UPI. Just scan the QR code and enter your PIN to receive the payment.',
    timestamp: Date.now(),
    previousContext: ''
};

const similarScams = [
    { title: 'UPI Collect Request Fraud', category: 'UPI Fraud', description: 'Scammers deceive victims into approving a UPI collect request by claiming they are sending money, but actually withdrawing it.' }
];

const ragCitations = [
    { source: 'NPCI', title: 'You Never Need a UPI PIN to Receive Money', excerpt: 'NPCI clarifies that a UPI PIN is required only to authorise payments (debits). To receive money, no PIN, QR code scan, or app interaction is required.' }
];

console.log(getAnalyzePrompt(payload, similarScams, ragCitations));
