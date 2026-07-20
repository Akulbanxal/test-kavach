export class LocalSemanticProvider {
    runFallback(text) {
        const lower = text.toLowerCase();
        
        let scamCategory = 'Unknown';
        let callerIntent = 'Unknown';
        let conversationStage = 'Unknown';
        let emotionalTone = 'Neutral';
        let urgencyLevel = 'Low';
        let manipulationTechniques = [];
        let reasoning = 'Deterministic fallback using keyword mapping.';
        
        let authorityDetected = false;
        let credentialRequest = false;
        let paymentRequest = false;
        let otpMentioned = false;

        if (lower.includes('police') || lower.includes('warrant') || lower.includes('arrest')) {
            scamCategory = 'Authority Impersonation';
            callerIntent = 'Intimidate victim using legal authority';
            conversationStage = 'Authority Establishment';
            emotionalTone = 'Aggressive';
            urgencyLevel = 'High';
            manipulationTechniques = ['Authority', 'Fear', 'Urgency'];
            reasoning = 'Caller impersonates law enforcement to pressure the victim into immediate compliance.';
            authorityDetected = true;
            paymentRequest = lower.includes('money') || lower.includes('transfer') || lower.includes('pay');
        } else if (lower.includes('rbi') || lower.includes('reserve bank')) {
            scamCategory = 'Bank Scam';
            callerIntent = 'Obtain banking credentials';
            conversationStage = 'Credential Collection';
            emotionalTone = 'Professional but threatening';
            urgencyLevel = 'High';
            manipulationTechniques = ['Authority', 'Urgency', 'Credential Harvesting'];
            reasoning = 'Caller claims to represent a financial institution and requests sensitive banking information.';
            authorityDetected = true;
            credentialRequest = lower.includes('pin') || lower.includes('password');
        } else if (lower.includes('accident') || lower.includes('hospital')) {
            scamCategory = 'Family Emergency';
            callerIntent = 'Manipulate victim emotionally';
            conversationStage = 'Emotional Manipulation';
            emotionalTone = 'Distressed';
            urgencyLevel = 'Critical';
            manipulationTechniques = ['Trust Exploitation', 'Emotional Pressure', 'Urgency'];
            reasoning = 'Caller imitates a trusted family member to manipulate the victim into immediate financial action.';
            paymentRequest = lower.includes('rupees') || lower.includes('transfer') || lower.includes('money');
        } else if (lower.includes('kyc') || lower.includes('verification division')) {
            scamCategory = 'KYC Fraud';
            callerIntent = 'Collect verification credentials';
            conversationStage = 'Identity Verification';
            emotionalTone = 'Professional';
            urgencyLevel = 'Medium';
            manipulationTechniques = ['Credential Harvesting', 'Authority', 'Trust Building'];
            reasoning = 'Caller pretends to perform mandatory account verification to obtain sensitive credentials.';
            authorityDetected = true;
            otpMentioned = lower.includes('otp') || lower.includes('code');
        } else {
            if (lower.includes('urgent') || lower.includes('immediately')) urgencyLevel = 'High';
            if (lower.includes('otp') || lower.includes('code')) otpMentioned = true;
            if (lower.includes('pin') || lower.includes('password')) credentialRequest = true;
            if (lower.includes('transfer') || lower.includes('money')) paymentRequest = true;
        }

        console.log('[LocalSemanticProvider] Demo Mode Local Fallback Activated.');
        
        return {
            callerIntent,
            scamCategory,
            emotionalTone,
            urgencyLevel,
            authorityDetected,
            credentialRequest,
            paymentRequest,
            otpMentioned,
            manipulationTechniques,
            suspiciousClaims: [],
            conversationStage,
            summary: 'Local fallback analysis triggered due to API unavailability.',
            reasoning,
            aiSource: 'Local Semantic Engine'
        };
    }
}
