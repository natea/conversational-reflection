'use client'

import { type FC, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Search, X, MessageSquare, Brain, FileText, Heart, Filter } from '@/components/ui/Icons'
import type { SearchResult, SearchContentType, SearchFilters } from '@/types'
import { useContactsStore } from '@/stores/useContactsStore'

interface UnifiedSearchProps {
  onResultClick?: (result: SearchResult) => void
  compact?: boolean
  className?: string
}

// Mock search function - in production this would call the MCP search endpoint
const performSearch = async (
  query: string,
  filters: SearchFilters
): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Mock results
  const mockResults: SearchResult[] = [
    {
      sourceType: 'message',
      sourceId: 'msg_1',
      distance: 0.12,
      preview: 'I just feel really tight in my chest when I read her message about me not listening...',
      timestamp: new Date(Date.now() - 120000),
      relatedContactId: '+1234567890'
    },
    {
      sourceType: 'memory',
      sourceId: 'memory_1',
      distance: 0.18,
      preview: 'Third instance of Sarah expressing frustration about not being heard. Pattern suggests deeper communication issue.',
      timestamp: new Date(Date.now() - 86400000 * 2),
      relatedContactId: '+1234567890'
    },
    {
      sourceType: 'journal',
      sourceId: 'journal_1',
      distance: 0.22,
      preview: 'Reflecting on my conversation with Sarah, I notice a recurring pattern. When she says I\'m not listening...',
      timestamp: new Date(Date.now() - 86400000 * 2)
    },
    {
      sourceType: 'emotion',
      sourceId: 'emotion_1',
      distance: 0.28,
      preview: 'Sadness (0.6 intensity): Analyzing Sarah\'s frustration in yesterday\'s conversation',
      timestamp: new Date(Date.now() - 3600000),
      relatedContactId: '+1234567890'
    }
  ]

  // Filter by content types
  let filtered = mockResults.filter(r => 
    filters.contentTypes.includes(r.sourceType)
  )

  // Filter by contact if specified
  if (filters.contactIds && filters.contactIds.length > 0) {
    filtered = filtered.filter(r => 
      r.relatedContactId && filters.contactIds!.includes(r.relatedContactId)
    )
  }

  return filtered.slice(0, 20)
}

const getContentTypeIcon = (type: SearchContentType) => {
  const iconProps = { size: 16 }
  switch (type) {
    case 'message':
      return <MessageSquare {...iconProps} />
    case 'memory':
      return <Brain {...iconProps} />
    case 'journal':
      return <FileText {...iconProps} />
    case 'emotion':
      return <Heart {...iconProps} />
  }
}

const getContentTypeColor = (type: SearchContentType) => {
  switch (type) {
    case 'message':
      return 'text-cbt-lens'
    case 'memory':
      return 'text-damasio-lens'
    case 'journal':
      return 'text-act-lens'
    case 'emotion':
      return 'text-voice-accent'
  }
}

const getContentTypeBgColor = (type: SearchContentType) => {
  switch (type) {
    case 'message':
      return 'bg-cbt-lens/10'
    case 'memory':
      return 'bg-damasio-lens/10'
    case 'journal':
      return 'bg-act-lens/10'
    case 'emotion':
      return 'bg-voice-accent/10'
  }
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  return `${diffInDays}d ago`
}

export const UnifiedSearch: FC<UnifiedSearchProps> = ({
  onResultClick,
  compact = false,
  className
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    contentTypes: ['message', 'memory', 'journal', 'emotion'],
    contactIds: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    minRelevance: 0.0
  })

  const { contacts } = useContactsStore()

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const searchResults = await performSearch(query, filters)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [query, filters])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    // Debounced search would go here
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
  }

  const toggleContentType = (type: SearchContentType) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }))
  }

  const toggleContact = (contactId: string) => {
    setFilters(prev => {
      const current = prev.contactIds || []
      return {
        ...prev,
        contactIds: current.includes(contactId)
          ? current.filter(id => id !== contactId)
          : [...current, contactId]
      }
    })
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search input */}
      <div className="relative">
        <div className={cn(
          'flex items-center gap-2 px-4 py-3 bg-surface border border-border-light rounded-xl',
          'focus-within:border-voice-accent transition-all',
          compact && 'py-2'
        )}>
          <Search size={18} className="text-text-secondary flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search across messages, memories, journal..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary outline-none text-sm"
          />
          {query && (
            <button
              onClick={handleClear}
              className="p-1 rounded hover:bg-hover-surface transition-colors flex-shrink-0"
            >
              <X size={16} className="text-text-secondary" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-1.5 rounded transition-colors flex-shrink-0',
              showFilters ? 'bg-voice-accent/10 text-voice-accent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Filter size={16} />
          </button>
        </div>

        {query.length > 0 && query.length < 2 && (
          <p className="text-xs text-text-secondary mt-1 ml-4">
            Type at least 2 characters to search
          </p>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-surface border border-border-light rounded-xl p-4 space-y-4 animate-slide-up">
          {/* Content Types */}
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Content Types
            </label>
            <div className="flex flex-wrap gap-2">
              {(['message', 'memory', 'journal', 'emotion'] as SearchContentType[]).map(type => (
                <button
                  key={type}
                  onClick={() => toggleContentType(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filters.contentTypes.includes(type)
                      ? 'bg-voice-accent text-white'
                      : 'bg-surface border border-border-light text-text-secondary hover:text-text-primary'
                  )}
                >
                  {getContentTypeIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* Contact Filter */}
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Filter by Contact
            </label>
            <div className="flex flex-wrap gap-2">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filters.contactIds?.includes(contact.id)
                      ? 'bg-voice-accent text-white'
                      : 'bg-surface border border-border-light text-text-secondary hover:text-text-primary'
                  )}
                >
                  {contact.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search button */}
      {query.length >= 2 && (
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
            'bg-voice-accent text-white hover:bg-voice-accent/90',
            isSearching && 'opacity-50 cursor-wait'
          )}
        >
          {isSearching ? 'Searching...' : `Search ${filters.contentTypes.length} content type${filters.contentTypes.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {results.length} Result{results.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-text-secondary">
              Sorted by relevance
            </p>
          </div>

          {results.map((result) => {
            const contact = result.relatedContactId 
              ? contacts.find(c => c.id === result.relatedContactId)
              : null

            return (
              <button
                key={`${result.sourceType}_${result.sourceId}`}
                onClick={() => onResultClick?.(result)}
                className="w-full text-left p-3 rounded-lg border border-border-light bg-surface hover:bg-hover-surface hover:border-border-medium transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                    getContentTypeBgColor(result.sourceType)
                  )}>
                    <div className={getContentTypeColor(result.sourceType)}>
                      {getContentTypeIcon(result.sourceType)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-xs font-medium capitalize',
                        getContentTypeColor(result.sourceType)
                      )}>
                        {result.sourceType}
                      </span>
                      {contact && (
                        <>
                          <span className="text-xs text-text-secondary">•</span>
                          <span className="text-xs text-text-secondary">
                            {contact.name}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-text-secondary ml-auto">
                        {formatTimeAgo(result.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-text-primary line-clamp-2">
                      {result.preview}
                    </p>

                    {/* Relevance score */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-border-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-voice-accent rounded-full transition-all"
                          style={{ width: `${(1 - result.distance) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">
                        {Math.round((1 - result.distance) * 100)}% match
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {!isSearching && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          <Search size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No results found for "{query}"</p>
          <p className="text-xs mt-1">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )
}

