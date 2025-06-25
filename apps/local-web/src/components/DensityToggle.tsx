import { useState, useEffect } from 'react'
import { Maximize2, Minimize2, Square } from 'lucide-react'

type DensityMode = 'compact' | 'condensed' | 'comfortable'

interface DensityToggleProps {
  onDensityChange?: (density: DensityMode) => void
}

export default function DensityToggle({ onDensityChange }: DensityToggleProps) {
  const [density, setDensity] = useState<DensityMode>(() => {
    const saved = localStorage.getItem('erp-density')
    return (saved as DensityMode) || 'compact'
  })

  useEffect(() => {
    // Apply density class to body
    document.body.classList.remove('density-compact', 'density-condensed', 'density-comfortable')
    document.body.classList.add(`density-${density}`)
    
    // Save preference
    localStorage.setItem('erp-density', density)
    
    // Notify parent
    onDensityChange?.(density)
  }, [density, onDensityChange])

  const densityOptions = [
    { value: 'condensed' as const, label: 'Condensed', icon: Minimize2, description: 'Maximum information density' },
    { value: 'compact' as const, label: 'Compact', icon: Square, description: 'Balanced density (default)' },
    { value: 'comfortable' as const, label: 'Comfortable', icon: Maximize2, description: 'More spacing' }
  ]

  return (
    <div className="relative group">
      <button
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Display Density"
      >
        {density === 'condensed' && <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
        {density === 'compact' && <Square className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
        {density === 'comfortable' && <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
      </button>
      
      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Display Density</p>
        </div>
        {densityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setDensity(option.value)}
            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              density === option.value ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <option.icon className={`h-4 w-4 ${
                density === option.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  density === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}