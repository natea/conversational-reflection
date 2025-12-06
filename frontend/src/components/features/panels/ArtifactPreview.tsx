import { type FC } from 'react'
import type { Artifact, ArtifactType } from '@/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, Maximize2, Brain, GitBranch, Bookmark, Mic, FileText } from '@/components/ui/Icons'

interface ArtifactPreviewProps {
  artifact: Artifact
  onBack: () => void
  onExpand: () => void
}

const PreviewHeader: FC<{
  title: string
  type: ArtifactType
  date: Date
  onBack: () => void
  onExpand: () => void
}> = ({ title, type, date, onBack, onExpand }) => {
  const typeColors: Record<ArtifactType, string> = {
    reflection: 'text-damasio-lens',
    pattern: 'text-cbt-lens',
    'voice-note': 'text-voice-accent',
    insight: 'text-act-lens',
    export: 'text-text-secondary'
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <button 
        onClick={onBack}
        className="p-1.5 -ml-1.5 rounded-lg hover:bg-hover-surface text-text-secondary transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-medium uppercase tracking-wider', typeColors[type])}>
          {type}
        </span>
        <span className="w-1 h-1 rounded-full bg-border-medium" />
        <span className="text-xs text-text-secondary">
          {date.toLocaleDateString()}
        </span>
      </div>

      <button 
        onClick={onExpand}
        className="p-1.5 -mr-1.5 rounded-lg hover:bg-hover-surface text-text-secondary transition-colors"
        title="Expand to full view"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  )
}

// 1. Reflection Preview - Journal Style
const ReflectionPreview: FC<{ artifact: Artifact }> = ({ artifact }) => {
  return (
    <div className="bg-surface/50 border border-border-light p-6 rounded-xl font-serif">
      <div className="mb-4 pb-4 border-b border-border-light border-dashed">
        <h3 className="text-xl font-medium text-text-primary leading-tight">
          {artifact.title}
        </h3>
      </div>
      <div className="space-y-3">
        <p className="text-text-primary leading-relaxed italic text-sm opacity-90">
          "{artifact.description.slice(0, 150)}..."
        </p>
        <div className="flex gap-2 mt-4">
          <span className="px-2 py-1 bg-damasio-lens/10 text-damasio-lens text-xs rounded-md">
            #feelings
          </span>
          <span className="px-2 py-1 bg-damasio-lens/10 text-damasio-lens text-xs rounded-md">
            #somatic
          </span>
        </div>
      </div>
    </div>
  )
}

// 2. Pattern Preview - Structured Flow
const PatternPreview: FC<{ artifact: Artifact }> = ({ artifact }) => {
  return (
    <div className="bg-surface border border-border-light p-5 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <GitBranch size={64} />
      </div>
      
      <h3 className="font-medium text-text-primary mb-4 relative z-10">
        {artifact.title}
      </h3>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cbt-lens flex-shrink-0" />
          <div className="h-px flex-1 bg-border-light" />
          <span className="text-xs text-text-secondary">Trigger</span>
        </div>
        
        <div className="p-3 bg-background rounded-lg text-sm text-text-secondary border border-border-light">
          Usually happens when...
        </div>

        <div className="flex justify-center text-border-medium">
          ↓
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cbt-lens flex-shrink-0" />
          <div className="h-px flex-1 bg-border-light" />
          <span className="text-xs text-text-secondary">Response</span>
        </div>

        <div className="p-3 bg-background rounded-lg text-sm text-text-primary border border-border-light">
          {artifact.description.slice(0, 80)}...
        </div>
      </div>
    </div>
  )
}

// 3. Insight Preview - Highlight Card
const InsightPreview: FC<{ artifact: Artifact }> = ({ artifact }) => {
  return (
    <div className="bg-gradient-to-br from-act-lens/5 to-transparent border-l-4 border-act-lens p-5 rounded-r-xl">
      <div className="flex items-start gap-3 mb-3">
        <Bookmark size={20} className="text-act-lens mt-0.5" />
        <h3 className="font-medium text-text-primary">
          {artifact.title}
        </h3>
      </div>
      
      <p className="text-sm text-text-primary leading-relaxed pl-8">
        {artifact.description}
      </p>
      
      <div className="mt-4 pl-8 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-act-lens/20 flex items-center justify-center text-xs font-bold text-act-lens">
          !
        </span>
        <span className="text-xs text-text-secondary">Key realization</span>
      </div>
    </div>
  )
}

// 4. Voice Note Preview - Waveform Visual
const VoiceNotePreview: FC<{ artifact: Artifact }> = ({ artifact }) => {
  return (
    <div className="bg-voice-accent/5 border border-voice-accent/20 p-5 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-voice-accent/10 rounded-full">
            <Mic size={16} className="text-voice-accent" />
          </div>
          <h3 className="font-medium text-text-primary text-sm">
            {artifact.title}
          </h3>
        </div>
        <span className="text-xs font-mono text-voice-accent">02:14</span>
      </div>

      {/* Mock Waveform */}
      <div className="flex items-center gap-1 h-12 mb-4 px-2">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-voice-accent/40 rounded-full"
            style={{
              height: `${Math.max(20, Math.random() * 100)}%`,
              opacity: Math.random() > 0.5 ? 1 : 0.5
            }}
          />
        ))}
      </div>

      <div className="p-3 bg-background/50 rounded-lg">
        <p className="text-xs text-text-secondary line-clamp-2">
          "Transcript: {artifact.description}..."
        </p>
      </div>
    </div>
  )
}

// 5. Export Preview - File Card
const ExportPreview: FC<{ artifact: Artifact }> = ({ artifact }) => {
  return (
    <div className="bg-surface border border-border-light p-5 rounded-xl flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-background rounded-xl border border-border-light flex items-center justify-center mb-4 shadow-sm">
        <FileText size={32} className="text-text-secondary" />
      </div>
      
      <h3 className="font-medium text-text-primary mb-1">
        {artifact.title}
      </h3>
      
      <p className="text-xs text-text-secondary mb-4">
        PDF Document • 2.4 MB
      </p>
      
      <button className="w-full py-2 px-4 bg-background border border-border-light rounded-lg text-sm font-medium text-text-primary hover:bg-hover-surface transition-colors">
        Download
      </button>
    </div>
  )
}

export const ArtifactPreview: FC<ArtifactPreviewProps> = ({ artifact, onBack, onExpand }) => {
  const renderPreview = () => {
    switch (artifact.type) {
      case 'reflection':
        return <ReflectionPreview artifact={artifact} />
      case 'pattern':
        return <PatternPreview artifact={artifact} />
      case 'insight':
        return <InsightPreview artifact={artifact} />
      case 'voice-note':
        return <VoiceNotePreview artifact={artifact} />
      default:
        return <ExportPreview artifact={artifact} />
    }
  }

  return (
    <div className="h-full flex flex-col p-4 animate-in slide-in-from-right-4 duration-200">
      <PreviewHeader 
        title={artifact.title}
        type={artifact.type}
        date={artifact.date}
        onBack={onBack}
        onExpand={onExpand}
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderPreview()}
        
        <div className="mt-8 pt-6 border-t border-border-light">
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            About this artifact
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-secondary block mb-1">Created</span>
              <span className="text-text-primary">
                {artifact.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1">Word Count</span>
              <span className="text-text-primary">
                {artifact.description.split(' ').length} words
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

