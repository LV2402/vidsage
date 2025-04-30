// This file is no longer needed as API calls are handled in app/actions.ts
// Keeping minimal implementation for backward compatibility if any references exist
const { callGeminiAPI } = require("./apiClient");

async function processRequest(input) {
  try {
    const result = await callGeminiAPI({ query: input });
    return result;
  } catch (error) {
    console.error("Error processing request:", error);
    throw error;
  }
}

module.exports = { processRequest };
