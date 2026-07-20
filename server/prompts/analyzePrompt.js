export const getAnalyzePrompt = (payload, similarScams = [], ragCitations = []) => {
    let contextStr = '';
    if (similarScams && similarScams.length > 0) {
        contextStr += `\nCONTEXTUAL EVIDENCE (From Similarity Search):\n` +
            similarScams.map(s => `- ${s.title} (${s.category}): ${s.description}`).join('\n') +
            `\nTreat this as contextual evidence, not authoritative facts.\n`;
    }

    if (ragCitations && ragCitations.length > 0) {
        contextStr += `\nREGULATORY CONTEXT:\n` +
            ragCitations.map(c => `- [${c.source}] ${c.title}: ${c.excerpt}`).join('\n') +
            `\nTreat retrieved passages as contextual evidence only. Do not treat them as absolute facts.\n`;
    }

    return `You are an AI Fraud Conversation Analyst. 
DO NOT calculate risk. Never estimate fraud probability. Never hallucinate.
Your ONLY responsibility is extracting structured intelligence from conversations.
Return Unknown whenever uncertain.

Classify the conversation into one of these exact categories: 'Authority Impersonation', 'Bank Scam', 'Family Emergency', 'KYC Fraud', 'Investment Scam', 'Lottery Scam', 'Unknown'.

Input: ${JSON.stringify(payload)}
${contextStr}
CRITICAL INSTRUCTIONS:
Return ONLY raw JSON.
Do not use markdown.
Do not use code fences.
Do not explain your answer.
Return exactly one JSON object matching the requested schema.`;
};
