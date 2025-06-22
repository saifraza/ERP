import { z } from 'zod'

// Sugar-specific types
export const SugarProductionSchema = z.object({
  id: z.string().uuid().optional(),
  batchNumber: z.string(),
  productionDate: z.date().default(() => new Date()),
  shift: z.enum(['A', 'B', 'C']),
  caneUsed: z.number().positive(), // MT
  sugarProduced: z.number().positive(), // MT
  recoveryRate: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B+', 'B', 'C']),
  molassesOutput: z.number().positive(), // MT
  bagasseOutput: z.number().positive(), // MT
  status: z.enum(['in-progress', 'completed', 'quality-check', 'approved', 'rejected']).default('in-progress'),
  qualityParameters: z.object({
    pol: z.number().min(0).max(100), // Percentage of sucrose
    purity: z.number().min(0).max(100),
    moisture: z.number().min(0).max(10),
    ash: z.number().min(0).max(5),
    color: z.number().positive(), // ICUMSA units
  }),
})

export const CrushingOperationSchema = z.object({
  id: z.string().uuid().optional(),
  timestamp: z.date().default(() => new Date()),
  millNumber: z.number().int().min(1).max(10),
  caneInput: z.number().positive(), // MT/hour
  juiceExtracted: z.number().positive(), // Liters/hour
  bagasseOutput: z.number().positive(), // MT/hour
  extractionRate: z.number().min(0).max(100), // percentage
  imbibitionWater: z.number().positive(), // Liters/hour
  millSpeed: z.number().positive(), // RPM
  pressureRoll1: z.number().positive(), // Bar
  pressureRoll2: z.number().positive(), // Bar
  pressureRoll3: z.number().positive(), // Bar
})

export const QualityTestSchema = z.object({
  id: z.string().uuid().optional(),
  batchId: z.string().uuid(),
  testDate: z.date().default(() => new Date()),
  testType: z.enum(['incoming-cane', 'juice', 'syrup', 'final-sugar']),
  parameters: z.record(z.union([z.number(), z.string()])),
  result: z.enum(['pass', 'fail', 'conditional']),
  remarks: z.string().optional(),
  testedBy: z.string(),
})

export type SugarProduction = z.infer<typeof SugarProductionSchema>
export type CrushingOperation = z.infer<typeof CrushingOperationSchema>
export type QualityTest = z.infer<typeof QualityTestSchema>

// Sugar division metrics
export interface SugarMetrics {
  production: {
    today: number
    month: number
    year: number
    target: number
    efficiency: number
  }
  crushing: {
    rate: number // MT/hour
    extractionRate: number // percentage
    operatingHours: number
  }
  quality: {
    averageRecovery: number
    gradeDistribution: Record<string, number>
    rejectionRate: number
  }
  inventory: {
    caneStock: number // MT
    sugarStock: number // MT
    molassesStock: number // MT
  }
}