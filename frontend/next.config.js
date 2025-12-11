/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    PIPECAT_WEBRTC_URL: process.env.PIPECAT_WEBRTC_URL || 'http://localhost:7860/offer',
  },
}

module.exports = nextConfig
