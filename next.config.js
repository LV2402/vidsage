/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyAsNNDIILxBmvaxMSnP08PomtRC0r0zrLQ",
  },
  // Update from serverComponentsExternalPackages to serverExternalPackages
  experimental: {
    serverExternalPackages: ['@google/generative-ai'],
  },
}

module.exports = nextConfig
