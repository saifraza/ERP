import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, ArrowRight, Clock, Star, 
  Home, Package, Calculator, ClipboardList, 
  Users, Mail, Building2, Settings,
  FileText, DollarSign, Zap, Command
} from 'lucide-react'
// import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts' // Removed shortcuts system

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: any
  action: () => void
  category: string
  keywords?: string[]
  shortcut?: string
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Recent commands (would be stored in localStorage)
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-home',
      title: 'Go to Dashboard',
      icon: Home,
      action: () => navigate('/'),
      category: 'Navigation',
      keywords: ['home', 'dashboard', 'main'],
      shortcut: 'G H'
    },
    {
      id: 'nav-procurement',
      title: 'Go to Procurement',
      icon: Package,
      action: () => navigate('/procurement'),
      category: 'Navigation',
      keywords: ['procurement', 'purchase'],
      shortcut: 'G P'
    },
    {
      id: 'nav-rfqs',
      title: 'Go to RFQ Management',
      icon: Calculator,
      action: () => navigate('/procurement/rfqs'),
      category: 'Navigation',
      keywords: ['rfq', 'quotation', 'request'],
      shortcut: 'G R'
    },
    {
      id: 'nav-requisitions',
      title: 'Go to Purchase Requisitions',
      icon: ClipboardList,
      action: () => navigate('/procurement/requisitions'),
      category: 'Navigation',
      keywords: ['pr', 'requisition', 'purchase request'],
      shortcut: 'G Q'
    },
    {
      id: 'nav-vendors',
      title: 'Go to Vendors',
      icon: Users,
      action: () => navigate('/procurement/vendors'),
      category: 'Navigation',
      keywords: ['vendor', 'supplier'],
      shortcut: 'G V'
    },
    {
      id: 'nav-mails',
      title: 'Go to Mails & AI',
      icon: Mail,
      action: () => navigate('/mails'),
      category: 'Navigation',
      keywords: ['email', 'mail', 'ai', 'gemini'],
      shortcut: 'G M'
    },
    // Actions
    {
      id: 'new-requisition',
      title: 'Create New Purchase Requisition',
      description: 'Start a new purchase request',
      icon: FileText,
      action: () => {
        navigate('/procurement/requisitions')
        setTimeout(() => {
          const button = document.querySelector('[data-new-requisition]') as HTMLElement
          button?.click()
        }, 100)
      },
      category: 'Actions',
      keywords: ['new', 'create', 'pr', 'requisition'],
      shortcut: '⌘ N'
    },
    {
      id: 'new-vendor',
      title: 'Add New Vendor',
      description: 'Register a new vendor/supplier',
      icon: Users,
      action: () => {
        navigate('/procurement/vendors')
        setTimeout(() => {
          const button = document.querySelector('[data-new-vendor]') as HTMLElement
          button?.click()
        }, 100)
      },
      category: 'Actions',
      keywords: ['new', 'add', 'vendor', 'supplier']
    },
    {
      id: 'approvals',
      title: 'View Pending Approvals',
      description: 'Review items waiting for approval',
      icon: Clock,
      action: () => navigate('/procurement/approvals'),
      category: 'Actions',
      keywords: ['approve', 'pending', 'review']
    },
    // Settings
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      action: () => navigate('/settings'),
      category: 'Settings',
      keywords: ['settings', 'preferences', 'config']
    },
    {
      id: 'email-settings',
      title: 'Email Integration Settings',
      icon: Mail,
      action: () => navigate('/settings/email'),
      category: 'Settings',
      keywords: ['email', 'gmail', 'integration']
    },
    // Help
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: Command,
      action: () => {
        setIsOpen(false)
        const event = new CustomEvent('show-keyboard-help')
        window.dispatchEvent(event)
      },
      category: 'Help',
      keywords: ['keyboard', 'shortcuts', 'help'],
      shortcut: '?'
    }
  ]

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(searchLower)) ||
      cmd.category.toLowerCase().includes(searchLower)
    )
  })

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Keyboard event handling for the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+P to open palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredCommands.length - 1)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands])

  const executeCommand = (cmd: CommandItem) => {
    cmd.action()
    setIsOpen(false)
    setSearch('')
    
    // Add to recent commands
    setRecentCommands(prev => {
      const updated = [cmd.id, ...prev.filter(id => id !== cmd.id)].slice(0, 5)
      localStorage.setItem('recentCommands', JSON.stringify(updated))
      return updated
    })
  }

  // Load recent commands
  useEffect(() => {
    const saved = localStorage.getItem('recentCommands')
    if (saved) {
      setRecentCommands(JSON.parse(saved))
    }
  }, [])

  // Listen for open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-command-palette', handleOpen)
    return () => window.removeEventListener('open-command-palette', handleOpen)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-command-item]')
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="mb-4">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {category}
              </div>
              {items.map((cmd, idx) => {
                const globalIndex = filteredCommands.indexOf(cmd)
                const isSelected = globalIndex === selectedIndex
                const Icon = cmd.icon
                
                return (
                  <button
                    key={cmd.id}
                    data-command-item
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      ${isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg
                      ${isSelected 
                        ? 'bg-primary-100 dark:bg-primary-800/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {cmd.title}
                      </div>
                      {cmd.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No commands found for "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              Select
            </span>
          </div>
          <span>Press ⌘P to open anytime</span>
        </div>
      </div>
    </div>
  )
}