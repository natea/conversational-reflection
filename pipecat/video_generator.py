"""
Video Generator Module

Generates shareable video content from role-play coaching sessions.
Supports multiple formats optimized for viral social media sharing.
"""

import json
import os
import subprocess
import tempfile
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Optional

from loguru import logger


class VideoFormat(Enum):
    """Target video formats/platforms."""
    TIKTOK = "tiktok"  # 9:16, 60s max, fast-paced
    REELS = "reels"  # 9:16, 90s max
    SHORTS = "shorts"  # 9:16, 60s max
    SQUARE = "square"  # 1:1, for feeds
    LANDSCAPE = "landscape"  # 16:9, for YouTube


class VideoStyle(Enum):
    """Visual styles for generated videos."""
    MINIMALIST = "minimalist"
    EMOTIONAL = "emotional"
    DOCUMENTARY = "documentary"
    ENERGETIC = "energetic"
    THERAPEUTIC = "therapeutic"


@dataclass
class VideoSettings:
    """Configuration for video generation."""
    format: VideoFormat = VideoFormat.TIKTOK
    style: VideoStyle = VideoStyle.EMOTIONAL
    duration_seconds: int = 60
    include_captions: bool = True
    include_music: bool = True
    music_mood: str = "emotional"  # emotional, uplifting, dramatic, calm
    font_style: str = "modern"
    color_scheme: str = "warm"  # warm, cool, monochrome, vibrant


@dataclass
class Highlight:
    """A highlighted moment from a session."""
    timestamp_start: float
    timestamp_end: float
    text: str
    speaker: str  # "user" or "coach" or contact name
    emotion: str
    impact_score: float  # 0-1
    category: str  # "breakthrough", "boundary", "emotional", "learning"


@dataclass
class SessionRecording:
    """Recorded session data."""
    session_id: str
    contact: str
    scenario: str
    start_time: datetime
    end_time: Optional[datetime] = None
    exchanges: list[dict] = field(default_factory=list)
    audio_chunks: list[bytes] = field(default_factory=list)
    highlights: list[Highlight] = field(default_factory=list)
    coaching_scores: list[dict] = field(default_factory=list)


# Global storage for recordings (in production, use proper storage)
active_recordings: dict[str, SessionRecording] = {}
completed_recordings: dict[str, SessionRecording] = {}


def start_recording(session_name: str, contact: str, scenario: str) -> dict[str, Any]:
    """Start recording a new session.
    
    Args:
        session_name: Name for this recording session
        contact: The contact being role-played
        scenario: The scenario description
        
    Returns:
        Recording session info
    """
    session_id = f"rec_{session_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    recording = SessionRecording(
        session_id=session_id,
        contact=contact,
        scenario=scenario,
        start_time=datetime.now()
    )
    
    active_recordings[session_id] = recording
    
    logger.info(f"Started recording session: {session_id}")
    
    return {
        "status": "recording",
        "session_id": session_id,
        "contact": contact,
        "scenario": scenario,
        "started_at": recording.start_time.isoformat()
    }


def stop_recording(session_id: str) -> dict[str, Any]:
    """Stop an active recording.
    
    Args:
        session_id: The session to stop recording
        
    Returns:
        Recording summary
    """
    if session_id not in active_recordings:
        return {"status": "error", "message": f"No active recording: {session_id}"}
    
    recording = active_recordings.pop(session_id)
    recording.end_time = datetime.now()
    completed_recordings[session_id] = recording
    
    duration = (recording.end_time - recording.start_time).total_seconds()
    
    logger.info(f"Stopped recording session: {session_id}, duration: {duration:.1f}s")
    
    return {
        "status": "stopped",
        "session_id": session_id,
        "duration_seconds": duration,
        "exchange_count": len(recording.exchanges),
        "highlight_count": len(recording.highlights)
    }


def add_exchange(session_id: str, speaker: str, text: str, 
                 emotion: Optional[str] = None,
                 coaching_score: Optional[dict] = None) -> dict[str, Any]:
    """Add an exchange to an active recording.
    
    Args:
        session_id: The recording session
        speaker: Who spoke ("user", "coach", or contact name)
        text: What was said
        emotion: Detected emotion
        coaching_score: Score breakdown if applicable
        
    Returns:
        Exchange info
    """
    if session_id not in active_recordings:
        return {"status": "error", "message": f"No active recording: {session_id}"}
    
    recording = active_recordings[session_id]
    timestamp = (datetime.now() - recording.start_time).total_seconds()
    
    exchange = {
        "timestamp": timestamp,
        "speaker": speaker,
        "text": text,
        "emotion": emotion
    }
    
    recording.exchanges.append(exchange)
    
    if coaching_score:
        recording.coaching_scores.append({
            "timestamp": timestamp,
            **coaching_score
        })
    
    return {
        "status": "added",
        "exchange_number": len(recording.exchanges),
        "timestamp": timestamp
    }


def extract_highlights(session_id: str, 
                       highlight_count: int = 5,
                       focus: str = "all") -> dict[str, Any]:
    """Extract highlight moments from a recorded session.
    
    Args:
        session_id: The session to analyze
        highlight_count: Number of highlights to extract
        focus: What to focus on - "all", "breakthroughs", "boundaries", "emotional"
        
    Returns:
        List of highlighted moments
    """
    if session_id not in completed_recordings:
        # Check active too
        if session_id in active_recordings:
            recording = active_recordings[session_id]
        else:
            return {"status": "error", "message": f"Recording not found: {session_id}"}
    else:
        recording = completed_recordings[session_id]
    
    highlights = _analyze_for_highlights(recording, highlight_count, focus)
    
    # Store highlights back on recording
    recording.highlights = highlights
    
    return {
        "status": "success",
        "session_id": session_id,
        "highlight_count": len(highlights),
        "highlights": [
            {
                "start": h.timestamp_start,
                "end": h.timestamp_end,
                "text": h.text,
                "speaker": h.speaker,
                "emotion": h.emotion,
                "impact_score": h.impact_score,
                "category": h.category
            }
            for h in highlights
        ],
        "total_duration": (recording.end_time - recording.start_time).total_seconds() if recording.end_time else None
    }


def _analyze_for_highlights(recording: SessionRecording, 
                            count: int, 
                            focus: str) -> list[Highlight]:
    """Analyze exchanges to find highlight-worthy moments.
    
    Args:
        recording: The session recording
        count: Number of highlights to extract
        focus: What type of moments to focus on
        
    Returns:
        List of highlights sorted by impact
    """
    highlights: list[Highlight] = []
    
    # Keywords that indicate breakthrough moments
    breakthrough_keywords = [
        "realize", "understand", "never thought", "you're right",
        "i see now", "that makes sense", "breakthrough", "wow",
        "i didn't consider", "perspective"
    ]
    
    # Keywords for boundary-setting moments
    boundary_keywords = [
        "i need", "it's not okay", "i won't accept", "boundary",
        "my limit", "i deserve", "not acceptable", "stop",
        "respect my", "i choose"
    ]
    
    # Emotional intensity keywords
    emotional_keywords = [
        "hurt", "angry", "frustrated", "scared", "anxious",
        "proud", "relieved", "hopeful", "loved", "supported",
        "overwhelmed", "grateful", "empowered"
    ]
    
    for i, exchange in enumerate(recording.exchanges):
        text_lower = exchange["text"].lower()
        speaker = exchange["speaker"]
        timestamp = exchange["timestamp"]
        emotion = exchange.get("emotion", "neutral")
        
        # Score this exchange
        impact_score = 0.0
        category = "general"
        
        # Check for breakthroughs (user)
        if speaker == "user":
            breakthrough_matches = sum(1 for kw in breakthrough_keywords if kw in text_lower)
            if breakthrough_matches > 0:
                impact_score += 0.3 * breakthrough_matches
                category = "breakthrough"
        
        # Check for boundary moments (user)
        if speaker == "user":
            boundary_matches = sum(1 for kw in boundary_keywords if kw in text_lower)
            if boundary_matches > 0:
                impact_score += 0.25 * boundary_matches
                if category == "general":
                    category = "boundary"
        
        # Check for emotional moments (any speaker)
        emotional_matches = sum(1 for kw in emotional_keywords if kw in text_lower)
        if emotional_matches > 0:
            impact_score += 0.2 * emotional_matches
            if category == "general":
                category = "emotional"
        
        # Boost for coaching responses that got high scores
        if i > 0 and recording.coaching_scores:
            for score in recording.coaching_scores:
                if abs(score["timestamp"] - timestamp) < 5:  # Within 5 seconds
                    avg_score = sum(score.get(k, 0) for k in 
                                    ["boundary_clarity", "assertiveness", "de_escalation"] 
                                    if k in score) / 3
                    if avg_score >= 7:
                        impact_score += 0.3
                        category = "learning"
        
        # Filter by focus
        if focus != "all":
            focus_map = {
                "breakthroughs": "breakthrough",
                "boundaries": "boundary",
                "emotional": "emotional"
            }
            if focus in focus_map and category != focus_map[focus]:
                continue
        
        if impact_score > 0.2:  # Threshold for highlight
            # Find the end time (next exchange or +5 seconds)
            if i + 1 < len(recording.exchanges):
                end_time = recording.exchanges[i + 1]["timestamp"]
            else:
                end_time = timestamp + 5.0
            
            highlight = Highlight(
                timestamp_start=timestamp,
                timestamp_end=end_time,
                text=exchange["text"],
                speaker=speaker,
                emotion=emotion,
                impact_score=min(1.0, impact_score),
                category=category
            )
            highlights.append(highlight)
    
    # Sort by impact and take top N
    highlights.sort(key=lambda h: h.impact_score, reverse=True)
    return highlights[:count]


def generate_video(session_id: str,
                   format: str = "tiktok",
                   style: str = "emotional",
                   include_captions: bool = True,
                   title: Optional[str] = None) -> dict[str, Any]:
    """Generate a shareable video from a recorded session.
    
    Args:
        session_id: The session to generate video from
        format: Target platform format
        style: Visual style for the video
        include_captions: Whether to burn in captions
        title: Optional title overlay
        
    Returns:
        Video generation result with file path
    """
    if session_id not in completed_recordings:
        return {"status": "error", "message": f"Recording not found: {session_id}"}
    
    recording = completed_recordings[session_id]
    
    # Ensure highlights are extracted
    if not recording.highlights:
        extract_highlights(session_id)
    
    # Parse format and style
    try:
        video_format = VideoFormat(format.lower())
    except ValueError:
        video_format = VideoFormat.TIKTOK
    
    try:
        video_style = VideoStyle(style.lower())
    except ValueError:
        video_style = VideoStyle.EMOTIONAL
    
    settings = VideoSettings(
        format=video_format,
        style=video_style,
        include_captions=include_captions
    )
    
    # Generate the video
    try:
        output_path = _create_video(recording, settings, title)
        
        return {
            "status": "success",
            "session_id": session_id,
            "video_path": str(output_path),
            "format": format,
            "style": style,
            "duration_seconds": settings.duration_seconds,
            "highlights_included": len(recording.highlights),
            "has_captions": include_captions
        }
    except Exception as e:
        logger.error(f"Video generation failed: {e}")
        return {
            "status": "error",
            "message": str(e),
            "session_id": session_id
        }


def _create_video(recording: SessionRecording, 
                  settings: VideoSettings,
                  title: Optional[str]) -> Path:
    """Create the actual video file.
    
    This is a stub that generates a placeholder video.
    In production, this would use FFmpeg or a video service.
    
    Args:
        recording: The session recording
        settings: Video generation settings
        title: Optional title text
        
    Returns:
        Path to generated video
    """
    # Get format dimensions
    dimensions = {
        VideoFormat.TIKTOK: (1080, 1920),
        VideoFormat.REELS: (1080, 1920),
        VideoFormat.SHORTS: (1080, 1920),
        VideoFormat.SQUARE: (1080, 1080),
        VideoFormat.LANDSCAPE: (1920, 1080)
    }
    
    width, height = dimensions.get(settings.format, (1080, 1920))
    
    # Create output directory
    output_dir = Path(tempfile.gettempdir()) / "roleplay_videos"
    output_dir.mkdir(exist_ok=True)
    
    output_path = output_dir / f"{recording.session_id}_{settings.format.value}.mp4"
    
    # Generate video metadata file (for now, actual video gen would need FFmpeg)
    metadata = {
        "session_id": recording.session_id,
        "contact": recording.contact,
        "scenario": recording.scenario,
        "format": settings.format.value,
        "style": settings.style.value,
        "dimensions": {"width": width, "height": height},
        "duration_target": settings.duration_seconds,
        "captions_enabled": settings.include_captions,
        "title": title or f"Role-Play: {recording.scenario}",
        "highlights": [
            {
                "start": h.timestamp_start,
                "end": h.timestamp_end,
                "text": h.text,
                "speaker": h.speaker,
                "category": h.category
            }
            for h in recording.highlights
        ],
        "exchanges": recording.exchanges
    }
    
    # Save metadata
    metadata_path = output_path.with_suffix(".json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    
    logger.info(f"Video metadata saved to: {metadata_path}")
    
    # Attempt to generate actual video with FFmpeg if available
    if _ffmpeg_available():
        _generate_ffmpeg_video(metadata, output_path, settings)
    else:
        # Create a placeholder script that could be run later
        script_path = output_path.with_suffix(".sh")
        _create_ffmpeg_script(metadata, script_path, settings)
        logger.info(f"FFmpeg script saved to: {script_path}")
        # Return the metadata path since we can't generate video
        return metadata_path
    
    return output_path


def _ffmpeg_available() -> bool:
    """Check if FFmpeg is available."""
    try:
        subprocess.run(["ffmpeg", "-version"], 
                      capture_output=True, 
                      timeout=5)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def _generate_ffmpeg_video(metadata: dict, 
                            output_path: Path,
                            settings: VideoSettings) -> None:
    """Generate actual video using FFmpeg.
    
    Creates a video with:
    - Text overlays for dialogue
    - Background gradient
    - Caption burns
    
    Args:
        metadata: Video metadata
        output_path: Where to save the video
        settings: Video settings
    """
    width = metadata["dimensions"]["width"]
    height = metadata["dimensions"]["height"]
    duration = settings.duration_seconds
    
    # Style-based colors
    colors = {
        VideoStyle.MINIMALIST: ("black", "white"),
        VideoStyle.EMOTIONAL: ("navy", "peachpuff"),
        VideoStyle.DOCUMENTARY: ("gray", "white"),
        VideoStyle.ENERGETIC: ("purple", "yellow"),
        VideoStyle.THERAPEUTIC: ("teal", "lavender")
    }
    
    bg_color, text_color = colors.get(settings.style, ("black", "white"))
    
    # Build filter complex for text overlays
    highlights = metadata.get("highlights", [])
    
    # Create base video with gradient background
    filter_parts = [
        f"color=c={bg_color}:s={width}x{height}:d={duration}"
    ]
    
    # Add text for each highlight
    for i, h in enumerate(highlights[:5]):  # Limit to 5 highlights
        start_time = min(h["start"], duration - 5)
        text = h["text"][:100].replace("'", "\\'")  # Escape and truncate
        speaker = h["speaker"]
        
        filter_parts.append(
            f"drawtext=text='{speaker}: {text}':fontcolor={text_color}"
            f":fontsize=48:x=(w-text_w)/2:y=h-200"
            f":enable='between(t,{start_time},{start_time + 5})'"
        )
    
    # Title overlay
    title = metadata.get("title", "Role-Play Coaching")[:50]
    filter_parts.append(
        f"drawtext=text='{title}':fontcolor={text_color}"
        f":fontsize=64:x=(w-text_w)/2:y=100:enable='between(t,0,3)'"
    )
    
    filter_complex = ",".join(filter_parts)
    
    # Build FFmpeg command
    cmd = [
        "ffmpeg", "-y",
        "-filter_complex", filter_complex,
        "-t", str(duration),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        str(output_path)
    ]
    
    try:
        subprocess.run(cmd, capture_output=True, timeout=120, check=True)
        logger.info(f"Video generated: {output_path}")
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg failed: {e.stderr.decode()}")
        raise RuntimeError(f"Video generation failed: {e}")


def _create_ffmpeg_script(metadata: dict, 
                          script_path: Path,
                          settings: VideoSettings) -> None:
    """Create a shell script for later video generation.
    
    Args:
        metadata: Video metadata
        script_path: Where to save the script
        settings: Video settings
    """
    width = metadata["dimensions"]["width"]
    height = metadata["dimensions"]["height"]
    duration = settings.duration_seconds
    
    script = f"""#!/bin/bash
# Video Generation Script for: {metadata['session_id']}
# Generated: {datetime.now().isoformat()}

# Requires FFmpeg with libx264

OUTPUT="{script_path.with_suffix('.mp4')}"

ffmpeg -y \\
  -f lavfi -i color=c=navy:s={width}x{height}:d={duration} \\
  -vf "drawtext=text='{metadata.get('title', 'Role-Play')}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=100" \\
  -t {duration} \\
  -c:v libx264 \\
  -pix_fmt yuv420p \\
  "$OUTPUT"

echo "Video saved to: $OUTPUT"
"""
    
    with open(script_path, "w") as f:
        f.write(script)
    
    # Make executable
    script_path.chmod(0o755)


def get_recording(session_id: str) -> Optional[SessionRecording]:
    """Get a recording by ID.
    
    Args:
        session_id: The session ID
        
    Returns:
        The recording if found
    """
    return completed_recordings.get(session_id) or active_recordings.get(session_id)


def list_recordings() -> list[dict[str, Any]]:
    """List all recordings.
    
    Returns:
        List of recording summaries
    """
    all_recordings = []
    
    for sid, rec in active_recordings.items():
        all_recordings.append({
            "session_id": sid,
            "status": "recording",
            "contact": rec.contact,
            "scenario": rec.scenario,
            "started_at": rec.start_time.isoformat(),
            "exchanges": len(rec.exchanges)
        })
    
    for sid, rec in completed_recordings.items():
        all_recordings.append({
            "session_id": sid,
            "status": "completed",
            "contact": rec.contact,
            "scenario": rec.scenario,
            "started_at": rec.start_time.isoformat(),
            "ended_at": rec.end_time.isoformat() if rec.end_time else None,
            "exchanges": len(rec.exchanges),
            "highlights": len(rec.highlights)
        })
    
    return all_recordings


# Export helper for serialization
def to_dict(obj: Any) -> dict:
    """Convert dataclass to dictionary."""
    if hasattr(obj, "__dataclass_fields__"):
        result = {}
        for field_name in obj.__dataclass_fields__:
            value = getattr(obj, field_name)
            if isinstance(value, Enum):
                result[field_name] = value.value
            elif isinstance(value, datetime):
                result[field_name] = value.isoformat()
            elif isinstance(value, list):
                result[field_name] = [to_dict(item) if hasattr(item, "__dataclass_fields__") else item for item in value]
            elif hasattr(value, "__dataclass_fields__"):
                result[field_name] = to_dict(value)
            else:
                result[field_name] = value
        return result
    return obj
