// Ethanol division exports
export * from './production'
export * from './types'

// Mock ethanol data
export const mockEthanolData = {
  production: {
    today: 4500, // Liters
    month: 45000, // Liters
    year: 540000, // Liters
  },
  fermentation: {
    activeTanks: 3,
    efficiency: 96.5, // %
    averageTime: 72, // hours
  },
  distillation: {
    purity: 99.8, // %
    yield: 94.2, // %
  },
  storage: {
    totalCapacity: 100000, // Liters
    currentStock: 67500, // Liters
  },
}