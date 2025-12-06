# UX Architect Skill

## Overview
This skill represents the methodology and approach of a Senior UX Architect from Airbnb. It provides frameworks for conducting comprehensive UX audits, designing user-centered experiences, and delivering actionable recommendations that balance business goals with user needs.

## Core Philosophy

### The Airbnb Design Principles Applied
1. **Unified Simplicity** - Reduce cognitive load through consistent patterns
2. **Human-Centered Trust** - Build confidence through transparency and feedback
3. **Progressive Disclosure** - Reveal complexity only when needed
4. **Emotional Resonance** - Design for how users feel, not just what they do
5. **Accessible by Default** - Inclusive design is better design for everyone

## UX Audit Framework

### Phase 1: Understanding
Before critiquing, understand the product's:
- **Core Value Proposition** - What problem does this solve?
- **Target Users** - Who are they and what do they need?
- **Key User Journeys** - What are the critical paths?
- **Business Constraints** - What limitations exist?
- **Technical Context** - What's feasible?

### Phase 2: Heuristic Evaluation
Evaluate against Nielsen-Norman heuristics adapted for modern apps:

1. **Visibility of System Status**
   - Is the user always aware of what's happening?
   - Are loading states, progress indicators, and feedback clear?
   - Does the interface respond to user actions immediately?

2. **Match Between System and Real World**
   - Does the language match user mental models?
   - Are metaphors intuitive and consistent?
   - Does information appear in natural, logical order?

3. **User Control and Freedom**
   - Can users easily undo actions?
   - Are there clear exit points from flows?
   - Can users navigate without feeling trapped?

4. **Consistency and Standards**
   - Do similar elements behave the same way?
   - Does the design follow platform conventions?
   - Is visual language consistent throughout?

5. **Error Prevention**
   - Does the design prevent errors before they occur?
   - Are destructive actions properly guarded?
   - Is there appropriate input validation?

6. **Recognition Rather Than Recall**
   - Are options visible when needed?
   - Is context maintained across interactions?
   - Can users accomplish tasks without memorization?

7. **Flexibility and Efficiency**
   - Are there shortcuts for expert users?
   - Can the interface adapt to different use patterns?
   - Is the experience efficient for repeated use?

8. **Aesthetic and Minimalist Design**
   - Does every element serve a purpose?
   - Is visual hierarchy clear?
   - Is the information density appropriate?

9. **Error Recovery**
   - Are error messages clear and actionable?
   - Do users understand how to recover?
   - Is the path back to success obvious?

10. **Help and Documentation**
    - Is guidance available when needed?
    - Is onboarding effective?
    - Can users learn the interface incrementally?

### Phase 3: Journey Analysis
Map and evaluate each user journey:

```
┌──────────────────────────────────────────────────────────────┐
│ JOURNEY MAPPING TEMPLATE                                      │
├──────────┬───────────┬───────────┬───────────┬───────────────┤
│ Stage    │ User Goal │ Actions   │ Pain      │ Opportunity   │
│          │           │           │ Points    │               │
├──────────┼───────────┼───────────┼───────────┼───────────────┤
│ Discover │           │           │           │               │
│ Onboard  │           │           │           │               │
│ Engage   │           │           │           │               │
│ Convert  │           │           │           │               │
│ Retain   │           │           │           │               │
└──────────┴───────────┴───────────┴───────────┴───────────────┘
```

### Phase 4: Information Architecture Review
Evaluate structure and navigation:

- **Hierarchy** - Is the content organized logically?
- **Navigation** - Can users find what they need?
- **Labeling** - Are labels clear and consistent?
- **Search** - Is search effective when navigation fails?
- **Wayfinding** - Do users always know where they are?

### Phase 5: Interaction Design Analysis
Evaluate micro and macro interactions:

- **Affordances** - Do elements look interactive when they are?
- **Feedback** - Is every action acknowledged?
- **States** - Are all states (hover, active, disabled, loading) clear?
- **Transitions** - Do animations serve purpose?
- **Touch/Click Targets** - Are interactive areas appropriately sized?

### Phase 6: Accessibility Audit
Evaluate WCAG 2.1 AA compliance:

- **Perceivable** - Can all content be perceived by all users?
- **Operable** - Can all functionality be operated by all users?
- **Understandable** - Can all users understand the content and operation?
- **Robust** - Does content work with assistive technologies?

Key checkpoints:
- Color contrast ratios (4.5:1 text, 3:1 UI components)
- Keyboard navigation completeness
- Screen reader compatibility
- Focus management
- Alternative text for images
- Form label associations

## Recommendation Framework

### Severity Classification
Rate issues by impact and frequency:

| Severity | Impact | Frequency | Action |
|----------|--------|-----------|--------|
| **Critical** | Blocks task completion | Common flows | Fix immediately |
| **Major** | Causes significant friction | Regular occurrence | Fix in next sprint |
| **Minor** | Suboptimal but workable | Occasional | Queue for improvement |
| **Enhancement** | Nice to have | N/A | Backlog for refinement |

### Recommendation Structure
For each finding, provide:

```markdown
## [Issue Title]

**Severity:** Critical / Major / Minor / Enhancement
**Heuristic:** [Which principle is violated]
**Location:** [Where in the product]

### Current State
[Describe what exists now]

### Problem
[Explain the user impact]

### Recommendation
[Specific, actionable solution]

### Rationale
[Why this solution works]

### Implementation Notes
[Technical considerations]
```

## Output Templates

### Executive Summary
```markdown
# UX Audit: [Product Name]

## Overall Assessment
[2-3 sentence summary of findings]

## Key Metrics
- Critical Issues: X
- Major Issues: X
- Minor Issues: X
- Enhancements: X

## Top Priorities
1. [Most important fix]
2. [Second priority]
3. [Third priority]

## Quick Wins
- [Easy fix with high impact]
- [Easy fix with high impact]

## Long-term Improvements
- [Strategic enhancement]
- [Strategic enhancement]
```

### Detailed Findings Report
```markdown
# Detailed UX Findings

## Information Architecture
[Findings about structure and navigation]

## Interaction Design
[Findings about how users interact]

## Visual Design
[Findings about aesthetics and clarity]

## Content & Copy
[Findings about language and messaging]

## Accessibility
[Findings about inclusive design]

## Performance Perception
[Findings about perceived speed and responsiveness]
```

## Design Critique Process

### The Three-Part Critique
1. **What's Working** - Acknowledge successful patterns
2. **What's Confusing** - Identify unclear elements
3. **What's Missing** - Note gaps in the experience

### Constructive Feedback Principles
- Be specific, not vague
- Describe problems, don't prescribe solutions (initially)
- Focus on user impact, not personal preference
- Provide context for recommendations
- Prioritize ruthlessly

## Common Patterns to Check

### Navigation Patterns
- [ ] Primary navigation is visible and consistent
- [ ] Back/breadcrumb navigation is available
- [ ] Current location is always indicated
- [ ] Related content is discoverable
- [ ] Search is accessible when navigation fails

### Form Patterns
- [ ] Labels are clear and visible
- [ ] Required fields are indicated
- [ ] Validation is inline and immediate
- [ ] Error messages are specific and helpful
- [ ] Success states are confirmed

### Empty States
- [ ] Empty states explain the situation
- [ ] Clear call-to-action to resolve emptiness
- [ ] Appropriate tone (not blaming user)
- [ ] Visual interest maintained

### Loading States
- [ ] Loading is indicated immediately
- [ ] Progress is shown when possible
- [ ] Skeleton screens for predictable content
- [ ] Timeout handling exists

### Error States
- [ ] Error cause is explained
- [ ] Recovery path is clear
- [ ] Tone is reassuring, not alarming
- [ ] Technical details hidden unless needed

## Mobile-Specific Considerations

### Touch Interactions
- Minimum touch target: 44x44px (iOS) / 48x48px (Android)
- Adequate spacing between touch targets
- Swipe gestures have alternatives
- No hover-dependent interactions

### Responsive Behavior
- Content prioritization for small screens
- Collapsible/progressive disclosure patterns
- Appropriate input types for mobile keyboards
- Consideration for thumb zones

## Voice/Conversational UI Considerations

### Voice-First Patterns
- Clear visual feedback for voice states
- Transcription display and correction
- Fallback to text input
- Error recovery for misrecognition
- Privacy controls clearly communicated

### Conversational Design
- Natural language processing expectations managed
- Turn-taking is clear
- Context is maintained
- Conversation history is accessible
- Exit/restart options available

## Deliverables Checklist

When completing a UX audit, provide:

- [ ] Executive summary with prioritized findings
- [ ] Detailed findings document
- [ ] Annotated screenshots highlighting issues
- [ ] Journey maps showing pain points
- [ ] Wireframes for key recommendations (optional)
- [ ] Implementation roadmap with effort estimates

## Example Invocation

"Conduct a UX audit of this emotional reflection application. Evaluate the information architecture, interaction patterns, accessibility, and overall user experience. Provide prioritized recommendations for improvement."

The skill will:
1. Analyze the product brief and understand intentions
2. Evaluate each screen against heuristics
3. Map user journeys and identify pain points
4. Check accessibility compliance
5. Deliver structured findings with actionable recommendations
6. Prioritize by severity and implementation effort
