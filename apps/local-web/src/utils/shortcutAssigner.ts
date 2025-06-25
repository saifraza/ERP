import { shortcutConfig } from '../config/shortcuts'

export interface AssignedShortcut {
  element: HTMLElement
  key: string
  modifier: string
  text: string
  id: string
}

export class ShortcutAssigner {
  private shortcuts: Map<string, AssignedShortcut> = new Map()
  private usedKeys: Set<string> = new Set()
  private elementMap: WeakMap<HTMLElement, string> = new WeakMap()

  constructor() {
    // Initialize with reserved shortcuts
    shortcutConfig.reservedShortcuts.forEach(key => {
      this.usedKeys.add(key.toLowerCase())
    })
  }

  // Extract meaningful text from element
  private getElementText(element: HTMLElement): string {
    // Priority: aria-label > text content > title > placeholder
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    // Get text content, excluding icon-only text
    const textContent = element.textContent?.trim() || ''
    const cleanText = textContent.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim()
    if (cleanText) return cleanText

    const title = element.getAttribute('title')
    if (title) return title

    if (element instanceof HTMLInputElement) {
      return element.placeholder || ''
    }

    return ''
  }

  // Find the best shortcut key for the given text
  private findBestKey(text: string, element: HTMLElement): string | null {
    const lowerText = text.toLowerCase()
    const words = lowerText.split(/\s+/)

    // Check for forced shortcut
    const forcedShortcut = element.getAttribute('data-shortcut')
    if (forcedShortcut) {
      const key = forcedShortcut.split('+').pop()?.toLowerCase()
      if (key && !this.usedKeys.has(key)) {
        return key
      }
    }

    // Strategy 1: Check priority words
    for (const [word, key] of Object.entries(shortcutConfig.priorityWords)) {
      if (lowerText.includes(word) && !this.usedKeys.has(key)) {
        return key
      }
    }

    // Strategy 2: First letter of first word
    if (words[0] && words[0][0]) {
      const firstLetter = words[0][0]
      if (!this.usedKeys.has(firstLetter)) {
        return firstLetter
      }
    }

    // Strategy 3: First letter of other words
    for (let i = 1; i < words.length; i++) {
      if (words[i] && words[i][0]) {
        const letter = words[i][0]
        if (!this.usedKeys.has(letter)) {
          return letter
        }
      }
    }

    // Strategy 4: Other letters in the text
    for (const char of lowerText) {
      if (/[a-z]/.test(char) && !this.usedKeys.has(char)) {
        return char
      }
    }

    // Strategy 5: Numbers
    for (let i = 1; i <= 9; i++) {
      const numKey = i.toString()
      if (!this.usedKeys.has(numKey)) {
        return numKey
      }
    }

    return null
  }

  // Assign shortcuts to all matching elements
  assignShortcuts(container?: HTMLElement): AssignedShortcut[] {
    const targetContainer = container || document.body
    // Clear previous assignments for this container
    this.clearShortcuts(targetContainer)

    // Find all eligible elements
    const selector = shortcutConfig.selectors.join(', ')
    const elements = targetContainer.querySelectorAll<HTMLElement>(selector)

    const assigned: AssignedShortcut[] = []

    elements.forEach(element => {
      // Skip excluded elements
      const excludeSelector = shortcutConfig.excludeSelectors.join(', ')
      if (excludeSelector && element.matches(excludeSelector)) {
        return
      }

      // Skip if already assigned
      if (this.elementMap.has(element)) {
        return
      }

      const text = this.getElementText(element)
      if (!text) return

      const key = this.findBestKey(text, element)
      if (!key) return

      const id = `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const shortcut: AssignedShortcut = {
        element,
        key,
        modifier: shortcutConfig.modifier,
        text,
        id
      }

      this.shortcuts.set(id, shortcut)
      this.usedKeys.add(key)
      this.elementMap.set(element, id)
      assigned.push(shortcut)

      // Add visual indicator
      this.addVisualIndicator(element, key)
    })

    return assigned
  }

  // Add visual indicator to element
  private addVisualIndicator(element: HTMLElement, key: string) {
    if (!shortcutConfig.showIndicators) return

    element.setAttribute('data-shortcut-key', key)

    switch (shortcutConfig.indicatorStyle) {
      case 'underline':
        this.addUnderlineIndicator(element, key)
        break
      case 'badge':
        this.addBadgeIndicator(element, key)
        break
      case 'superscript':
        this.addSuperscriptIndicator(element, key)
        break
    }
  }

  // Add underline to matching letter
  private addUnderlineIndicator(element: HTMLElement, key: string) {
    const text = element.textContent || ''
    const regex = new RegExp(`(${key})`, 'i')
    const match = text.match(regex)
    
    if (match && match.index !== undefined) {
      const before = text.substring(0, match.index)
      const letter = text.substring(match.index, match.index + 1)
      const after = text.substring(match.index + 1)
      
      element.innerHTML = `${before}<u class="shortcut-underline">${letter}</u>${after}`
    }
  }

  // Add badge indicator
  private addBadgeIndicator(element: HTMLElement, key: string) {
    if (!element.querySelector('.shortcut-badge')) {
      const badge = document.createElement('span')
      badge.className = 'shortcut-badge'
      badge.textContent = key.toUpperCase()
      element.appendChild(badge)
    }
  }

  // Add superscript indicator
  private addSuperscriptIndicator(element: HTMLElement, key: string) {
    if (!element.querySelector('.shortcut-superscript')) {
      const sup = document.createElement('sup')
      sup.className = 'shortcut-superscript'
      sup.textContent = key.toUpperCase()
      element.appendChild(sup)
    }
  }

  // Clear shortcuts for a container
  clearShortcuts(container?: HTMLElement) {
    const targetContainer = container || document.body
    const elements = targetContainer.querySelectorAll('[data-shortcut-key]')
    elements.forEach(element => {
      const id = this.elementMap.get(element as HTMLElement)
      if (id) {
        const shortcut = this.shortcuts.get(id)
        if (shortcut) {
          this.usedKeys.delete(shortcut.key)
        }
        this.shortcuts.delete(id)
        this.elementMap.delete(element as HTMLElement)
      }
      element.removeAttribute('data-shortcut-key')
    })
  }

  // Get shortcut for an element
  getShortcut(element: HTMLElement): AssignedShortcut | null {
    const id = this.elementMap.get(element)
    return id ? this.shortcuts.get(id) || null : null
  }

  // Get all assigned shortcuts
  getAllShortcuts(): AssignedShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  // Handle keyboard event
  handleKeyPress(event: KeyboardEvent): boolean {
    // Check modifier key
    const modifierPressed = 
      (shortcutConfig.modifier === 'alt' && event.altKey) ||
      (shortcutConfig.modifier === 'ctrl' && event.ctrlKey) ||
      (shortcutConfig.modifier === 'cmd' && (event.metaKey || event.ctrlKey))

    if (!modifierPressed) return false

    const key = event.key.toLowerCase()
    
    // Find matching shortcut
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.key === key) {
        event.preventDefault()
        event.stopPropagation()
        
        // Trigger click on the element
        shortcut.element.click()
        
        // Visual feedback
        shortcut.element.classList.add('shortcut-activated')
        setTimeout(() => {
          shortcut.element.classList.remove('shortcut-activated')
        }, 200)
        
        return true
      }
    }

    return false
  }
}