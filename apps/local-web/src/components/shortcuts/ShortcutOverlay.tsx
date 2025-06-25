import { AssignedShortcut } from '../../utils/shortcutAssigner'
import { shortcutConfig } from '../../config/shortcuts'

interface ShortcutOverlayProps {
  shortcuts: AssignedShortcut[]
}

export default function ShortcutOverlay({ shortcuts }: ShortcutOverlayProps) {
  return (
    <>
      {/* Overlay background */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dim background */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Shortcut labels */}
        {shortcuts.map(shortcut => {
          const rect = shortcut.element.getBoundingClientRect()
          
          // Skip if element is not visible
          if (rect.width === 0 || rect.height === 0) return null
          
          // Calculate position
          const left = rect.left + window.scrollX
          const top = rect.top + window.scrollY
          
          return (
            <div
              key={shortcut.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
              }}
            >
              {/* Highlight box */}
              <div className="absolute inset-0 border-2 border-primary-500 rounded-lg animate-pulse" />
              
              {/* Shortcut key badge */}
              <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {shortcutConfig.modifier === 'alt' && 'Alt+'}
                {shortcutConfig.modifier === 'ctrl' && 'Ctrl+'}
                {shortcutConfig.modifier === 'cmd' && '⌘'}
                {shortcut.key.toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Help text */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm">
          Hold {shortcutConfig.modifier === 'alt' ? 'Alt' : shortcutConfig.modifier === 'cmd' ? '⌘' : 'Ctrl'} + highlighted key to activate
        </div>
      </div>
    </>
  )
}