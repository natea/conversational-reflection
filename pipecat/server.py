#!/usr/bin/env python3
"""
HTTP/WebSocket server for Pipecat bot with CORS support.
This provides the signaling server needed for WebRTC connections.
"""

import asyncio
import json
import os
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from bot import bot, RunnerArguments
from pipecat.runner.utils import create_transport

app = FastAPI(
    title="Pipecat WebRTC Server",
    description="Server for Pipecat voice bot with WebRTC support",
    version="1.0.0"
)

# Configure CORS to allow all origins (permissive)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Store connected clients
connected_clients: Dict[str, WebSocket] = {}


@app.post("/api/offer")
@app.patch("/api/offer")
async def handle_offer(offer: Dict[str, Any]):
    """
    Handle WebRTC offer from frontend.
    Returns a simple answer for testing - in production, this would
    integrate with the actual Pipecat WebRTC transport.
    """
    try:
        logger.info(f"Received WebRTC offer: {offer.get('type', 'unknown')}")

        # Create a basic answer for testing
        # In a real implementation, you would:
        # 1. Create RTCPeerConnection
        # 2. Set remote description with the offer
        # 3. Create answer
        # 4. Return the answer

        # For now, return a mock response to test CORS
        answer = {
            "type": "answer",
            "sdp": "v=0\r\n"
            "o=- 0 0 IN IP4 127.0.0.1\r\n"
            "s=-\r\n"
            "t=0 0\r\n"
            "a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\n"
            "m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n"
            "a=mid:0\r\n"
            "a=sendrecv\r\n"
            "a=sctpmap:5000 webrtc-datachannel 1024\r\n"
        }

        return JSONResponse(answer)

    except Exception as e:
        logger.error(f"Error handling WebRTC offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/offer")
async def get_offer():
    """
    Generate and return a WebRTC offer from the server.
    This would be used if the server initiates the connection.
    """
    try:
        # In a real implementation, you would create an offer
        # using the Pipecat WebRTC transport

        offer = {
            "type": "offer",
            "sdp": "v=0\r\n"
            "o=- 0 0 IN IP4 127.0.0.1\r\n"
            "s=-\r\n"
            "t=0 0\r\n"
            "a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\n"
            "m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n"
            "a=mid:0\r\n"
            "a=sendrecv\r\n"
            "a=sctpmap:5000 webrtc-datachannel 1024\r\n"
        }

        return JSONResponse(offer)

    except Exception as e:
        logger.error(f"Error creating WebRTC offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time WebRTC signaling.
    """
    await websocket.accept()
    client_id = id(websocket)
    connected_clients[client_id] = websocket
    logger.info(f"WebSocket client connected: {client_id}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            logger.info(f"Received WebSocket message: {message.get('type', 'unknown')}")

            # Handle different message types
            if message.get("type") == "offer":
                # Process offer and create answer
                answer = {
                    "type": "answer",
                    "sdp": "mock-answer-sdp"
                }
                await websocket.send_text(json.dumps(answer))
            elif message.get("type") == "ice-candidate":
                # Handle ICE candidates
                logger.info("Received ICE candidate")
            else:
                logger.warning(f"Unknown message type: {message.get('type')}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {client_id}")
        if client_id in connected_clients:
            del connected_clients[client_id]
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if client_id in connected_clients:
            del connected_clients[client_id]


@app.get("/api/status")
async def get_status():
    """Get server status."""
    return {
        "status": "running",
        "connected_clients": len(connected_clients),
        "message": "CORS is configured to allow all origins"
    }


@app.options("/api/offer")
async def options_offer():
    """Handle OPTIONS request for CORS preflight."""
    return JSONResponse(
        status_code=200,
        content={}
    )


async def run_pipecat():
    """Run the Pipecat bot in the background."""
    try:
        # Create runner arguments
        runner_args = RunnerArguments(
            handle_sigint=False  # Let the server handle SIGINT
        )

        # Run the bot
        await bot(runner_args)
    except Exception as e:
        logger.error(f"Error running Pipecat bot: {e}")


def run_server(host: str = "0.0.0.0", port: int = 7860):
    """Run the FastAPI server with Pipecat bot."""
    logger.info(f"Starting Pipecat server on {host}:{port}")
    logger.info("CORS is configured to allow all origins")

    # Run Pipecat bot in background
    asyncio.create_task(run_pipecat())

    # Run FastAPI server
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )


if __name__ == "__main__":
    # Set environment variables if needed
    os.environ.setdefault("NODE_ENV", "development")

    run_server()