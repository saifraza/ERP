// Power division exports
export * from './generation'
export * from './types'

// Mock power generation data
export const mockPowerData = {
  currentGeneration: 12.5, // MW
  gridExport: 8.5, // MW
  internalUse: 4.0, // MW
  efficiency: 88.3, // %
  bagasseConsumption: 24.5, // MT/hour
  steamPressure: 87, // kg/cm²
  boilerEfficiency: 89.2, // %
}