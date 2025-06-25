// Keyboard shortcut configuration
export const shortcutConfig = {
  // Which elements should get automatic shortcuts
  selectors: [
    'button',
    '[role="button"]',
    'a.btn',
    'a.btn-primary',
    'a.btn-secondary',
    '[data-shortcut-enabled]'
  ],
  
  // Modifier key for shortcuts
  modifier: 'alt' as 'alt' | 'ctrl' | 'cmd',
  
  // Visual indicator style
  indicatorStyle: 'underline' as 'underline' | 'badge' | 'superscript' | 'none',
  
  // Show indicators
  showIndicators: true,
  
  // Conflict resolution strategy
  conflictStrategy: 'smart' as 'smart' | 'numeric' | 'skip',
  
  // Elements to exclude from auto-shortcuts
  excludeSelectors: [
    '[data-no-shortcut]',
    '[disabled]',
    '.dropdown-item',
    '.pagination button'
  ],
  
  // Reserved shortcuts that shouldn't be auto-assigned
  reservedShortcuts: [
    'a', // Approve (context-specific)
    'r', // Reject (context-specific)
    'n', // New (global)
    's', // Save/Submit (context-specific)
    'c', // Create/Convert (context-specific)
    'e', // Edit
    'v', // View
    'd', // Delete
    'x', // Select
    'j', // Navigate down
    'k', // Navigate up
    '/', // Search
    '?', // Help
    'g', // Go to navigation
    'p', // Command palette
  ],
  
  // Priority words for better shortcut assignment
  priorityWords: {
    'create': 'c',
    'new': 'n',
    'save': 's',
    'submit': 's',
    'edit': 'e',
    'delete': 'd',
    'view': 'v',
    'open': 'o',
    'close': 'x',
    'cancel': 'esc',
    'approve': 'a',
    'reject': 'r',
    'send': 's',
    'export': 'e',
    'import': 'i',
    'download': 'd',
    'upload': 'u',
    'filter': 'f',
    'search': '/',
    'help': '?',
    'print': 'p',
    'refresh': 'r',
    'compare': 'm',
    'convert': 'c'
  }
}

export type ShortcutConfig = typeof shortcutConfig