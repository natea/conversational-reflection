# Ginger Frontend - Getting Started

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Pipecat backend (local or cloud)

## Installation

```bash
cd apps/ginger/frontend
npm install
```

## Environment Configuration

Copy the example environment file or create `.env.local`:

```bash
cp .env.example .env.local  # if example exists
# or create manually
```

### Local Development (Default)

For local development with a Pipecat backend running on your machine:

```env
# .env.local
PIPECAT_WEBRTC_URL=http://localhost:7860/api/offer
NEXT_PUBLIC_PIPECAT_WEBRTC_URL=http://localhost:7860/api/offer
```

Then start your local Pipecat backend on port 7860 and run:

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Pipecat Cloud

To use Pipecat Cloud instead of a local backend:

```env
# .env.local
PIPECAT_WEBRTC_URL=https://api.pipecat.daily.co/v1/public/ginger/start
NEXT_PUBLIC_PIPECAT_WEBRTC_URL=https://api.pipecat.daily.co/v1/public/ginger/start
NEXT_PUBLIC_PIPECAT_API_KEY=your-pipecat-api-key-here
```

Get your API key from the [Pipecat Cloud Dashboard](https://pipecat.daily.co).

## Running the App

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deploying to Cloudflare Pages

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Build and Deploy

1. **Build with environment variables baked in:**
   ```bash
   NEXT_PUBLIC_PIPECAT_WEBRTC_URL="https://api.pipecat.daily.co/v1/public/ginger/start" \
   NEXT_PUBLIC_PIPECAT_API_KEY="your-api-key" \
   npx @cloudflare/next-on-pages
   ```

   > **Important:** `NEXT_PUBLIC_*` variables are baked in at build time, not runtime. You must include them in the build command.

2. **Deploy to Cloudflare:**
   ```bash
   wrangler pages deploy .vercel/output/static --project-name=ginger
   ```

### Cloudflare Dashboard Configuration

After first deployment, configure in Cloudflare Dashboard:

1. Go to **Workers & Pages** → **ginger** → **Settings**
2. Under **Compatibility flags**, add: `nodejs_compat`
3. Under **Environment variables**, add any server-side variables:
   - `PIPECAT_WEBRTC_URL`
   - `PIPECAT_API_KEY`

### wrangler.toml

The `wrangler.toml` file is pre-configured:

```toml
name = "ginger"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"
```

## Architecture

### Transport Selection

The app automatically selects the appropriate WebRTC transport:

- **Local development** → `SmallWebRTCTransport` (direct WebRTC)
- **Pipecat Cloud** → `DailyTransport` (via Daily.co rooms)

Detection is based on whether `NEXT_PUBLIC_PIPECAT_WEBRTC_URL` contains `pipecat.daily.co`.

### Key Files

| File | Purpose |
|------|---------|
| `src/providers/PipecatProvider.tsx` | Voice client initialization and connection logic |
| `src/app/api/offer/route.ts` | Proxy endpoint for WebRTC offer/answer exchange |
| `.env.local` | Local environment configuration |
| `wrangler.toml` | Cloudflare Pages deployment config |

## Troubleshooting

### "Missing required room URL"

This error occurs when using `DailyTransport` without a room URL. Ensure:
- You have `NEXT_PUBLIC_PIPECAT_API_KEY` set if using Pipecat Cloud
- The cloud API is returning `dailyRoom` and `dailyToken` in the response

### "NEXT_PUBLIC_PIPECAT_API_KEY not set"

You're trying to connect to Pipecat Cloud but the API key is missing:
1. For local dev: Switch to local URLs in `.env.local`
2. For cloud: Add your API key to `.env.local`

### Node.js Compatibility Error on Cloudflare

Add `nodejs_compat` to compatibility flags:
1. In `wrangler.toml` (already configured)
2. In Cloudflare Dashboard → Settings → Compatibility flags

### Build fails with Next.js version error

The app requires Next.js 15+ for `@cloudflare/next-on-pages`. Check your `package.json`:

```json
{
  "dependencies": {
    "next": "15.5.2"
  }
}
```

## Development Tips

1. **Check transport in console:** Look for `[Pipecat] Using transport:` log
2. **Monitor connection:** Watch for `[Pipecat] Connected` and `[Pipecat] Bot ready`
3. **Test microphone:** The app will log selected microphone info on connect
