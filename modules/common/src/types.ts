import { z } from 'zod'

// Common business types
export interface ProductionMetrics {
  production: number
  efficiency: number
  quality: string
  timestamp: Date
}

export interface EquipmentStatus {
  id: string
  name: string
  status: 'operational' | 'maintenance' | 'breakdown' | 'offline'
  efficiency: number
  lastMaintenance?: Date
  nextMaintenance?: Date
}

export interface Division {
  id: string
  name: string
  metrics: ProductionMetrics
  equipment: EquipmentStatus[]
  alerts: Alert[]
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  acknowledged: boolean
  division?: string
}

// Validation schemas
export const WeightSchema = z.object({
  value: z.number().min(0),
  unit: z.literal('kg'),
  timestamp: z.date().default(() => new Date()),
  stable: z.boolean().default(false),
})

export const VehicleSchema = z.object({
  number: z.string().min(1),
  type: z.enum(['truck', 'tractor', 'trailer']).default('truck'),
  capacity: z.number().positive().optional(),
})

export const QualityParametersSchema = z.object({
  grade: z.string(),
  recoveryRate: z.number().min(0).max(100),
  moisture: z.number().min(0).max(100).optional(),
  purity: z.number().min(0).max(100).optional(),
  fiber: z.number().min(0).max(100).optional(),
})

export type Weight = z.infer<typeof WeightSchema>
export type Vehicle = z.infer<typeof VehicleSchema>
export type QualityParameters = z.infer<typeof QualityParametersSchema>