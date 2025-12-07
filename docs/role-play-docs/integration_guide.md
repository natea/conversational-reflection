# Technical Integration Guide
## Loading Family Scenarios into Conversational-Reflection System

---

## Overview

This guide explains how to integrate the 5 family scenarios into the conversational-reflection system for live demo, emotional analysis, and roleplay practice.

---

## System Architecture (Inferred)

Based on research of conversational AI reflection systems, the typical architecture includes:

```
┌──────────────────────────────────────────────────────────┐
│ INPUT LAYER                                              │
│ (User text: their message, emotion cues)                 │
└────────────┬─────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ NLP PIPELINE                                             │
│ • Tokenization & preprocessing                           │
│ • Emotion detection (BERT-based or similar)              │
│ • Intent recognition                                     │
│ • Context understanding                                  │
└────────────┬─────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ DIALOGUE MANAGEMENT                                      │
│ • Select appropriate response strategy                   │
│ • Maintain conversation state                            │
│ • Track emotional trajectory                             │
│ • Generate reflection prompts                            │
└────────────┬─────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ RESPONSE GENERATION                                      │
│ • Generate family member response (LLM-based)            │
│ • Ensure emotional consistency                           │
│ • Provide reflection feedback                            │
└────────────┬─────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ OUTPUT LAYER                                             │
│ • Dialogue text                                          │
│ • Emotional metrics                                      │
│ • Suggested alternatives                                │
│ • Learning feedback                                      │
└──────────────────────────────────────────────────────────┘
```

---

## Data Format for Scenarios

### Scenario JSON Structure

```json
{
  "scenario_id": "1_sibling_favoritism",
  "title": "Sibling Favoritism & The Forgotten Child",
  "difficulty": "intermediate",
  "emotional_core": ["resentment", "invisibility", "abandonment"],
  "key_dynamics": [
    "parental_preference",
    "financial_disparity",
    "feeling_unheard"
  ],
  "family_members": {
    "protagonist": {
      "role": "adult_child",
      "age_range": "25-40",
      "context": "Works full time, self-sufficient, dealing with medical debt"
    },
    "mom": {
      "role": "parent",
      "key_traits": ["defensive", "avoidant", "dismissive"],
      "typical_responses": [
        "That's not fair, we do support you",
        "He needs help more than you do",
        "You're being ungrateful",
        "Your father and I make the best decisions we can"
      ],
      "emotional_triggers": [
        "Being called unfair",
        "Comparison between children",
        "Implied failure as parent"
      ]
    }
  },
  "initial_scenario": {
    "context": "Mom just bought sibling a car; denied help with medical debt",
    "protagonist_emotional_state": {
      "primary_emotion": "resentment",
      "intensity": 8,
      "secondary_emotions": ["hurt", "self_doubt", "frustration"]
    },
    "conversation_starter": "I need to call mom and talk about what just happened"
  },
  "conversation_objectives": [
    "Express hurt without attacking",
    "Set boundaries around financial enmeshment",
    "Process grief of not being favorite",
    "Decide what contact looks like"
  ],
  "teaching_moments": [
    {
      "technique": "I feel statements",
      "why_it_works": "Harder to argue with internal experience than accusations",
      "example": "I feel invisible when financial help goes to my sibling and not me"
    },
    {
      "technique": "Boundary setting",
      "why_it_works": "Clear limits prevent continued enmeshment",
      "example": "I can't keep discussing this if you won't acknowledge the pattern"
    }
  ],
  "success_metrics": {
    "emotional_validation": "Did person feel heard?",
    "boundary_clarity": "Was boundary stated clearly?",
    "pattern_recognition": "Did they identify the family dynamic?",
    "agency": "Did they feel they have choices?"
  }
}
```

### Minimal Input Format for Quick Loading

```json
{
  "scenario_id": "1",
  "title": "Sibling Favoritism",
  "setup": "Mom bought sibling a car but won't help with your medical debt",
  "emotions": ["resentment", "hurt", "invisible"],
  "family_member": "Mom",
  "family_member_traits": ["defensive", "avoidant"],
  "conversation_goal": "Express hurt and set boundaries"
}
```

---

## Implementation Steps

### Step 1: Create Scenario Database

```python
import json
from pathlib import Path

class ScenarioManager:
    def __init__(self, scenarios_dir="scenarios/"):
        self.scenarios_dir = Path(scenarios_dir)
        self.scenarios = self.load_all_scenarios()
    
    def load_all_scenarios(self):
        """Load all scenario JSON files"""
        scenarios = {}
        for scenario_file in self.scenarios_dir.glob("*.json"):
            with open(scenario_file, 'r') as f:
                scenario = json.load(f)
                scenarios[scenario["scenario_id"]] = scenario
        return scenarios
    
    def get_scenario(self, scenario_id):
        return self.scenarios.get(scenario_id)
    
    def get_family_member_context(self, scenario_id, member_role):
        """Get specific family member instructions"""
        scenario = self.get_scenario(scenario_id)
        return scenario["family_members"].get(member_role)

# Usage
manager = ScenarioManager()
scenario = manager.get_scenario("1_sibling_favoritism")
mom_context = manager.get_family_member_context("1_sibling_favoritism", "mom")
```

### Step 2: Initialize Conversation State

```python
class ConversationState:
    def __init__(self, scenario_id, protagonist_emotion_level=None):
        self.scenario_id = scenario_id
        self.messages = []
        self.emotional_trajectory = []
        self.turning_points = []
        
        # Initialize with scenario context
        scenario = manager.get_scenario(scenario_id)
        self.emotional_state = scenario["initial_scenario"]["protagonist_emotional_state"]
    
    def add_message(self, speaker, text, emotion_level=None):
        """Record message and track emotional state"""
        self.messages.append({
            "speaker": speaker,
            "text": text,
            "timestamp": time.time()
        })
        
        if emotion_level:
            self.emotional_trajectory.append(emotion_level)
            self.detect_turning_points()
    
    def detect_turning_points(self):
        """Identify where conversation shifted emotionally"""
        # Implement logic to detect major emotional shifts
        pass

# Usage
conversation = ConversationState("1_sibling_favoritism")
conversation.add_message("protagonist", "Mom, I need to talk about what happened")
```

### Step 3: Emotional Analysis Pipeline

```python
from transformers import pipeline

class EmotionAnalyzer:
    def __init__(self):
        self.emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=5
        )
    
    def analyze(self, text):
        """Detect emotions in text"""
        results = self.emotion_classifier(text)
        
        # Format results
        emotions = {}
        for result in results[0]:
            emotions[result['label']] = result['score']
        
        return emotions
    
    def map_family_emotions(self, protagonist_emotions, scenario_id):
        """Given protagonist emotions, infer family member response"""
        scenario = manager.get_scenario(scenario_id)
        
        # If protagonist shows hurt, family typically responds with:
        # - Defensiveness
        # - Dismissal
        # - Counterattack
        
        family_member_response = self._predict_response(
            protagonist_emotions,
            scenario["family_members"]["mom"]["typical_responses"]
        )
        
        return family_member_response

# Usage
analyzer = EmotionAnalyzer()
emotions = analyzer.analyze("I feel so invisible when you help him but not me")
print(emotions)
# Output: {'sadness': 0.8, 'anger': 0.6, 'fear': 0.4, ...}
```

### Step 4: Response Generation

```python
class FamilyMemberSimulator:
    def __init__(self, scenario_id, family_member_role="mom"):
        self.scenario_id = scenario_id
        self.family_member_role = family_member_role
        self.context = manager.get_family_member_context(
            scenario_id, 
            family_member_role
        )
    
    def generate_response(self, protagonist_message, conversation_history):
        """Generate family member response"""
        
        # Analyze protagonist emotion
        emotions = analyzer.analyze(protagonist_message)
        primary_emotion = max(emotions, key=emotions.get)
        
        # Select appropriate response strategy
        prompt = self._build_prompt(
            protagonist_message,
            self.context,
            conversation_history,
            primary_emotion
        )
        
        # Generate response using LLM
        response = self.llm.generate(prompt)
        
        return response
    
    def _build_prompt(self, message, context, history, emotion):
        """Construct prompt for LLM"""
        
        prompt = f"""
You are {context['role']} in a family conversation.

Your traits: {', '.join(context['key_traits'])}

Your typical responses: {', '.join(context['typical_responses'][:2])}

The other person just said:
"{message}"

They seem to be feeling: {emotion}

Previous messages:
{self._format_history(history)}

Respond as this family member would. Be authentic, not perfect.
Stay in character. Keep it under 2 sentences.
"""
        return prompt

# Usage
simulator = FamilyMemberSimulator("1_sibling_favoritism", "mom")
response = simulator.generate_response(
    "Mom, I feel invisible when you help him but not me",
    conversation_history=[]
)
```

### Step 5: Real-Time Metrics Dashboard

```python
class MetricsDashboard:
    def __init__(self, conversation_state):
        self.conversation = conversation_state
    
    def get_emotional_metrics(self):
        """Current emotional state of both parties"""
        return {
            "protagonist": {
                "primary_emotion": self.conversation.emotional_state["primary_emotion"],
                "intensity": self.conversation.emotional_state["intensity"],
                "trajectory": self.conversation.emotional_trajectory
            },
            "family_member": {
                "defensive": self._measure_defensiveness(),
                "avoidance": self._measure_avoidance(),
                "invalidation": self._measure_invalidation()
            }
        }
    
    def get_communication_metrics(self):
        """How well the conversation is going"""
        return {
            "clarity": self._score_clarity(),
            "firmness": self._score_firmness(),
            "compassion": self._score_compassion(),
            "effectiveness": self._overall_effectiveness()
        }
    
    def get_recommendations(self):
        """What to try next"""
        metrics = self.get_communication_metrics()
        
        recommendations = []
        if metrics["clarity"] < 0.5:
            recommendations.append("Try being more specific about what you need")
        if metrics["compassion"] < 0.4:
            recommendations.append("Acknowledge their perspective before asking for yours")
        
        return recommendations
    
    def _measure_defensiveness(self):
        """Score how defensive family member is being (0-1)"""
        # Count defensive language patterns
        # "That's not fair", "You're ungrateful", etc.
        pass
    
    def _measure_avoidance(self):
        """Score how much they're avoiding the topic"""
        pass
    
    def _measure_invalidation(self):
        """Score how much they're invalidating the other person"""
        pass

# Usage
dashboard = MetricsDashboard(conversation)
metrics = dashboard.get_emotional_metrics()
print(dashboard.get_recommendations())
```

### Step 6: Reflection & Feedback

```python
class ReflectionEngine:
    def __init__(self, scenario_id, conversation_state):
        self.scenario = manager.get_scenario(scenario_id)
        self.conversation = conversation_state
    
    def generate_reflection(self):
        """Post-conversation analysis"""
        
        reflection = {
            "turning_points": self._identify_turning_points(),
            "what_worked": self._analyze_what_worked(),
            "what_could_improve": self._analyze_improvements(),
            "alternative_approaches": self._suggest_alternatives(),
            "learning_moments": self._extract_learning()
        }
        
        return reflection
    
    def _identify_turning_points(self):
        """Where did the conversation shift?"""
        return self.conversation.turning_points
    
    def _analyze_what_worked(self):
        """Which statements softened the family member?"""
        effective_statements = []
        for msg in self.conversation.messages:
            if msg["speaker"] == "protagonist":
                # Check if next response was less defensive
                effectiveness = self._measure_effectiveness(msg)
                if effectiveness > 0.6:
                    effective_statements.append(msg)
        return effective_statements
    
    def _suggest_alternatives(self):
        """For moments that escalated, show alternatives"""
        alternatives = []
        
        for i, msg in enumerate(self.conversation.messages):
            if msg["speaker"] == "protagonist":
                # Check if it escalated
                if self._did_escalate(i):
                    alt = self._generate_alternative(msg)
                    alternatives.append({
                        "original": msg["text"],
                        "alternative": alt,
                        "why_better": "More specific and less accusatory"
                    })
        
        return alternatives

# Usage
reflection = ReflectionEngine(scenario_id, conversation)
feedback = reflection.generate_reflection()
```

---

## File Structure for Implementation

```
conversational-reflection/
├── scenarios/
│   ├── 1_sibling_favoritism.json
│   ├── 2_boundary_violation.json
│   ├── 3_denial_gaslighting.json
│   ├── 4_parental_absence.json
│   └── 5_scapegoating.json
│
├── src/
│   ├── scenario_manager.py
│   ├── conversation_state.py
│   ├── emotion_analyzer.py
│   ├── family_member_simulator.py
│   ├── metrics_dashboard.py
│   ├── reflection_engine.py
│   └── demo_orchestrator.py
│
├── models/
│   └── emotion_classifier_config.json
│
├── outputs/
│   └── demo_results.json
│
└── tests/
    ├── test_emotion_detection.py
    ├── test_response_generation.py
    └── test_metrics.py
```

---

## Demo Orchestration

```python
class DemoOrchestrator:
    def __init__(self, scenario_id):
        self.scenario_id = scenario_id
        self.conversation = ConversationState(scenario_id)
        self.simulator = FamilyMemberSimulator(scenario_id, "mom")
        self.dashboard = MetricsDashboard(self.conversation)
        self.reflection = ReflectionEngine(scenario_id, self.conversation)
    
    def run_interactive_demo(self):
        """Main demo loop"""
        
        print(f"Scenario: {manager.get_scenario(self.scenario_id)['title']}")
        print("---")
        
        while True:
            # Get user input
            user_input = input("You: ")
            
            if user_input.lower() == "quit":
                break
            
            # Add to conversation
            self.conversation.add_message("protagonist", user_input)
            
            # Analyze emotion
            emotions = analyzer.analyze(user_input)
            
            # Generate response
            response = self.simulator.generate_response(
                user_input,
                self.conversation.messages
            )
            
            # Add response
            self.conversation.add_message("family_member", response)
            
            # Display
            print(f"Mom: {response}")
            print()
            
            # Show metrics
            metrics = self.dashboard.get_emotional_metrics()
            print(f"Your emotion: {metrics['protagonist']['primary_emotion']}")
            print(f"Intensity: {metrics['protagonist']['intensity']}/10")
            print()
            
            # Show recommendations
            recommendations = self.dashboard.get_recommendations()
            if recommendations:
                print("Tip:", recommendations[0])
                print()

# Usage
demo = DemoOrchestrator("1_sibling_favoritism")
demo.run_interactive_demo()
```

---

## Live Demo Configuration

```yaml
# demo_config.yaml

scenarios:
  - id: "1_sibling_favoritism"
    title: "Sibling Favoritism"
    duration_sec: 420
    enable_metrics: true
    enable_alternatives: true
    
  - id: "2_boundary_violation"
    title: "Boundary Violation"
    duration_sec: 300
    enable_metrics: true
    enable_alternatives: true

ui_settings:
  layout: "split_screen"  # Left: conversation, Right: metrics
  update_frequency_ms: 500
  font_size: "large"
  color_scheme: "high_contrast"

api_settings:
  emotion_model: "j-hartmann/emotion-english-distilroberta-base"
  response_model: "gpt-4"
  max_response_time_ms: 2000

demo_defaults:
  show_turning_points: true
  highlight_effective_phrases: true
  enable_audience_polling: true
```

---

## Testing Before Live Demo

```python
# Sanity checks
def test_demo_readiness():
    """Verify all systems ready before live demo"""
    
    tests = [
        test_emotion_detection(),
        test_response_generation_speed(),
        test_metrics_calculation(),
        test_scenario_loading(),
        test_ui_rendering(),
        test_api_connectivity()
    ]
    
    for test_name, passed in tests:
        status = "✅" if passed else "❌"
        print(f"{status} {test_name}")
    
    return all(t[1] for t in tests)

if __name__ == "__main__":
    if test_demo_readiness():
        print("\nSystem ready for live demo!")
        demo = DemoOrchestrator("1_sibling_favoritism")
        demo.run_interactive_demo()
    else:
        print("\nFix issues before proceeding")
```

---

## Deployment Checklist

- [ ] All 5 scenarios load correctly
- [ ] Emotion detection works (< 500ms latency)
- [ ] Response generation completes (< 2s latency)
- [ ] Metrics update in real-time
- [ ] Alternative suggestions appear correctly
- [ ] Dashboard displays clearly on demo screen
- [ ] Backup pre-recorded conversations ready
- [ ] Sound system tested (if using audio)
- [ ] Network stable (if using cloud APIs)
- [ ] Facilitator has manual override ready
- [ ] Audience polling system tested
- [ ] Demo ended gracefully (reflection generation)

