/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
    domains: ["img.clerk.com"],
  },
  reactStrictMode: false,
  env: {
    // Get a Google Gemini API key for AI-powered translations
    // Visit: https://makersuite.google.com/app/apikey
    // 
    // IMPORTANT: Unlike the Cloud Translation API, Gemini API doesn't 
    // require enabling any specific APIs in Google Cloud Console.
    // Simply get your API key from Google AI Studio and add it here.
    //
    // For production, use environment variables in your deployment platform
    // For local development, you can add your key here or in .env.local
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
  },
};

export default nextConfig;
