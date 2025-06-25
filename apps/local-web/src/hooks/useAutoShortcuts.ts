import { useEffect, useRef, useState, useCallback } from 'react'
import { ShortcutAssigner, AssignedShortcut } from '../utils/shortcutAssigner'
import { shortcutConfig } from '../config/shortcuts'

export function useAutoShortcuts(containerRef?: React.RefObject<HTMLElement>) {
  const assignerRef = useRef<ShortcutAssigner>()
  const [shortcuts, setShortcuts] = useState<AssignedShortcut[]>([])
  const [showOverlay, setShowOverlay] = useState(false)

  // Initialize assigner
  if (!assignerRef.current) {
    assignerRef.current = new ShortcutAssigner()
  }

  // Assign shortcuts to elements
  const assignShortcuts = useCallback(() => {
    const container = containerRef?.current || document.body
    const assigned = assignerRef.current!.assignShortcuts(container)
    setShortcuts(assigned)
  }, [containerRef])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show overlay when modifier is pressed
      if (event.key === shortcutConfig.modifier || event.key === 'Alt' || event.key === 'Control') {
        setShowOverlay(true)
      }

      // Handle shortcut activation
      assignerRef.current!.handleKeyPress(event)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Hide overlay when modifier is released
      if (event.key === shortcutConfig.modifier || event.key === 'Alt' || event.key === 'Control') {
        setShowOverlay(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Set up mutation observer
  useEffect(() => {
    const container = containerRef?.current || document.body

    // Initial assignment
    assignShortcuts()

    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      // Check if any mutations added new elements
      const hasNewElements = mutations.some(mutation => {
        return mutation.addedNodes.length > 0 ||
               (mutation.type === 'attributes' && mutation.attributeName === 'disabled')
      })

      if (hasNewElements) {
        // Debounce to avoid multiple rapid reassignments
        setTimeout(assignShortcuts, 100)
      }
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled']
    })

    return () => {
      observer.disconnect()
      assignerRef.current!.clearShortcuts(container)
    }
  }, [assignShortcuts, containerRef])

  return {
    shortcuts,
    showOverlay,
    assignShortcuts,
    getShortcut: (element: HTMLElement) => assignerRef.current!.getShortcut(element)
  }
}