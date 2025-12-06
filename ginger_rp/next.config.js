/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: Do NOT expose full backend URLs to the client build here.
  // Server-only environment variables (like PIPECAT_WEBRTC_URL) should be set
  // in `.env.local` and accessed from server-side code (API routes). The
  // application proxies voice requests through `/api/offer` to avoid CORS.
  // Allow cross-origin requests to Pipecat backend in development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
