import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  cmd?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
  global?: boolean
  enabled?: boolean
}

interface ShortcutGroup {
  name: string
  shortcuts: KeyboardShortcut[]
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[] = [], deps: any[] = []) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeElement = useRef<Element | null>(null)

  // Check if user is typing in an input field
  const isTyping = useCallback(() => {
    const active = document.activeElement
    activeElement.current = active
    return (
      active?.tagName === 'INPUT' ||
      active?.tagName === 'TEXTAREA' ||
      active?.getAttribute('contenteditable') === 'true'
    )
  }, [])

  // Check if modifier keys match
  const checkModifiers = useCallback((e: KeyboardEvent, shortcut: KeyboardShortcut) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
    
    if (shortcut.cmd && !ctrlOrCmd) return false
    if (shortcut.ctrl && !e.ctrlKey) return false
    if (shortcut.shift && !e.shiftKey) return false
    if (shortcut.alt && !e.altKey) return false
    
    // Check that no extra modifiers are pressed
    if (!shortcut.cmd && !shortcut.ctrl && ctrlOrCmd) return false
    if (!shortcut.shift && e.shiftKey) return false
    if (!shortcut.alt && e.altKey) return false
    
    return true
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts while typing (unless it's a global shortcut)
    if (isTyping()) {
      const globalShortcuts = shortcuts.filter(s => s.global)
      for (const shortcut of globalShortcuts) {
        if (shortcut.enabled !== false && 
            e.key.toLowerCase() === shortcut.key.toLowerCase() && 
            checkModifiers(e, shortcut)) {
          e.preventDefault()
          e.stopPropagation()
          shortcut.action()
          return
        }
      }
      return
    }

    // Check all shortcuts
    for (const shortcut of shortcuts) {
      if (shortcut.enabled !== false && 
          e.key.toLowerCase() === shortcut.key.toLowerCase() && 
          checkModifiers(e, shortcut)) {
        e.preventDefault()
        e.stopPropagation()
        shortcut.action()
        return
      }
    }
  }, [shortcuts, isTyping, checkModifiers])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    isTyping,
    activeElement: activeElement.current
  }
}

// Global shortcuts that work across the entire app
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  const globalShortcuts: KeyboardShortcut[] = [
    // Search
    {
      key: 'k',
      cmd: true,
      description: 'Open global search',
      global: true,
      action: () => {
        const searchButton = document.querySelector('[data-search-trigger]') as HTMLElement
        searchButton?.click()
      }
    },
    // Command Palette
    {
      key: 'p',
      cmd: true,
      description: 'Open command palette',
      global: true,
      action: () => {
        const event = new CustomEvent('open-command-palette')
        window.dispatchEvent(event)
      }
    },
    // Help
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        const event = new CustomEvent('show-keyboard-help')
        window.dispatchEvent(event)
      }
    },
    // Navigation shortcuts (g + key)
    {
      key: 'g',
      description: 'Navigation mode',
      action: () => {
        let nextKey = ''
        const handleNextKey = (e: KeyboardEvent) => {
          e.preventDefault()
          nextKey = e.key.toLowerCase()
          
          const routes: Record<string, string> = {
            'h': '/', // Home
            'p': '/procurement', // Procurement
            'r': '/procurement/rfqs', // RFQs
            'q': '/procurement/requisitions', // Requisitions
            'v': '/procurement/vendors', // Vendors
            'm': '/mails', // Mails
            'e': '/email-automation', // Email automation
            'a': '/procurement/approvals', // Approvals
            's': '/settings', // Settings
            'd': '/procurement', // Dashboard
            'i': '/store/inventory', // Inventory
            'o': '/procurement/purchase-orders', // Purchase Orders
            'f': '/finance', // Finance
            'n': 'new', // Special: trigger new action
            'c': 'create', // Special: trigger create action
          }
          
          if (routes[nextKey]) {
            // Handle special actions
            if (routes[nextKey] === 'new' || routes[nextKey] === 'create') {
              // Trigger context-aware new/create action
              const newButton = document.querySelector('[data-new-requisition], [data-new-vendor], [data-create-button]') as HTMLElement
              if (newButton) {
                newButton.click()
                toast.success('Create action triggered')
              } else {
                toast('No create action available on this page')
              }
            } else {
              // Normal navigation
              navigate(routes[nextKey])
              toast.success(`Navigated to ${routes[nextKey]}`)
            }
          }
          
          window.removeEventListener('keydown', handleNextKey)
        }
        
        window.addEventListener('keydown', handleNextKey)
        toast('Navigate: H=Home R=RFQs Q=Requisitions V=Vendors | Actions: N=New C=Create')
        
        // Remove listener after 3 seconds
        setTimeout(() => {
          window.removeEventListener('keydown', handleNextKey)
        }, 3000)
      }
    },
    // Quick actions
    {
      key: 'n',
      cmd: true,
      description: 'Create new (context aware)',
      global: true,
      action: () => {
        // Determine what to create based on current route
        if (location.pathname.includes('/procurement/requisitions')) {
          const newButton = document.querySelector('[data-new-requisition]') as HTMLElement
          newButton?.click()
        } else if (location.pathname.includes('/procurement/rfqs')) {
          navigate('/procurement/requisitions') // Go to requisitions to create RFQ
          toast('Navigate to requisitions to create new RFQ')
        } else if (location.pathname.includes('/procurement/vendors')) {
          const newButton = document.querySelector('[data-new-vendor]') as HTMLElement
          newButton?.click()
        }
      }
    },
    // Escape to close modals
    {
      key: 'Escape',
      description: 'Close modal/dialog',
      global: true,
      action: () => {
        // Close any open modals
        const closeButtons = document.querySelectorAll('[data-close-modal], [aria-label="Close"]')
        const lastButton = closeButtons[closeButtons.length - 1] as HTMLElement
        lastButton?.click()
      }
    },
    // Alt + number for quick module access
    ...Array.from({ length: 9 }, (_, i) => ({
      key: String(i + 1),
      alt: true,
      description: `Quick access to module ${i + 1}`,
      action: () => {
        const moduleRoutes = [
          '/', // 1: Dashboard
          '/procurement', // 2: Procurement
          '/procurement/vendors', // 3: Vendors
          '/procurement/requisitions', // 4: Requisitions
          '/procurement/rfqs', // 5: RFQs
          '/mails', // 6: Mails
          '/email-automation', // 7: Email Automation
          '/finance', // 8: Finance
          '/settings', // 9: Settings
        ]
        if (moduleRoutes[i]) {
          navigate(moduleRoutes[i])
        }
      }
    }))
  ]

  useKeyboardShortcuts(globalShortcuts, [navigate, location])
}

// List navigation shortcuts (j/k for up/down)
export function useListNavigation(
  items: any[],
  onSelect: (item: any, index: number) => void,
  onOpen?: (item: any, index: number) => void
) {
  const selectedIndex = useRef(-1)

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'j',
      description: 'Move down in list',
      action: () => {
        if (items.length === 0) return
        selectedIndex.current = Math.min(selectedIndex.current + 1, items.length - 1)
        highlightRow(selectedIndex.current)
      }
    },
    {
      key: 'k', 
      description: 'Move up in list',
      action: () => {
        if (items.length === 0) return
        selectedIndex.current = Math.max(selectedIndex.current - 1, 0)
        highlightRow(selectedIndex.current)
      }
    },
    {
      key: 'Enter',
      description: 'Open selected item',
      action: () => {
        if (selectedIndex.current >= 0 && selectedIndex.current < items.length && onOpen) {
          onOpen(items[selectedIndex.current], selectedIndex.current)
        }
      }
    },
    {
      key: 'x',
      description: 'Select/deselect item',
      action: () => {
        if (selectedIndex.current >= 0 && selectedIndex.current < items.length) {
          onSelect(items[selectedIndex.current], selectedIndex.current)
        }
      }
    }
  ]

  const highlightRow = useCallback((index: number) => {
    // Remove previous highlights
    document.querySelectorAll('[data-row-index]').forEach(row => {
      row.classList.remove('ring-2', 'ring-primary-500', 'bg-primary-50')
    })
    
    // Add highlight to current row
    const row = document.querySelector(`[data-row-index="${index}"]`)
    if (row) {
      row.classList.add('ring-2', 'ring-primary-500', 'bg-primary-50')
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  // Only enable shortcuts if there are items
  const enabledShortcuts = shortcuts.map(s => ({
    ...s,
    enabled: items.length > 0
  }))

  useKeyboardShortcuts(enabledShortcuts, [items.length])

  return { selectedIndex: selectedIndex.current }
}