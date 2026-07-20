import { GoogleGenAI } from '@google/genai';

async function listModels() {
    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
    try {
        const response = await ai.models.list();
        for (const model of response) {
            console.log(model.name);
        }
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
