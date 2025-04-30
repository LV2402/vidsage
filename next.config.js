/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Use environment variable if available, or provide a placeholder that will require setup
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  },
  experimental: {
    serverExternalPackages: ["@google/generative-ai"],
  },
};

module.exports = nextConfig;
