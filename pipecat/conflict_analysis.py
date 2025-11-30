"""
Conflict Analysis Module

Analyzes iMessage conversations to identify conflict patterns, triggers,
and communication styles for role-play coaching preparation.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional

from loguru import logger


class PersonaStyle(Enum):
    """Communication styles for difficult people."""
    GUILT_TRIPPING = "guilt-tripping"
    DISMISSIVE = "dismissive"
    VOLATILE = "volatile"
    PASSIVE_AGGRESSIVE = "passive-aggressive"
    CONTROLLING = "controlling"
    VICTIM = "victim"


class ConflictTheme(Enum):
    """Common conflict themes in relationships."""
    CONTROL = "control"
    BOUNDARIES = "boundaries"
    GUILT = "guilt"
    MONEY = "money"
    TIME = "time"
    RESPECT = "respect"
    INDEPENDENCE = "independence"
    EXPECTATIONS = "expectations"
    COMMUNICATION = "communication"
    TRUST = "trust"


@dataclass
class ConflictPattern:
    """Detected conflict pattern in a conversation."""
    theme: ConflictTheme
    frequency: int
    severity: float  # 0-1
    example_messages: list[str] = field(default_factory=list)
    triggers: list[str] = field(default_factory=list)


@dataclass
class EscalationPoint:
    """A point where conversation escalated."""
    timestamp: datetime
    trigger_message: str
    response_message: str
    escalation_type: str  # "threat", "attack", "withdrawal", "ultimatum"


@dataclass
class CommunicationStyle:
    """Analysis of someone's communication style."""
    primary_style: PersonaStyle
    secondary_styles: list[PersonaStyle]
    confidence: float  # 0-1
    indicators: list[str]


@dataclass
class ConflictAnalysis:
    """Complete conflict analysis for a relationship."""
    contact: str
    timeframe: str
    message_count: int
    conflict_patterns: list[ConflictPattern]
    communication_style: CommunicationStyle
    escalation_points: list[EscalationPoint]
    key_triggers: list[str]
    recommendations: list[str]


@dataclass
class RelationshipSummary:
    """Overall relationship health summary."""
    contact: str
    total_messages: int
    positive_ratio: float  # 0-1, ratio of positive to total messages
    conflict_frequency: str  # "rare", "occasional", "frequent", "constant"
    dominant_themes: list[str]
    communication_health: str  # "healthy", "strained", "toxic"
    suggested_approaches: list[str]


# Pattern detection keywords
GUILT_TRIP_PATTERNS = [
    r"after everything i.*(did|done|sacrificed)",
    r"you never think about",
    r"how could you do this to me",
    r"i gave up .* for you",
    r"you.*(selfish|ungrateful)",
    r"i can't believe you would",
    r"you're breaking my heart",
    r"you don't (care|love)",
    r"all i ever wanted",
    r"why do you (hate|hurt) me",
]

DISMISSIVE_PATTERNS = [
    r"you're (overreacting|being dramatic|too sensitive)",
    r"it's not (a big deal|that bad|serious)",
    r"calm down",
    r"you're making .* out of nothing",
    r"why are you so (upset|worked up)",
    r"whatever",
    r"i don't (see|understand) the problem",
    r"you always (blow|make) .* out of proportion",
]

VOLATILE_PATTERNS = [
    r"!!!+",
    r"\b(HATE|ANGRY|FURIOUS)\b",
    r"don't you dare",
    r"how dare you",
    r"i'm done with",
    r"you're dead to me",
    r"never (speak|talk) to me again",
    r"i (hate|can't stand) you",
]

PASSIVE_AGGRESSIVE_PATTERNS = [
    r"fine\.+",
    r"whatever you say",
    r"if that's what you want",
    r"i guess i'm .* wrong",
    r"sure, i'll just",
    r"no, no, it's fine",
    r"must be nice to",
    r"i'm not mad",
    r"do what you want",
]

CONTROLLING_PATTERNS = [
    r"you (should|need to|have to|must)",
    r"i (told|said|asked) you to",
    r"why didn't you (listen|do what)",
    r"you're not allowed",
    r"i don't (want|approve)",
    r"because i said so",
    r"you (can't|won't|shouldn't)",
    r"who said you could",
]

VICTIM_PATTERNS = [
    r"you're (attacking|blaming) me",
    r"i'm always the (bad|wrong) (guy|one)",
    r"nothing i do is (good|right) enough",
    r"you make me feel",
    r"why (does|is) everything .* my fault",
    r"i can't do anything right",
    r"everyone .* against me",
    r"you're being (mean|cruel|unfair)",
]

THREAT_PATTERNS = [
    r"i (won't|will not) (come|attend|be there)",
    r"if you .* then i'll",
    r"don't expect me to",
    r"you'll (regret|be sorry)",
    r"i'm (cutting|not) .* (off|going|coming)",
    r"this is your (last|final)",
]

CONFLICT_THEME_KEYWORDS = {
    ConflictTheme.CONTROL: ["control", "permission", "allow", "let me", "decide"],
    ConflictTheme.BOUNDARIES: ["boundary", "space", "privacy", "my choice", "my decision"],
    ConflictTheme.GUILT: ["guilt", "fault", "blame", "responsible", "owe"],
    ConflictTheme.MONEY: ["money", "pay", "cost", "afford", "financial", "$", "expensive"],
    ConflictTheme.TIME: ["time", "busy", "schedule", "when", "late", "waiting"],
    ConflictTheme.RESPECT: ["respect", "rude", "disrespect", "manners", "polite"],
    ConflictTheme.INDEPENDENCE: ["independent", "adult", "own life", "my own", "grow up"],
    ConflictTheme.EXPECTATIONS: ["expect", "should", "supposed to", "thought you would"],
    ConflictTheme.COMMUNICATION: ["talk", "listen", "hear", "understand", "ignore"],
    ConflictTheme.TRUST: ["trust", "lie", "honest", "truth", "believe"],
}


def _count_pattern_matches(text: str, patterns: list[str]) -> int:
    """Count how many patterns match in text."""
    text_lower = text.lower()
    count = 0
    for pattern in patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            count += 1
    return count


def _detect_communication_style(messages: list[dict]) -> CommunicationStyle:
    """Detect the primary communication style from messages."""
    style_scores = {
        PersonaStyle.GUILT_TRIPPING: 0,
        PersonaStyle.DISMISSIVE: 0,
        PersonaStyle.VOLATILE: 0,
        PersonaStyle.PASSIVE_AGGRESSIVE: 0,
        PersonaStyle.CONTROLLING: 0,
        PersonaStyle.VICTIM: 0,
    }
    
    indicators: dict[PersonaStyle, list[str]] = {s: [] for s in PersonaStyle}
    
    # Only analyze messages from the other person (not from me)
    other_messages = [m for m in messages if not m.get("is_from_me", False)]
    
    for msg in other_messages:
        text = msg.get("text", "")
        
        if _count_pattern_matches(text, GUILT_TRIP_PATTERNS):
            style_scores[PersonaStyle.GUILT_TRIPPING] += 1
            indicators[PersonaStyle.GUILT_TRIPPING].append(text[:100])
        
        if _count_pattern_matches(text, DISMISSIVE_PATTERNS):
            style_scores[PersonaStyle.DISMISSIVE] += 1
            indicators[PersonaStyle.DISMISSIVE].append(text[:100])
        
        if _count_pattern_matches(text, VOLATILE_PATTERNS):
            style_scores[PersonaStyle.VOLATILE] += 1
            indicators[PersonaStyle.VOLATILE].append(text[:100])
        
        if _count_pattern_matches(text, PASSIVE_AGGRESSIVE_PATTERNS):
            style_scores[PersonaStyle.PASSIVE_AGGRESSIVE] += 1
            indicators[PersonaStyle.PASSIVE_AGGRESSIVE].append(text[:100])
        
        if _count_pattern_matches(text, CONTROLLING_PATTERNS):
            style_scores[PersonaStyle.CONTROLLING] += 1
            indicators[PersonaStyle.CONTROLLING].append(text[:100])
        
        if _count_pattern_matches(text, VICTIM_PATTERNS):
            style_scores[PersonaStyle.VICTIM] += 1
            indicators[PersonaStyle.VICTIM].append(text[:100])
    
    # Sort by score
    sorted_styles = sorted(style_scores.items(), key=lambda x: x[1], reverse=True)
    
    primary = sorted_styles[0][0] if sorted_styles[0][1] > 0 else PersonaStyle.DISMISSIVE
    secondary = [s for s, score in sorted_styles[1:3] if score > 0]
    
    total_matches = sum(style_scores.values())
    confidence = min(sorted_styles[0][1] / max(total_matches, 1), 1.0) if total_matches > 0 else 0.3
    
    return CommunicationStyle(
        primary_style=primary,
        secondary_styles=secondary,
        confidence=confidence,
        indicators=indicators[primary][:3]
    )


def _detect_conflict_themes(messages: list[dict]) -> list[ConflictPattern]:
    """Detect conflict themes in messages."""
    theme_counts: dict[ConflictTheme, int] = {t: 0 for t in ConflictTheme}
    theme_examples: dict[ConflictTheme, list[str]] = {t: [] for t in ConflictTheme}
    
    for msg in messages:
        text = msg.get("text", "").lower()
        
        for theme, keywords in CONFLICT_THEME_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    theme_counts[theme] += 1
                    if len(theme_examples[theme]) < 3:
                        theme_examples[theme].append(msg.get("text", "")[:100])
                    break
    
    # Create patterns for themes with significant occurrence
    patterns = []
    total_messages = len(messages)
    
    for theme, count in theme_counts.items():
        if count > 0:
            severity = min(count / max(total_messages * 0.1, 1), 1.0)
            patterns.append(ConflictPattern(
                theme=theme,
                frequency=count,
                severity=severity,
                example_messages=theme_examples[theme],
                triggers=CONFLICT_THEME_KEYWORDS[theme][:3]
            ))
    
    # Sort by frequency
    patterns.sort(key=lambda p: p.frequency, reverse=True)
    return patterns[:5]  # Top 5 themes


def _detect_escalation_points(messages: list[dict]) -> list[EscalationPoint]:
    """Detect points where conversations escalated."""
    escalation_points = []
    
    for i, msg in enumerate(messages):
        text = msg.get("text", "")
        
        # Check for threat patterns
        if _count_pattern_matches(text, THREAT_PATTERNS):
            timestamp = msg.get("timestamp", datetime.now())
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp)
                except:
                    timestamp = datetime.now()
            
            # Get the previous message as trigger
            trigger = messages[i-1].get("text", "") if i > 0 else ""
            
            escalation_points.append(EscalationPoint(
                timestamp=timestamp,
                trigger_message=trigger[:200],
                response_message=text[:200],
                escalation_type="threat"
            ))
        
        # Check for volatile patterns
        elif _count_pattern_matches(text, VOLATILE_PATTERNS):
            timestamp = msg.get("timestamp", datetime.now())
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp)
                except:
                    timestamp = datetime.now()
            
            trigger = messages[i-1].get("text", "") if i > 0 else ""
            
            escalation_points.append(EscalationPoint(
                timestamp=timestamp,
                trigger_message=trigger[:200],
                response_message=text[:200],
                escalation_type="volatile"
            ))
    
    return escalation_points[:10]  # Limit to 10 most recent


def _generate_recommendations(
    style: CommunicationStyle,
    patterns: list[ConflictPattern]
) -> list[str]:
    """Generate coaching recommendations based on analysis."""
    recommendations = []
    
    # Style-based recommendations
    style_recs = {
        PersonaStyle.GUILT_TRIPPING: [
            "Use the Broken Record technique - calmly repeat your boundary without engaging with guilt",
            "Avoid JADE (Justify, Argue, Defend, Explain) - you don't owe explanations",
            "Acknowledge their feelings without accepting responsibility: 'I hear you're upset, and my decision stands'"
        ],
        PersonaStyle.DISMISSIVE: [
            "Don't try to convince them to validate your feelings - state your truth and move on",
            "Use 'I' statements to assert your reality: 'I feel X, regardless of your opinion'",
            "Consider limiting emotional sharing with this person"
        ],
        PersonaStyle.VOLATILE: [
            "Have an exit strategy ready before difficult conversations",
            "Stay calm and lower your voice when they escalate",
            "Consider having important conversations in public or with witnesses"
        ],
        PersonaStyle.PASSIVE_AGGRESSIVE: [
            "Name the behavior directly but calmly: 'It seems like you're upset about something'",
            "Don't take the bait - respond to what they mean, not what they say",
            "Set clear expectations and consequences"
        ],
        PersonaStyle.CONTROLLING: [
            "Assert your autonomy: 'I've made my decision and I'm not looking for input'",
            "Don't ask permission - inform them of your plans",
            "Be prepared for pushback and have responses ready"
        ],
        PersonaStyle.VICTIM: [
            "Don't accept blame that isn't yours",
            "Redirect to facts: 'I understand you feel that way. Here's what actually happened...'",
            "Set limits on how much you'll discuss past grievances"
        ]
    }
    
    if style.primary_style in style_recs:
        recommendations.extend(style_recs[style.primary_style])
    
    # Theme-based recommendations
    if patterns:
        top_theme = patterns[0].theme
        theme_recs = {
            ConflictTheme.BOUNDARIES: "Practice saying 'No' as a complete sentence",
            ConflictTheme.CONTROL: "Repeat 'This is my decision to make' when challenged",
            ConflictTheme.GUILT: "Remember: Their feelings about your choices are theirs to manage",
            ConflictTheme.EXPECTATIONS: "Clarify: 'What you expect and what I can give may be different'",
        }
        if top_theme in theme_recs:
            recommendations.append(theme_recs[top_theme])
    
    return recommendations[:5]


def analyze_conflict_pattern(
    messages: list[dict],
    contact: str,
    timeframe: str = "recent",
    topic: Optional[str] = None
) -> ConflictAnalysis:
    """
    Analyze messages to identify conflict patterns.
    
    Args:
        messages: List of message dicts with text, timestamp, is_from_me
        contact: Contact name/identifier
        timeframe: Description of time period
        topic: Optional specific topic to focus on
    
    Returns:
        ConflictAnalysis with detected patterns, styles, and recommendations
    """
    # Filter by topic if specified
    if topic:
        topic_lower = topic.lower()
        messages = [m for m in messages if topic_lower in m.get("text", "").lower()]
    
    style = _detect_communication_style(messages)
    patterns = _detect_conflict_themes(messages)
    escalations = _detect_escalation_points(messages)
    recommendations = _generate_recommendations(style, patterns)
    
    # Extract key triggers from escalation points
    key_triggers = list(set(
        ep.trigger_message[:50] for ep in escalations if ep.trigger_message
    ))[:5]
    
    return ConflictAnalysis(
        contact=contact,
        timeframe=timeframe,
        message_count=len(messages),
        conflict_patterns=patterns,
        communication_style=style,
        escalation_points=escalations,
        key_triggers=key_triggers,
        recommendations=recommendations
    )


def get_relationship_summary(messages: list[dict], contact: str) -> RelationshipSummary:
    """
    Get an overall relationship health summary.
    
    Args:
        messages: List of message dicts
        contact: Contact name/identifier
    
    Returns:
        RelationshipSummary with health metrics
    """
    total = len(messages)
    if total == 0:
        return RelationshipSummary(
            contact=contact,
            total_messages=0,
            positive_ratio=0.5,
            conflict_frequency="unknown",
            dominant_themes=[],
            communication_health="unknown",
            suggested_approaches=["Get more conversation history for analysis"]
        )
    
    # Analyze communication style
    style = _detect_communication_style(messages)
    patterns = _detect_conflict_themes(messages)
    
    # Count positive vs negative messages
    positive_keywords = ["love", "thank", "happy", "great", "appreciate", "proud", "miss you", "❤️", "😊"]
    negative_keywords = ["angry", "upset", "disappointed", "frustrated", "hate", "wrong", "problem"]
    
    positive_count = 0
    negative_count = 0
    
    for msg in messages:
        text = msg.get("text", "").lower()
        if any(kw in text for kw in positive_keywords):
            positive_count += 1
        if any(kw in text for kw in negative_keywords):
            negative_count += 1
    
    positive_ratio = positive_count / max(positive_count + negative_count, 1)
    
    # Determine conflict frequency
    conflict_messages = sum(p.frequency for p in patterns)
    conflict_rate = conflict_messages / total
    
    if conflict_rate < 0.05:
        conflict_frequency = "rare"
    elif conflict_rate < 0.15:
        conflict_frequency = "occasional"
    elif conflict_rate < 0.30:
        conflict_frequency = "frequent"
    else:
        conflict_frequency = "constant"
    
    # Determine communication health
    if positive_ratio > 0.7 and conflict_frequency in ("rare", "occasional"):
        health = "healthy"
    elif positive_ratio > 0.4 or conflict_frequency == "occasional":
        health = "strained"
    else:
        health = "toxic"
    
    # Suggested approaches
    approaches = []
    if health == "toxic":
        approaches.append("Consider setting firm boundaries or limiting contact")
        approaches.append("Practice the Grey Rock technique")
    elif health == "strained":
        approaches.append("Focus on boundary-setting conversations")
        approaches.append("Use 'I feel' statements to express needs")
    else:
        approaches.append("Maintain healthy communication patterns")
        approaches.append("Address issues as they arise before they escalate")
    
    dominant_themes = [p.theme.value for p in patterns[:3]]
    
    return RelationshipSummary(
        contact=contact,
        total_messages=total,
        positive_ratio=round(positive_ratio, 2),
        conflict_frequency=conflict_frequency,
        dominant_themes=dominant_themes,
        communication_health=health,
        suggested_approaches=approaches
    )


def to_dict(obj: Any) -> dict:
    """Convert dataclass to dict for JSON serialization."""
    if hasattr(obj, "__dataclass_fields__"):
        result = {}
        for field_name in obj.__dataclass_fields__:
            value = getattr(obj, field_name)
            result[field_name] = to_dict(value)
        return result
    elif isinstance(obj, list):
        return [to_dict(item) for item in obj]
    elif isinstance(obj, Enum):
        return obj.value
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj
