# Frontend Generator Skill

## Overview
This skill helps generate production-quality frontend code from PRDs, wireframes, and design specifications. It follows best practices from Google and Meta for building scalable, maintainable React applications.

## Capabilities

### 1. Project Scaffolding
- Initialize Next.js 14+ with App Router
- Configure Tailwind CSS with custom design tokens
- Set up TypeScript with strict mode
- Configure ESLint and Prettier
- Create folder structure following feature-based organization

### 2. Design System Generation
- Extract design tokens from PRDs (colors, typography, spacing)
- Generate Tailwind config with custom theme
- Create reusable primitive components (Button, Input, Card, etc.)
- Build compound components with proper composition patterns

### 3. Component Architecture
- Follow atomic design principles (atoms, molecules, organisms)
- Implement proper TypeScript interfaces for all props
- Use proper React patterns (compound components, render props, hooks)
- Implement proper accessibility (ARIA labels, keyboard navigation)

### 4. State Management
- Set up Zustand stores with proper slicing
- Implement React Query for server state
- Create custom hooks for shared logic
- Handle loading, error, and empty states

### 5. Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Implement collapsible panels and overlays
- Handle touch and click interactions
- Test across viewport sizes

## Code Standards

### File Organization
```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Primitive/atomic components
│   ├── features/           # Feature-specific components
│   └── layouts/            # Layout components
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── lib/                    # Utilities and helpers
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles and Tailwind config
```

### Component Template
```tsx
'use client';

import { type FC, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  children?: ReactNode;
  className?: string;
}

export const Component: FC<ComponentProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};
```

### Naming Conventions
- Components: PascalCase (SourcePanel.tsx)
- Hooks: camelCase with 'use' prefix (useSourceSelection.ts)
- Utilities: camelCase (formatTimestamp.ts)
- Types: PascalCase with descriptive suffix (SourceItem.types.ts)
- CSS classes: kebab-case via Tailwind

### Performance Guidelines
- Use React.memo for expensive renders
- Implement virtualization for long lists
- Lazy load non-critical components
- Optimize images with next/image
- Use CSS transitions over JS animations

### Accessibility Requirements
- All interactive elements keyboard accessible
- Proper focus management
- ARIA labels for icons and complex widgets
- Color contrast ratio 4.5:1 minimum
- Respect prefers-reduced-motion

## Generation Process

1. **Analyze Requirements**
   - Parse PRD for features and user flows
   - Extract design specifications
   - Identify component hierarchy
   - Map data requirements

2. **Design System First**
   - Generate tailwind.config.ts
   - Create CSS variables
   - Build primitive components

3. **Build Bottom-Up**
   - Start with smallest components
   - Compose into larger features
   - Wire up state management
   - Add interactions and animations

4. **Polish and Test**
   - Add proper TypeScript types
   - Implement error boundaries
   - Add loading states
   - Test responsive behavior

## Output Format

When generating frontend code:
- Create complete, runnable files
- Include all necessary imports
- Add brief comments for complex logic
- Ensure proper error handling
- Follow consistent formatting

## Example Invocation

"Generate a three-panel layout with a collapsible left sidebar, flexible center chat area, and slide-in right panel for a voice-first emotional reflection app."

The skill will:
1. Create the layout components
2. Implement panel collapse/expand logic
3. Add proper responsive breakpoints
4. Include keyboard accessibility
5. Wire up panel state management
