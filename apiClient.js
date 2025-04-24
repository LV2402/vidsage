const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyAsNNDIILxBmvaxMSnP08PomtRC0r0zrLQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGeminiAPI(payload) {
  try {
    if (!payload || !payload.text) {
      throw new Error("Invalid payload: Missing required field (text).");
    }

    const formattedPayload = {
      contents: [
        {
          parts: [
            {
              text: payload.text
            }
          ]
        }
      ],
      generationConfig: {
        temperature: payload.temperature || 0.7,
        maxOutputTokens: payload.maxOutputTokens || 256,
      }
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      formattedPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Process the response to ensure it has the expected structure
    const responseData = response.data;
    
    // Extract the text content from Gemini's response
    let textContent = '';
    if (responseData.candidates && 
        responseData.candidates[0] && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts) {
      textContent = responseData.candidates[0].content.parts
        .filter(part => part.text)
        .map(part => part.text)
        .join('');
    }
    
    // Try to parse the content as JSON if possible
    let parsedContent;
    try {
      parsedContent = JSON.parse(textContent);
    } catch (e) {
      // If it's not valid JSON, create a simple structure with the text
      parsedContent = { text: textContent };
    }
    
    // Ensure the response contains an issues array even if empty
    if (!parsedContent.issues) {
      parsedContent.issues = [];
    }
    
    return parsedContent;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Gemini API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    } else {
      console.error("Error calling Gemini API:", error);
    }
    throw error;
  }
}

module.exports = { callGeminiAPI };