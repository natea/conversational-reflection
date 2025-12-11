#!/usr/bin/env python3
"""
Maya1 TTS Inference Server
Provides HTTP API for text-to-speech generation using Maya1 model
"""

import os
import sys
import base64
import tempfile
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchaudio
import soundfile as sf
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
TEMP_DIR = Path(tempfile.gettempdir()) / "maya-tts"
TEMP_DIR.mkdir(exist_ok=True)

MODEL_NAME = "maya-research/maya1"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Pydantic models for request validation
class SpeakAsContactRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice_description: str = Field(..., min_length=1)
    emotion_tags: List[str] = Field(default_factory=list)

class SpeakReflectionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice_description: str
    tone: str = "neutral"

class PreviewVoiceRequest(BaseModel):
    voice_description: str = Field(..., min_length=1)
    sample_text: str = "Hello, this is how I sound."


@dataclass
class AudioResult:
    audio_path: str
    audio_base64: str
    duration_seconds: float


class MayaTTS:
    """Maya1 TTS Model Wrapper"""

    def __init__(self, model_name: str = MODEL_NAME, device: str = DEVICE):
        self.model_name = model_name
        self.device = device
        self.model = None
        self.tokenizer = None
        self.sample_rate = 24000  # Maya1 default sample rate

        logger.info(f"Initializing Maya TTS on device: {device}")
        # Lazy loading - model will be loaded on first inference

    def _load_model(self):
        """Lazy load the model and tokenizer"""
        if self.model is not None:
            return

        try:
            logger.info(f"Loading Maya1 model: {self.model_name}")

            # NOTE: Maya1 is not yet publicly available on HuggingFace
            # This is a placeholder implementation that simulates the expected API
            # When Maya1 is released, uncomment the following lines:

            # from transformers import AutoModelForCausalLM, AutoTokenizer
            # self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            # self.model = AutoModelForCausalLM.from_pretrained(
            #     self.model_name,
            #     torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            #     device_map="auto" if self.device == "cuda" else None
            # )
            # self.model.eval()

            logger.warning(
                "Maya1 model not yet available. Using placeholder implementation. "
                "This will generate silent audio files for testing."
            )

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _format_prompt(self, text: str, voice_description: str, emotion_tags: List[str]) -> str:
        """Format the input text with voice description and emotion tags"""
        # Add emotion tags to text
        formatted_text = text
        for tag in emotion_tags:
            # Insert emotion tags naturally in the text
            formatted_text = formatted_text.replace(
                f"[{tag}]", f"<{tag}>"
            )

        # Create the full prompt with voice description
        prompt = f"Voice: {voice_description}\nText: {formatted_text}"
        return prompt

    def _generate_placeholder_audio(self, duration: float = 3.0) -> torch.Tensor:
        """Generate placeholder silent audio for testing"""
        num_samples = int(duration * self.sample_rate)
        # Generate silence
        audio = torch.zeros(1, num_samples, dtype=torch.float32)
        return audio

    def generate(
        self,
        text: str,
        voice_description: str,
        emotion_tags: Optional[List[str]] = None
    ) -> AudioResult:
        """
        Generate speech from text with specified voice characteristics

        Args:
            text: The text to speak
            voice_description: Description of the voice (e.g., "Female voice in her 30s, warm timbre")
            emotion_tags: Optional list of emotion tags (e.g., ["laugh", "sigh"])

        Returns:
            AudioResult containing audio path, base64 data, and duration
        """
        self._load_model()

        if emotion_tags is None:
            emotion_tags = []

        try:
            # Format the prompt
            prompt = self._format_prompt(text, voice_description, emotion_tags)
            logger.info(f"Generating audio for: {prompt[:100]}...")

            # Generate audio
            # NOTE: Replace this with actual Maya1 inference when available
            if self.model is not None:
                # with torch.no_grad():
                #     inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
                #     audio_tensor = self.model.generate(**inputs)
                #     audio = audio_tensor.cpu()
                pass
            else:
                # Placeholder: generate silent audio
                audio = self._generate_placeholder_audio()

            # Save to file
            output_path = TEMP_DIR / f"maya_tts_{os.urandom(8).hex()}.wav"

            # Convert to numpy and save
            audio_np = audio.squeeze().numpy()
            sf.write(str(output_path), audio_np, self.sample_rate)

            # Calculate duration
            duration = len(audio_np) / self.sample_rate

            # Convert to base64
            with open(output_path, "rb") as f:
                audio_bytes = f.read()
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

            logger.info(f"Generated audio: {output_path} ({duration:.2f}s)")

            return AudioResult(
                audio_path=str(output_path),
                audio_base64=audio_base64,
                duration_seconds=duration
            )

        except Exception as e:
            logger.error(f"Audio generation failed: {e}")
            raise


# Global TTS instance
tts_engine: Optional[MayaTTS] = None


def get_tts_engine() -> MayaTTS:
    """Get or create the global TTS engine instance"""
    global tts_engine
    if tts_engine is None:
        tts_engine = MayaTTS()
    return tts_engine


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "device": DEVICE,
        "model": MODEL_NAME
    }), 200


@app.route('/speak_as_contact', methods=['POST'])
def speak_as_contact():
    """Generate speech as a contact with voice profile and emotions"""
    try:
        # Validate request
        data = SpeakAsContactRequest(**request.json)

        # Generate audio
        tts = get_tts_engine()
        result = tts.generate(
            text=data.text,
            voice_description=data.voice_description,
            emotion_tags=data.emotion_tags
        )

        return jsonify({
            "audio_path": result.audio_path,
            "audio_base64": result.audio_base64,
            "duration_seconds": result.duration_seconds
        }), 200

    except Exception as e:
        logger.error(f"Error in speak_as_contact: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/speak_reflection', methods=['POST'])
def speak_reflection():
    """Generate AI reflection speech"""
    try:
        # Validate request
        data = SpeakReflectionRequest(**request.json)

        # Generate audio (reflections don't use emotion tags)
        tts = get_tts_engine()
        result = tts.generate(
            text=data.text,
            voice_description=data.voice_description,
            emotion_tags=[]
        )

        return jsonify({
            "audio_path": result.audio_path,
            "audio_base64": result.audio_base64,
            "duration_seconds": result.duration_seconds
        }), 200

    except Exception as e:
        logger.error(f"Error in speak_reflection: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/preview_voice', methods=['POST'])
def preview_voice():
    """Generate a voice preview sample"""
    try:
        # Validate request
        data = PreviewVoiceRequest(**request.json)

        # Generate audio
        tts = get_tts_engine()
        result = tts.generate(
            text=data.sample_text,
            voice_description=data.voice_description,
            emotion_tags=[]
        )

        return jsonify({
            "audio_path": result.audio_path,
            "audio_base64": result.audio_base64,
            "duration_seconds": result.duration_seconds
        }), 200

    except Exception as e:
        logger.error(f"Error in preview_voice: {e}")
        return jsonify({"error": str(e)}), 500


def main():
    """Start the Flask server"""
    port = int(os.environ.get("MAYA_TTS_PORT", "8765"))

    logger.info(f"Starting Maya TTS Inference Server on port {port}")
    logger.info(f"Temporary audio directory: {TEMP_DIR}")
    logger.info(f"Device: {DEVICE}")

    # Run the server
    app.run(
        host="127.0.0.1",
        port=port,
        debug=False,
        threaded=True
    )


if __name__ == "__main__":
    main()
