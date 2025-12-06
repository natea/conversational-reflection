# Ginger 🫚

**Voice-First Emotional Reflection Companion**

Ginger is a Next.js-based emotional intelligence application that helps users understand their relationships and themselves through multiple psychological lenses. By analyzing conversations from various sources (WhatsApp, Email, iMessage, Journal), Ginger provides insights using different therapeutic frameworks.

## ✨ Features

### 🎯 Core Capabilities

- **Multi-Source Analysis**: Connect and analyze conversations from WhatsApp, Email, iMessage, and personal journals
- **Psychological Lenses**: View your interactions through 5 different therapeutic frameworks
- **Voice-First Interface**: Natural voice input with visual waveform feedback
- **Multiple Interaction Modes**: Reflect, Roleplay, Pattern Recognition, and Somatic practices
- **Artifact System**: Save and organize insights, reflections, and patterns over time

### 🔬 Psychological Lenses

Ginger analyzes conversations through five evidence-based frameworks:

1. **Damasio (Consciousness & Somatic Markers)**
   - Proto-self (body), core consciousness (emotion), extended consciousness (memory)
   - Focus on bodily sensations and somatic markers

2. **CBT (Cognitive Behavioral Therapy)**
   - Thoughts → Feelings → Behaviors cycle
   - Identify cognitive distortions

3. **ACT (Acceptance & Commitment Therapy)**
   - Psychological flexibility
   - Acceptance, defusion, values, committed action

4. **IFS (Internal Family Systems)**
   - Parts work: managers, firefighters, exiles
   - Accessing the Self

5. **Stoic Philosophy**
   - Dichotomy of control
   - Virtue focus and equanimity

### 🎭 Interaction Modes

- **Reflect**: Deep analysis of selected sources through active lenses (default mode in main interface)
- **Roleplay**: Practice difficult conversations with 4-step setup wizard (modal)
- **Patterns**: Cross-source dashboard with trend visualization (modal)
- **Somatic**: Interactive body map with 10-minute guided practice (modal)

## 🛠️ Tech Stack

- **Framework**: [Next.js 14.2](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **State Management**: [Zustand 4.5](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: clsx, tailwind-merge

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts
│   └── page.tsx           # Home page
├── components/
│   ├── features/          # Feature components
│   │   ├── modals/        # Modal components
│   │   │   ├── LensSelector.tsx        # Full lens selection modal
│   │   │   ├── RoleplayModal.tsx       # Roleplay setup modal
│   │   │   ├── PatternAnalysisModal.tsx # Pattern analysis flow
│   │   │   └── SomaticModal.tsx        # Somatic practice modal
│   │   ├── panels/        # Panel components
│   │   │   ├── SourcesPanel.tsx        # Data sources sidebar
│   │   │   ├── ChatPanel.tsx           # Main chat interface
│   │   │   └── ModesPanel.tsx          # Modes navigation panel
│   │   ├── FloatingLensSelector.tsx # Floating lens picker
│   │   └── VoiceInput.tsx          # Enhanced voice/text input
│   ├── layouts/           # Layout components
│   │   └── MainLayout.tsx # Main app layout
│   └── ui/                # UI components
│       ├── Icons.tsx      # Icon components
│       └── Modal.tsx      # Reusable modal base
├── constants/
│   └── index.ts           # Constants (LENSES, MODES arrays)
├── lib/
│   ├── mockData.ts        # Sample data for demo
│   └── utils.ts           # Utility functions (cn, formatters)
├── stores/
│   └── useGingerStore.ts  # Zustand store (app state)
├── styles/
│   └── globals.css        # Global styles & Tailwind
└── types/
    └── index.ts           # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ginger
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 💡 Core Concepts

### Sources

Sources represent different data inputs that Ginger can analyze:

- **WhatsApp**: Message conversations
- **Email**: Email threads
- **iMessage**: Apple Messages
- **Journal**: Personal journal entries

Each source shows:
- Platform icon
- Preview text
- Message/entry count
- Sync status
- Last updated timestamp

### State Management

The application uses Zustand for centralized state management (`useGingerStore`):

```typescript
// Key state properties
- sources: Source[]              // Available data sources
- selectedSourceIds: string[]    // Currently selected sources
- activeLenses: LensType[]       // Active psychological lenses
- messages: Message[]            // Chat history
- activeMode: ModeType          // Current interaction mode
- artifacts: Artifact[]         // Saved insights
- voiceState: VoiceState        // Voice input state
```

### Voice Input

The enhanced voice input component supports multiple states:
- **Idle**: Ready to accept voice input
- **Listening**: Real-time 12-bar waveform visualization at 60fps
- **Breathing Pause**: Detects and acknowledges natural pauses
- **Processing**: Analyzing input through selected lenses
- **Text Mode**: Optional keyboard input

Users can seamlessly toggle between voice and text input modes.

### Artifacts

Artifacts are saved items that persist insights:
- **Reflections**: Deep analysis outputs
- **Patterns**: Identified behavioral patterns
- **Insights**: Saved AI responses
- **Voice Notes**: Recorded reflections
- **Exports**: Exported data/reports

## 🎨 Styling

Ginger uses a custom design system built with Tailwind CSS:

- **Custom Colors**: Lens-specific color schemes (Damasio, CBT, ACT, IFS, Stoic)
- **Typography**: 
  - Headings: Fraunces (warm serif)
  - Body: DM Sans (humanist sans-serif)
  - Monospace: JetBrains Mono (technical elements)
- **Animations**: Smooth transitions, waveform visualization, micro-interactions
- **Responsive**: Mobile-first design approach

Key CSS classes:
- `.message-bubble` - Chat message styling
- `.lens-badge` - Lens indicator badges
- `.mode-card` - Mode selection cards
- `.artifact-card` - Saved artifact cards
- `.voice-listening` - Voice input state visuals

## 🔒 Privacy

> Ginger processes reflections locally. Encrypted & Private.

The application is designed with privacy in mind (note: actual implementation may require backend services for full functionality).

## 📝 Type Definitions

TypeScript types are defined in `src/types/index.ts`:

- `Source`, `SourcePlatform`
- `Lens`, `LensType`
- `Message`, `MessageRole`
- `Mode`, `ModeType`
- `Artifact`, `ArtifactType`
- `VoiceState`

Constants are defined in `src/constants/index.ts`:

- `LENSES` - Array of lens configurations
- `MODES` - Array of mode configurations

Sample data for demos is in `src/lib/mockData.ts`:

- `sampleSources` - Demo sources
- `sampleMessages` - Demo chat messages
- `sampleArtifacts` - Demo saved artifacts

## 🎯 Recent Improvements

### UX Architecture Overhaul (Latest)

Major improvements based on senior UX architect review:

1. **Modal-Based Modes**: Roleplay, Patterns, and Somatic modes use modals for focused interactions
2. **Roleplay Wizard**: 4-step setup with quick prompts and skill selection
3. **Pattern Dashboard**: Comprehensive analytics with trend visualization
4. **Somatic Practice**: Interactive SVG body map with 10-minute timer
5. **Typography Upgrade**: Professional fonts (Fraunces, DM Sans, JetBrains Mono)
6. **Lens Elevation**: Moved lens selector to prominent header position
7. **Enhanced Voice Input**: Real-time waveform and breathing detection
8. **Organized Structure**: Components grouped by function (modals/, panels/), constants and mock data separated

See `src/` for implementation details.

## 🤝 Contributing

This is a development project. Key areas for contribution:
- Backend integration for real data sources
- Web Audio API integration for voice input
- AI/LLM integration for lens-based analysis
- Pattern recognition algorithms (actual analysis, not mock data)
- Authentication and user accounts
- Mobile app development

## 📄 License

Private project - see project documentation for details.

## 🔗 Related Documentation

- [UX Audit](./docs/UX_AUDIT_GINGER.md) - UX review and recommendations
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ using Next.js and TypeScript
