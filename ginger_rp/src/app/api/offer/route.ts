import { NextRequest, NextResponse } from 'next/server'

const PIPECAT_WEBRTC_URL = process.env.PIPECAT_WEBRTC_URL || 'http://localhost:7860/api/offer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(PIPECAT_WEBRTC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    })
  } catch (error) {
    console.error('WebRTC offer proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to establish voice connection', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(PIPECAT_WEBRTC_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pipecat backend error (PATCH):', errorText)
      return NextResponse.json(
        { error: 'Failed to connect to voice backend', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    })
  } catch (error) {
    console.error('WebRTC offer proxy error (PATCH):', error)
    return NextResponse.json(
      { error: 'Failed to establish voice connection', details: String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  // Echo back requested headers if provided, otherwise allow common headers
  const requestedHeaders = request.headers.get('access-control-request-headers')
  const allowHeaders = requestedHeaders || 'Content-Type, Authorization, X-Requested-With'

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS, GET',
      'Access-Control-Allow-Headers': allowHeaders,
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
