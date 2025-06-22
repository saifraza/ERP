import { z } from 'zod'
import { WeightSchema, VehicleSchema } from './types'

// Weighbridge transaction schemas
export const WeighbridgeTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  timestamp: z.date().default(() => new Date()),
  vehicleNumber: z.string().min(1),
  farmerCode: z.string().optional(),
  farmerName: z.string().optional(),
  grossWeight: z.number().positive().optional(),
  tareWeight: z.number().positive().optional(),
  netWeight: z.number().positive().optional(),
  receiptNumber: z.string(),
  status: z.enum(['in-progress', 'completed', 'cancelled']).default('in-progress'),
})

export const CreateTransactionSchema = z.object({
  vehicleNumber: z.string().min(1),
  farmerCode: z.string(),
  farmerName: z.string(),
})

export const UpdateWeightSchema = z.object({
  grossWeight: z.number().positive().optional(),
  tareWeight: z.number().positive().optional(),
})

export type WeighbridgeTransaction = z.infer<typeof WeighbridgeTransactionSchema>
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>
export type UpdateWeight = z.infer<typeof UpdateWeightSchema>

// Weighbridge service interface
export interface WeighbridgeService {
  getCurrentWeight(): Promise<{ weight: number; stable: boolean; timestamp: Date }>
  createTransaction(data: CreateTransaction): Promise<WeighbridgeTransaction>
  updateWeight(id: string, weights: UpdateWeight): Promise<WeighbridgeTransaction>
  getTransactions(filters?: { date?: string; status?: string }): Promise<WeighbridgeTransaction[]>
  printReceipt(id: string): Promise<{ success: boolean; receiptNumber: string }>
}

// Mock weighbridge implementation
export class MockWeighbridgeService implements WeighbridgeService {
  private transactions: WeighbridgeTransaction[] = []
  private currentWeight = 0

  async getCurrentWeight() {
    // Simulate weight fluctuation
    const variation = Math.floor(Math.random() * 100) - 50
    this.currentWeight = Math.max(0, this.currentWeight + variation)
    
    return {
      weight: this.currentWeight,
      stable: Math.random() > 0.3, // 70% stable
      timestamp: new Date(),
    }
  }

  async createTransaction(data: CreateTransaction): Promise<WeighbridgeTransaction> {
    const transaction: WeighbridgeTransaction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...data,
      receiptNumber: `WB${Date.now()}`,
      status: 'in-progress',
    }
    
    this.transactions.unshift(transaction)
    return transaction
  }

  async updateWeight(id: string, weights: UpdateWeight): Promise<WeighbridgeTransaction> {
    const transaction = this.transactions.find(t => t.id === id)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    Object.assign(transaction, weights)
    
    // Calculate net weight if both weights available
    if (transaction.grossWeight && transaction.tareWeight) {
      transaction.netWeight = transaction.grossWeight - transaction.tareWeight
      transaction.status = 'completed'
    }

    return transaction
  }

  async getTransactions(filters?: { date?: string; status?: string }) {
    let filtered = this.transactions

    if (filters?.date) {
      filtered = filtered.filter(t => 
        t.timestamp.toISOString().startsWith(filters.date!)
      )
    }

    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status)
    }

    return filtered
  }

  async printReceipt(id: string) {
    const transaction = this.transactions.find(t => t.id === id)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    if (transaction.status !== 'completed') {
      throw new Error('Transaction not completed')
    }

    return {
      success: true,
      receiptNumber: transaction.receiptNumber,
    }
  }
}