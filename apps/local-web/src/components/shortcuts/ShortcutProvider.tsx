import React, { createContext, useContext } from 'react'
import { useAutoShortcuts } from '../../hooks/useAutoShortcuts'
import ShortcutOverlay from './ShortcutOverlay'

interface ShortcutContextValue {
  shortcuts: any[]
  showOverlay: boolean
  assignShortcuts: () => void
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

export function useShortcuts() {
  const context = useContext(ShortcutContext)
  if (!context) {
    throw new Error('useShortcuts must be used within ShortcutProvider')
  }
  return context
}

interface ShortcutProviderProps {
  children: React.ReactNode
}

export default function ShortcutProvider({ children }: ShortcutProviderProps) {
  const { shortcuts, showOverlay, assignShortcuts } = useAutoShortcuts()

  return (
    <ShortcutContext.Provider value={{ shortcuts, showOverlay, assignShortcuts }}>
      {children}
      {showOverlay && <ShortcutOverlay shortcuts={shortcuts} />}
    </ShortcutContext.Provider>
  )
}