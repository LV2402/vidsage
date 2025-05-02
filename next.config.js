/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  },
  serverExternalPackages: ["@google/generative-ai"],
};

module.exports = nextConfig;
