'use client'

import { Settings as SettingsIcon, Volume2, Download, Brain } from '@/components/ui/Icons'

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-medium text-text-primary mb-2">
            Settings
          </h1>
          <p className="text-text-secondary">
            Configure voice profiles, import settings, and consciousness model parameters
          </p>
        </div>

        {/* Voice Settings */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={20} className="text-voice-accent" />
            <h2 className="text-lg font-medium text-text-primary">
              Voice Settings
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                AI Voice Configuration
              </label>
              <p className="text-sm text-text-secondary">
                Configure how Ginger's reflective voice sounds
              </p>
            </div>
          </div>
        </div>

        {/* Import Settings */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download size={20} className="text-voice-accent" />
            <h2 className="text-lg font-medium text-text-primary">
              Import Settings
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                iMessage Connection Status
              </label>
              <p className="text-sm text-text-secondary">
                Connect to iMessage for automatic transcript import
              </p>
            </div>
          </div>
        </div>

        {/* Consciousness Model Settings */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-damasio-lens" />
            <h2 className="text-lg font-medium text-text-primary">
              Consciousness Model
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Homeostatic Baselines
              </label>
              <p className="text-sm text-text-secondary">
                Configure the baseline body state that emotions decay toward
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

