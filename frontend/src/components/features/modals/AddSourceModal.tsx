'use client'

import { type FC, useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { Modal } from '@/components/ui/Modal'
import { 
  Upload, 
  Link, 
  Clipboard, 
  GoogleDrive, 
  FileText,
  Plus
} from '@/components/ui/Icons'

export const AddSourceModal: FC = () => {
  const { addSourceModalOpen, setAddSourceModalOpen } = useUIStore()
  const { addSource } = useGingerStore()
  const [urlInput, setUrlInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [inputType, setInputType] = useState<'none' | 'url'>('none')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setAddSourceModalOpen(false)
    setUrlInput('')
    setInputType('none')
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(Array.from(files))
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const processFiles = (files: File[]) => {
    // Mock file processing
    files.forEach(file => {
      addSource({
        name: file.name,
        platform: 'file',
        previewText: `${(file.size / 1024).toFixed(1)} KB • ${file.type || 'Unknown type'}`,
        entryCount: 1,
        isSyncing: false
      })
    })
    handleClose()
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    addSource({
      name: new URL(urlInput).hostname.replace('www.', ''),
      platform: 'link',
      previewText: urlInput,
      entryCount: 1,
      isSyncing: false
    })
    handleClose()
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        addSource({
          name: 'Copied Text',
          platform: 'paste',
          previewText: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          entryCount: 1,
          isSyncing: false
        })
        handleClose()
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  return (
    <Modal
      isOpen={addSourceModalOpen}
      onClose={handleClose}
      title="Add sources"
      size="lg"
    >
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <p className="text-text-secondary">
            Sources let Ginger base its responses on the information that matters most to you.
            (Examples: chat logs, journal entries, research notes, meeting transcripts, etc.)
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 transition-all duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer',
            isDragging
              ? 'border-voice-accent bg-voice-accent/5'
              : 'border-border-medium hover:border-voice-accent/50 bg-surface/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
          <div className="w-12 h-12 rounded-full bg-surface border border-border-light flex items-center justify-center">
            <Upload size={24} className="text-voice-accent" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-text-primary mb-1">Upload sources</h3>
            <p className="text-sm text-text-secondary">
              Drag & drop or <span className="text-voice-accent hover:underline">choose file</span> to upload
            </p>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3), .docx
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="p-4 rounded-xl border border-border-light hover:border-border-medium hover:bg-hover-surface transition-all flex items-center gap-3 text-left group"
            onClick={() => {/* Placeholder for Google Drive */}}
          >
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <GoogleDrive size={20} />
            </div>
            <div>
              <div className="font-medium text-text-primary text-sm">Google Drive</div>
              <div className="text-xs text-text-secondary">Connect account</div>
            </div>
          </button>

          <button 
            className={cn(
              "p-4 rounded-xl border transition-all flex items-center gap-3 text-left group",
              inputType === 'url' 
                ? "border-voice-accent bg-voice-accent/5" 
                : "border-border-light hover:border-border-medium hover:bg-hover-surface"
            )}
            onClick={() => setInputType('url')}
          >
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Link size={20} className="text-text-secondary" />
            </div>
            <div>
              <div className="font-medium text-text-primary text-sm">Website</div>
              <div className="text-xs text-text-secondary">Add via URL</div>
            </div>
          </button>

          <button 
            className="p-4 rounded-xl border border-border-light hover:border-border-medium hover:bg-hover-surface transition-all flex items-center gap-3 text-left group"
            onClick={handlePaste}
          >
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Clipboard size={20} className="text-text-secondary" />
            </div>
            <div>
              <div className="font-medium text-text-primary text-sm">Paste text</div>
              <div className="text-xs text-text-secondary">From clipboard</div>
            </div>
          </button>
        </div>

        {/* URL Input Area */}
        {inputType === 'url' && (
          <form onSubmit={handleUrlSubmit} className="animate-slide-up">
            <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-voice-accent rounded-xl">
              <Link size={16} className="text-voice-accent flex-shrink-0" />
              <input
                type="url"
                placeholder="https://example.com/article..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className="p-1.5 rounded-md bg-voice-accent text-white hover:bg-voice-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

