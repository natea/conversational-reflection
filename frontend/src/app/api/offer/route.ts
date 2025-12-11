import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const PIPECAT_WEBRTC_URL = process.env.PIPECAT_WEBRTC_URL || 'http://localhost:7860/api/offer'
const PIPECAT_API_KEY = process.env.PIPECAT_API_KEY || ''

// Check if we're connecting to Pipecat Cloud vs local
const isCloudDeployment = PIPECAT_WEBRTC_URL.includes('pipecat.daily.co')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authorization for Pipecat Cloud (Bearer token format)
    if (PIPECAT_API_KEY && isCloudDeployment) {
      headers['Authorization'] = `Bearer ${PIPECAT_API_KEY}`
    }

    // Format request body for Pipecat Cloud
    const requestBody = isCloudDeployment
      ? {
          createDailyRoom: true,
          dailyRoomProperties: { start_video_off: true },
          body: body,
        }
      : body

    const response = await fetch(PIPECAT_WEBRTC_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pipecat backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to connect to voice backend', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('WebRTC offer proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to establish voice connection', details: String(error) },
      { status: 500 }
    )
  }
}

// PATCH handler for ICE candidate updates (used by Pipecat WebRTC transport)
// Note: PATCH is only used for local SmallWebRTC, not Pipecat Cloud (which uses Daily.co)
export async function PATCH(request: NextRequest) {
  try {
    // Pipecat Cloud uses Daily.co and doesn't support PATCH for ICE candidates
    // Return success immediately to avoid 404 errors
    if (isCloudDeployment) {
      console.log('[PATCH] Skipping ICE candidate update for Pipecat Cloud (handled by Daily.co)')
      return NextResponse.json({ status: 'success', message: 'ICE candidates handled by Daily.co' })
    }

    const body = await request.json()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const response = await fetch(PIPECAT_WEBRTC_URL, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pipecat backend PATCH error:', errorText)
      return NextResponse.json(
        { error: 'Failed to update ICE candidates', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('WebRTC PATCH proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update connection', details: String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
