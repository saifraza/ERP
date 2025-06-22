// Common utility functions

/**
 * Generate a unique receipt number with prefix
 */
export function generateReceiptNumber(prefix: string = 'RCP'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${timestamp}${random}`
}

/**
 * Calculate efficiency percentage
 */
export function calculateEfficiency(actual: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, (actual / target) * 100)
}

/**
 * Format weight with appropriate units
 */
export function formatWeight(kg: number): { value: number; unit: string } {
  if (kg >= 1000) {
    return { value: parseFloat((kg / 1000).toFixed(2)), unit: 'MT' }
  }
  return { value: parseFloat(kg.toFixed(2)), unit: 'kg' }
}

/**
 * Format power with appropriate units
 */
export function formatPower(watts: number): { value: number; unit: string } {
  if (watts >= 1000000) {
    return { value: parseFloat((watts / 1000000).toFixed(2)), unit: 'MW' }
  }
  if (watts >= 1000) {
    return { value: parseFloat((watts / 1000).toFixed(2)), unit: 'kW' }
  }
  return { value: parseFloat(watts.toFixed(2)), unit: 'W' }
}

/**
 * Format volume with appropriate units
 */
export function formatVolume(liters: number): { value: number; unit: string } {
  if (liters >= 1000000) {
    return { value: parseFloat((liters / 1000000).toFixed(2)), unit: 'ML' }
  }
  if (liters >= 1000) {
    return { value: parseFloat((liters / 1000).toFixed(2)), unit: 'kL' }
  }
  return { value: parseFloat(liters.toFixed(2)), unit: 'L' }
}

/**
 * Calculate sugar recovery rate
 */
export function calculateSugarRecovery(
  sugarProduced: number,
  caneProcessed: number
): number {
  if (caneProcessed === 0) return 0
  return (sugarProduced / caneProcessed) * 100
}

/**
 * Calculate bagasse percentage
 */
export function calculateBagassePercentage(
  bagasseProduced: number,
  caneProcessed: number
): number {
  if (caneProcessed === 0) return 0
  return (bagasseProduced / caneProcessed) * 100
}

/**
 * Validate Indian vehicle number format
 */
export function validateVehicleNumber(vehicleNumber: string): boolean {
  const pattern = /^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/
  return pattern.test(vehicleNumber.replace(/\s+/g, ' ').trim())
}

/**
 * Format Indian currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate payment based on weight, recovery rate, and quality
 */
export function calculatePayment(
  netWeight: number, // in kg
  recoveryRate: number, // percentage
  qualityGrade: string,
  baseRate: number = 3000 // per MT
): number {
  const weightInMT = netWeight / 1000
  const qualityMultiplier = getQualityMultiplier(qualityGrade)
  const recoveryMultiplier = recoveryRate / 100
  
  return weightInMT * baseRate * qualityMultiplier * recoveryMultiplier
}

/**
 * Get quality multiplier based on grade
 */
function getQualityMultiplier(grade: string): number {
  const multipliers: Record<string, number> = {
    'A+': 1.2,
    'A': 1.1,
    'B+': 1.05,
    'B': 1.0,
    'C+': 0.95,
    'C': 0.9,
    'D': 0.8,
  }
  return multipliers[grade] || 1.0
}

/**
 * Get status color for UI components
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    operational: 'green',
    active: 'green',
    completed: 'green',
    paid: 'green',
    maintenance: 'yellow',
    pending: 'yellow',
    'in-progress': 'blue',
    processing: 'blue',
    breakdown: 'red',
    error: 'red',
    failed: 'red',
    inactive: 'gray',
    retired: 'gray',
    cancelled: 'gray',
  }
  return colors[status.toLowerCase()] || 'gray'
}

/**
 * Convert timestamp to IST
 */
export function toIST(date: Date): Date {
  return new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
}

/**
 * Generate farmer code
 */
export function generateFarmerCode(serialNumber: number): string {
  return `F${serialNumber.toString().padStart(4, '0')}`
}

/**
 * Validate and format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substr(0, 5)} ${cleaned.substr(5)}`
  }
  return phone
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay))
}