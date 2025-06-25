import { useEffect, useState } from 'react'
import { X, Command } from 'lucide-react'

interface ShortcutGroup {
  name: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    name: 'Automatic Button Shortcuts',
    shortcuts: [
      { keys: ['Alt', '+', 'Letter'], description: 'Activate any button (letter shown when holding Alt)' },
      { keys: ['Alt'], description: 'Hold to see all available button shortcuts' },
    ]
  },
  {
    name: 'Global Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open global search' },
      { keys: ['⌘', 'P'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show this help' },
      { keys: ['G', 'then H'], description: 'Go to Home' },
      { keys: ['G', 'then P'], description: 'Go to Procurement' },
      { keys: ['G', 'then R'], description: 'Go to RFQs' },
      { keys: ['G', 'then Q'], description: 'Go to Requisitions' },
      { keys: ['G', 'then V'], description: 'Go to Vendors' },
      { keys: ['G', 'then M'], description: 'Go to Mails' },
      { keys: ['ESC'], description: 'Close modal/dialog' },
    ]
  },
  {
    name: 'Quick Actions',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Create new (context aware)' },
      { keys: ['⌘', 'S'], description: 'Save current form' },
      { keys: ['⌘', 'Enter'], description: 'Submit/Approve' },
      { keys: ['Alt', '1-9'], description: 'Quick jump to modules' },
    ]
  },
  {
    name: 'List Navigation',
    shortcuts: [
      { keys: ['J'], description: 'Move down in list' },
      { keys: ['K'], description: 'Move up in list' },
      { keys: ['X'], description: 'Select/deselect current item' },
      { keys: ['Enter'], description: 'Open selected item' },
      { keys: ['E'], description: 'Edit selected item' },
      { keys: ['A'], description: 'Approve selected (if applicable)' },
      { keys: ['R'], description: 'Reject selected (if applicable)' },
      { keys: ['/'], description: 'Focus search in current list' },
    ]
  },
  {
    name: 'RFQ Management',
    shortcuts: [
      { keys: ['N'], description: 'New RFQ' },
      { keys: ['S'], description: 'Send to vendors' },
      { keys: ['C'], description: 'Compare quotations' },
      { keys: ['P'], description: 'Preview PDF' },
      { keys: ['M'], description: 'Email history' },
    ]
  },
  {
    name: 'Purchase Requisitions',
    shortcuts: [
      { keys: ['N'], description: 'New requisition' },
      { keys: ['A'], description: 'Approve selected' },
      { keys: ['R'], description: 'Reject selected' },
      { keys: ['C'], description: 'Convert to RFQ' },
      { keys: ['V'], description: 'View details' },
    ]
  },
  {
    name: 'Form Navigation',
    shortcuts: [
      { keys: ['Tab'], description: 'Next field' },
      { keys: ['Shift', 'Tab'], description: 'Previous field' },
      { keys: ['Space'], description: 'Toggle checkbox' },
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', 'Y'], description: 'Redo' },
    ]
  }
]

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true)
    window.addEventListener('show-keyboard-help', handleShowHelp)
    
    // Also listen for ? key
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && 
            activeElement?.tagName !== 'TEXTAREA' &&
            activeElement?.getAttribute('contenteditable') !== 'true') {
          e.preventDefault()
          setIsOpen(true)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('show-keyboard-help', handleShowHelp)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Command className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn keyboard shortcuts to navigate faster
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.name} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  {group.name}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            {keyIndex > 0 && shortcut.keys[0] !== 'then' && (
                              <span className="text-gray-400 mx-1">+</span>
                            )}
                            {key === 'then' ? (
                              <span className="text-xs text-gray-500 mx-1">then</span>
                            ) : (
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                                {key}
                              </kbd>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
              Pro Tips
            </h4>
            <ul className="space-y-1 text-sm text-primary-700 dark:text-primary-300">
              <li>• <strong>NEW:</strong> Every button automatically gets a keyboard shortcut!</li>
              <li>• Hold Alt to see shortcuts for all buttons on the page</li>
              <li>• Use ⌘P to open command palette for all actions</li>
              <li>• Use ⌘K to quickly search and navigate anywhere</li>
              <li>• Press G followed by a letter for quick navigation</li>
              <li>• Use J/K to navigate lists without mouse</li>
              <li>• Press X to select items, Enter to open</li>
              <li>• Most actions work without leaving the keyboard</li>
              <li>• Shortcuts are context-aware based on current page</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  )
}