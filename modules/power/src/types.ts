import { z } from 'zod'

export const PowerGenerationSchema = z.object({
  id: z.string().uuid().optional(),
  timestamp: z.date().default(() => new Date()),
  totalGeneration: z.number().positive(), // MW
  gridExport: z.number().min(0), // MW
  internalUse: z.number().positive(), // MW
  bagasseUsed: z.number().positive(), // MT
  steamPressure: z.number().positive(), // kg/cm²
  steamFlow: z.number().positive(), // MT/hour
  efficiency: z.number().min(0).max(100), // percentage
  coalUsed: z.number().min(0).optional(), // MT (backup fuel)
  boilerLoadFactor: z.number().min(0).max(100), // percentage
})

export type PowerGeneration = z.infer<typeof PowerGenerationSchema>

export interface PowerMetrics {
  generation: {
    current: number // MW
    today: number // MWh
    month: number // MWh
    gridExport: number // MW
    internalUse: number // MW
  }
  efficiency: {
    overall: number // %
    boiler: number // %
    turbine: number // %
  }
  fuel: {
    bagasseConsumption: number // MT/hour
    coalConsumption: number // MT/hour
    calorificValue: number // kcal/kg
  }
  steam: {
    pressure: number // kg/cm²
    temperature: number // °C
    flow: number // MT/hour
  }
}