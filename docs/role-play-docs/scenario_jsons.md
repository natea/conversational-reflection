# Scenario JSON Files
## Ready-to-Load Family Scenarios for Demo

Copy each scenario below into its own JSON file in the `scenarios/` directory.

---

## Scenario 1: Sibling Favoritism

**Filename:** `1_sibling_favoritism.json`

```json
{
  "scenario_id": "1_sibling_favoritism",
  "title": "Sibling Favoritism & The Forgotten Child",
  "description": "Parents show clear financial preference for struggling sibling while denying help to self-sufficient adult child",
  "difficulty": "intermediate",
  "emotional_core": ["resentment", "invisibility", "abandonment"],
  "key_dynamics": [
    "parental_preference",
    "financial_disparity",
    "feeling_unheard",
    "accumulated_injustice"
  ],
  "family_members": {
    "protagonist": {
      "role": "adult_child",
      "age_range": "25-40",
      "characteristics": "self-sufficient, employed, responsible",
      "current_situation": "dealing with medical debt"
    },
    "mom": {
      "role": "parent",
      "key_traits": ["defensive", "avoidant", "prioritizes_other_child"],
      "emotional_triggers": [
        "being_called_unfair",
        "comparison_between_children",
        "implied_failure_as_parent"
      ],
      "likely_responses": [
        "That's not fair, we do support you",
        "He needs help more than you do",
        "You're being ungrateful",
        "Your father and I make the best decisions we can",
        "Why are you trying to make this about you?"
      ]
    },
    "dad": {
      "role": "parent",
      "typical_response": "avoidance/leaving the conversation"
    }
  },
  "initial_scenario": {
    "setup": "Mom just bought struggling sibling a car. She said she can't help you with medical debt.",
    "context": "This is not the first time. Pattern has been building for years.",
    "protagonist_emotion": {
      "primary": "resentment",
      "intensity": 8,
      "secondary": ["hurt", "self_doubt", "frustration", "invisibility"]
    },
    "conversation_starter": "I need to call my mom and talk about what just happened"
  },
  "communication_objectives": [
    "express_hurt_without_attacking",
    "set_boundaries_around_enmeshment",
    "process_grief_of_not_being_favorite",
    "decide_future_contact"
  ],
  "teaching_moments": [
    {
      "technique": "I feel statements",
      "why_it_works": "Harder to argue with internal experience than accusations",
      "ineffective": "You always favor him",
      "effective": "I feel invisible when financial help goes to my sibling and not me"
    },
    {
      "technique": "Name the pattern",
      "why_it_works": "Moves from single incident to systemic issue",
      "example": "This has happened multiple times, and it's affecting how I see our relationship"
    },
    {
      "technique": "Set clear boundary",
      "why_it_works": "Prevents continued enmeshment",
      "example": "I need you to acknowledge this pattern exists before we can move forward"
    }
  ],
  "success_metrics": {
    "did_feel_heard": "Scale 1-10",
    "boundary_clarity": "Was it stated clearly without justification?",
    "pattern_recognition": "Did they acknowledge the dynamic?",
    "agency": "Do they feel they have choices?",
    "emotional_containment": "Did they stay grounded or escalate?"
  },
  "likely_conversation_path": {
    "escalation_points": [
      "When person says 'you always favor him'",
      "If person compares themselves to sibling",
      "If person attacks parent's character"
    ],
    "de_escalation_points": [
      "When person says 'I feel'",
      "When person acknowledges parent's perspective",
      "When person focuses on their own needs instead of sibling's failings"
    ]
  }
}
```

---

## Scenario 2: Boundary Violation

**Filename:** `2_boundary_violation.json`

```json
{
  "scenario_id": "2_boundary_violation",
  "title": "The Enmeshed Parent & Boundary Violation",
  "description": "Parent violates adult child's privacy and spreads personal information to family",
  "difficulty": "intermediate",
  "emotional_core": ["violated_privacy", "enmeshment", "shame", "betrayal"],
  "key_dynamics": [
    "boundary_violation",
    "information_weaponization",
    "parental_control",
    "justified_concern_mask"
  ],
  "family_members": {
    "protagonist": {
      "role": "adult_child",
      "age": "28",
      "characteristics": "independent, working on mental health"
    },
    "mom": {
      "role": "overprotective_parent",
      "key_traits": ["intrusive", "controlling", "concerned_facade", "invalidating"],
      "emotional_triggers": [
        "feeling_excluded",
        "loss_of_control",
        "being_told_no",
        "privacy_assertion"
      ],
      "likely_responses": [
        "I'm just looking out for you",
        "After everything I've done for you...",
        "Therapy is a scam",
        "That's ungrateful",
        "I was just worried",
        "You're being ungrateful and hurtful"
      ]
    }
  },
  "initial_scenario": {
    "setup": "Mom went through your phone, found therapy references, and told family you're 'mentally unstable'",
    "context": "Pattern of boundary violations: reading messages, opening mail, commenting on diet/relationships",
    "protagonist_emotion": {
      "primary": "violated",
      "intensity": 9,
      "secondary": ["shame", "anger", "betrayal", "guilt"]
    },
    "conversation_starter": "Mom, I need to talk about what you did with my phone"
  },
  "communication_objectives": [
    "deliver_firm_boundary",
    "avoid_justification_spiral",
    "manage_guilt",
    "establish_consequences",
    "resist_manipulation"
  ],
  "teaching_moments": [
    {
      "technique": "Broken record",
      "why_it_works": "Repeating boundary without new material ends the debate",
      "example": [
        "Mom, my healthcare is not up for discussion",
        "[If she argues] My healthcare is not up for discussion",
        "[If she continues] My healthcare is not up for discussion"
      ]
    },
    {
      "technique": "Don't JADE (Justify, Argue, Defend, Explain)",
      "why_it_works": "Gives more ammunition for continued debate",
      "ineffective": "Therapy actually helps with anxiety, it's not a scam because...",
      "effective": "Mom, this isn't changing. And I need you to know..."
    },
    {
      "technique": "Acknowledge fear without accepting blame",
      "why_it_works": "Validates her emotion while maintaining boundary",
      "example": "I hear that you're worried about me. AND my healthcare is my choice"
    }
  ],
  "success_metrics": {
    "boundary_stated": "Was it clear and firm?",
    "no_overexplaining": "Did they avoid the justification spiral?",
    "guilt_managed": "Did they stay firm despite guilt?",
    "consequence_clarity": "What happens if boundary is violated again?"
  },
  "likely_conversation_path": {
    "escalation_points": [
      "When person defends therapy",
      "When person over-explains their choices",
      "When person accuses mom of not trusting them"
    ],
    "de_escalation_points": [
      "Repeating boundary calmly",
      "Acknowledging her fear",
      "Being willing to reduce contact"
    ]
  }
}
```

---

## Scenario 3: Denial & Gaslighting

**Filename:** `3_denial_gaslighting.json`

```json
{
  "scenario_id": "3_denial_gaslighting",
  "title": "Denial & Reality Check — The Unacknowledged Conflict",
  "description": "Obvious conflict happens. Family denies it occurred. Person pointing it out becomes the problem.",
  "difficulty": "hard",
  "emotional_core": ["gaslighting", "isolation", "self_doubt", "exhaustion"],
  "key_dynamics": [
    "conflict_denial",
    "scapegoating_the_truth_teller",
    "reality_invalidation",
    "anxiety_about_conflict"
  ],
  "family_members": {
    "protagonist": {
      "role": "observer_and_communicator",
      "characteristics": "tries to facilitate understanding, gets blamed for stirring the pot"
    },
    "dad": {
      "role": "dismissed_person",
      "typical_response": "shutdown, withdrawal, crying without resolution"
    },
    "sibling": {
      "role": "secondary_participant",
      "typical_response": "defensive_then_denial",
      "likely_responses": [
        "Nothing happened",
        "You're creating drama",
        "Stop stirring the pot",
        "I don't remember it that way",
        "You're the one making it weird"
      ]
    }
  },
  "initial_scenario": {
    "setup": "Dad dismissive of sibling's expertise. Sibling snapped. Dad shut down and cried. Tension obvious.",
    "context": "You try to name the pattern. Everyone denies it. You're suddenly the problem.",
    "protagonist_emotion": {
      "primary": "gaslit",
      "intensity": 8,
      "secondary": ["self_doubt", "exhaustion", "anger", "isolation"]
    },
    "conversation_starter": "I noticed the tension at dinner. Can we talk about what happened?"
  },
  "communication_objectives": [
    "name_pattern_without_escalating",
    "protect_your_reality",
    "avoid_debate",
    "set_boundary_around_invalidation",
    "accept_you_can't_force_acknowledgment"
  ],
  "teaching_moments": [
    {
      "technique": "Gray-rocking",
      "why_it_works": "Removes fuel for debate. Boring responses end interrogation.",
      "ineffective": "But Dad said X and you said Y and he got upset!",
      "effective": "Okay, I hear you. (End of conversation.)",
      "why": "Takes away material to argue about"
    },
    {
      "technique": "Limit involvement in others' conflicts",
      "why_it_works": "You're not the mediator. Their conflict isn't your responsibility.",
      "example": "I'm going to step out of this. You two can work it out."
    },
    {
      "technique": "Name the pattern macro, not the incident",
      "why_it_works": "Bigger picture harder to deny than single moment",
      "ineffective": "At dinner, you...",
      "effective": "Over time, I notice tension isn't acknowledged, then I'm blamed for naming it"
    }
  ],
  "success_metrics": {
    "stayed_in_reality": "Did they maintain certainty about what happened?",
    "avoided_over_explaining": "Did they resist urge to prove it happened?",
    "exited_gracefully": "Did they remove themselves from the debate?",
    "protected_peace": "Did they choose their wellbeing over family validation?"
  },
  "the_exhaustion_loop": {
    "cycle": [
      "Conflict happens (obvious to everyone)",
      "You name it: 'That was tense'",
      "Family denies it: 'Nothing happened'",
      "You try to point out evidence: 'But X happened'",
      "Now YOU'RE the problem: 'You're stirring the pot'",
      "You doubt yourself: 'Wait, was I wrong?'",
      "Next conflict... repeat"
    ],
    "why_it_happens": "Family anxiety about conflict is higher than discomfort of denying reality"
  }
}
```

---

## Scenario 4: Parental Absence

**Filename:** `4_parental_absence.json`

```json
{
  "scenario_id": "4_parental_absence",
  "title": "Parental Absence & Emotional Neglect",
  "description": "Parent frames unavailability as philosophical stance. Child's need for connection feels pathological.",
  "difficulty": "hard",
  "emotional_core": ["abandonment", "self_blame", "low_self_worth", "grief"],
  "key_dynamics": [
    "emotional_neglect",
    "framing_absence_as_strength",
    "child_internalizes_as_failure",
    "family_normalizes_it"
  ],
  "family_members": {
    "protagonist": {
      "role": "adult_child",
      "situation": "lives alone, would value parental check-in",
      "internalized_message": "my need is too much; I'm too needy"
    },
    "dad": {
      "role": "absent_parent",
      "philosophy": "providing = love",
      "emotional_stance": "detached",
      "likely_responses": [
        "I'm here to ensure this family is prosperous, not to cater to you",
        "That's just how I am",
        "You're being too sensitive",
        "Real men don't need constant check-ins",
        "I show my love through providing"
      ]
    },
    "mom_and_siblings": {
      "role": "normalizers",
      "message": "that's just how dads are; you need to accept it"
    }
  },
  "initial_scenario": {
    "setup": "You asked dad to check in more. He said: 'I'm here to ensure this family is prosperous, not to cater to you'",
    "context": "You live alone. You're not asking for codependency. You're asking for basic engagement.",
    "protagonist_emotion": {
      "primary": "abandoned",
      "intensity": 8,
      "secondary": ["shame", "self_blame", "grief", "questioning_if_need_is_too_much"]
    },
    "conversation_starter": "Dad, what you said really hurt me. Can we talk about it?"
  },
  "communication_objectives": [
    "distinguish_need_from_neediness",
    "grieve_parent_who_won't_show_up",
    "not_accept_excuse_as_explanation",
    "build_chosen_family",
    "hold_grief_and_agency_together"
  ],
  "teaching_moments": [
    {
      "technique": "Healthy need vs. unhealthy neediness",
      "healthy_signs": [
        "Wanting basic connection with parent",
        "Being hurt by consistent absence",
        "Knowing you're worthy of time and effort",
        "Parents matter even as adult"
      ],
      "unhealthy_signs": [
        "Need another to validate existence",
        "Can't function without frequent contact",
        "Guilt-tripping when ignored",
        "Expecting them to fix your life"
      ],
      "your_situation": "You're in the healthy category"
    },
    {
      "technique": "Separate his limitation from your worth",
      "why_it_works": "His inability to show up reflects his capacity, not your value",
      "example": "He can't meet this need. That doesn't mean the need is wrong. It means he's limited."
    },
    {
      "technique": "Shift from 'Why won't he?' to 'What will I do?'",
      "why_it_works": "Moves from powerlessness to agency",
      "example": [
        "'Why won't he call me?' (powerless)",
        "'He won't. So who will show up for me?' (empowered)"
      ]
    }
  ],
  "success_metrics": {
    "need_validation": "Did they recognize their need is legitimate?",
    "stopped_self_blame": "Did they stop internalizing his limitation?",
    "grief_acknowledgment": "Did they accept the loss?",
    "agency_reclaimed": "Are they building connection elsewhere?"
  },
  "the_hard_truth": "He probably won't change. The work is accepting that AND continuing to value yourself. The conversation isn't to convince him you're right. It's to practice speaking your truth and grieving what you didn't get."
}
```

---

## Scenario 5: Scapegoating

**Filename:** `5_scapegoating.json`

```json
{
  "scenario_id": "5_scapegoating",
  "title": "The Scapegoat & Family Coalitions",
  "description": "One family member is designated as 'the problem.' All conflicts get attributed to them.",
  "difficulty": "very_hard",
  "emotional_core": ["injustice", "isolation", "internalized_shame", "hopelessness"],
  "key_dynamics": [
    "scapegoating",
    "family_coalition",
    "entrenched_narratives",
    "role_rigidity"
  ],
  "family_members": {
    "protagonist": {
      "role": "scapegoat",
      "history": "designated problem child, even when not directly involved",
      "pattern": "trying to prove worth while being blamed for family dysfunction"
    },
    "family_coalition": {
      "role": "unified_against_protagonist",
      "function": "scapegoat serves psychological purpose; keeps family functional myth alive",
      "likely_responses": [
        "That's typical of you",
        "You're the reason this family is broken",
        "Why do you always do this?",
        "See, there you go again",
        "I can't believe you're making this about you"
      ]
    }
  },
  "initial_scenario": {
    "setup": "You got into a conflict with mom. She chose sibling's side. Now entire family sees you as the problem.",
    "context": "This isn't first time. You've been the scapegoat for years, even before this specific fight.",
    "protagonist_emotion": {
      "primary": "hopeless",
      "intensity": 9,
      "secondary": ["shame", "isolation", "anger_at_unfairness", "despair"]
    },
    "conversation_starter": "Do I even try to repair this? Or is it time to accept they've decided I'm the problem?"
  },
  "communication_objectives": [
    "understand_family_systems",
    "stop_trying_to_prove_worth",
    "accept_entrenched_narrative",
    "decide_about_contact",
    "reclaim_identity_outside_family_story"
  ],
  "teaching_moments": [
    {
      "technique": "Family systems thinking",
      "why_it_matters": "Scapegoating is a dysfunction, not about you",
      "reality": "Your family system needs someone to blame. If not you, it would be someone else.",
      "not_personal": "This isn't about your actual behavior. It's about family dysfunction."
    },
    {
      "technique": "The myth of one more try",
      "why_it_matters": "Hoping they'll suddenly see you differently keeps you trapped",
      "truth": "If they've decided you're the problem, no amount of 'proving' will change it",
      "release": "Let go of the fantasy where they suddenly understand"
    },
    {
      "technique": "Grief before closure",
      "why_it_matters": "Acknowledging the loss lets you move forward",
      "steps": [
        "Grief that you won't have the family you needed",
        "Accept they may never see you accurately",
        "Then decide what to do about contact"
      ]
    },
    {
      "technique": "Identity outside family narrative",
      "why_it_matters": "You're not who they say you are",
      "reclamation": [
        "Who am I independent of their story?",
        "What do I know about myself?",
        "Who validates the real me?"
      ]
    }
  ],
  "success_metrics": {
    "stopped_trying_to_prove_worth": "Do they stop defending themselves to family?",
    "understood_system": "Do they see scapegoating as family dysfunction, not personal failure?",
    "grieved_the_loss": "Have they accepted the reality of the situation?",
    "made_conscious_choice": "Is their decision about contact based on boundaries, not hope?",
    "reclaimed_identity": "Do they define themselves separate from family story?"
  },
  "the_systems_perspective": {
    "explanation": "Family systems are self-regulating. One member often carries dysfunction for the system. The scapegoat serves a purpose: they give everyone else someone to blame. When the scapegoat stops accepting the role, the system gets uncomfortable. This is often when they get MORE blamed—the system fighting to maintain equilibrium.",
    "what_this_means": "If you become healthier and set boundaries, they may become MORE critical, not less. This isn't because you're doing it wrong. It's because you're refusing to serve your role.",
    "the_hard_choice": "You can either keep serving the role (stay enmeshed) or reject it (face family anger). There's no middle ground where they suddenly see you clearly while you're still in the system."
  }
}
```

---

## Loading Instructions

### Step 1: Create Directory
```bash
mkdir -p conversational-reflection/scenarios
```

### Step 2: Save Each File
```bash
# Save each JSON block above as:
conversational-reflection/scenarios/1_sibling_favoritism.json
conversational-reflection/scenarios/2_boundary_violation.json
conversational-reflection/scenarios/3_denial_gaslighting.json
conversational-reflection/scenarios/4_parental_absence.json
conversational-reflection/scenarios/5_scapegoating.json
```

### Step 3: Verify
```python
import json
from pathlib import Path

scenario_dir = Path("conversational-reflection/scenarios")
for scenario_file in scenario_dir.glob("*.json"):
    with open(scenario_file) as f:
        data = json.load(f)
        print(f"✅ {data['scenario_id']}: {data['title']}")
```

### Step 4: Load into System
```python
from src.scenario_manager import ScenarioManager

manager = ScenarioManager("conversational-reflection/scenarios/")
print(f"Loaded {len(manager.scenarios)} scenarios")

# Start demo with any scenario
scenario = manager.get_scenario("1_sibling_favoritism")
```

