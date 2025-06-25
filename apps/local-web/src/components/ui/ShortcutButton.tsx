import React from 'react'
import { cn } from '../../lib/utils'

interface ShortcutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shortcut?: string
  showShortcut?: boolean
  children: React.ReactNode
}

export default function ShortcutButton({ 
  shortcut,
  showShortcut = true,
  children,
  className,
  ...props 
}: ShortcutButtonProps) {
  return (
    <button
      {...props}
      data-shortcut={shortcut}
      className={cn(className)}
    >
      {children}
      {showShortcut && shortcut && (
        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
          {shortcut.includes('+') ? shortcut : `Alt+${shortcut.toUpperCase()}`}
        </kbd>
      )}
    </button>
  )
}