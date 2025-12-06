#!/usr/bin/env python3
"""
FastAPI server for WebRTC signaling with Pipecat.
Handles WebRTC offers and provides permissive CORS headers.
"""

import asyncio
import json
import os
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

# Add CORS middleware to FastAPI
app = FastAPI(
    title="Pipecat WebRTC Signaling Server",
    description="WebRTC signaling server for Pipecat voice bot",
    version="1.0.0"
)

# Configure CORS for all origins (permissive)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Global reference to the Pipecat task
pipecat_task = None
transport = None


def set_pipecat_task(task, transport_instance):
    """Set the global Pipecat task and transport reference."""
    global pipecat_task, transport
    pipecat_task = task
    transport = transport_instance
    logger.info("Pipecat task reference set in WebRTC server")


@app.post("/api/offer")
@app.patch("/api/offer")
async def handle_offer(offer: Dict[str, Any]):
    """Handle WebRTC offer from client."""
    try:
        logger.info(f"Received WebRTC offer: {offer.get('sdp', '')[:50]}...")

        # In a real implementation, you would:
        # 1. Create an RTCPeerConnection
        # 2. Set the remote description (offer)
        # 3. Create an answer
        # 4. Set local description (answer)
        # 5. Return the answer to the client

        # For now, this is a placeholder that would need integration
        # with the actual Pipecat WebRTC transport

        # This is where you'd integrate with the Pipecat WebRTC connection
        # The actual implementation depends on how Pipecat exposes its WebRTC connection

        return JSONResponse({
            "error": "WebRTC signaling integration needed",
            "message": "This endpoint needs to be integrated with Pipecat's WebRTC transport",
            "received_offer_type": offer.get("type"),
            "sdp_preview": offer.get("sdp", "")[:100] + "..." if offer.get("sdp") else None
        })

    except Exception as e:
        logger.error(f"Error handling WebRTC offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/status")
async def get_status():
    """Get server status."""
    return {
        "status": "running",
        "pipecat_task_connected": pipecat_task is not None,
        "transport_connected": transport is not None
    }


@app.options("/api/offer")
async def options_offer():
    """Handle OPTIONS request for CORS preflight."""
    return JSONResponse(
        status_code=200,
        content={}
    )


def run_server(host: str = "0.0.0.0", port: int = 7860):
    """Run the FastAPI server."""
    logger.info(f"Starting WebRTC signaling server on {host}:{port}")
    logger.info("CORS is configured to allow all origins")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )


if __name__ == "__main__":
    # Check if running in development
    if os.getenv("NODE_ENV") == "development":
        logger.info("Running in development mode")

    run_server()