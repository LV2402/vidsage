const { callGeminiAPI } = require('./apiClient');

// ...existing code...

async function processRequest(input) {
    const payload = { query: input };
    try {
        const result = await callGeminiAPI(payload);
        console.log('Gemini API response:', result);
        return result;
    } catch (error) {
        console.error('Error processing request:', error);
        throw error;
    }
}

// ...existing code...