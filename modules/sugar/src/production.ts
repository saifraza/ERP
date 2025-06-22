import { z } from 'zod'
import { SugarProduction, SugarProductionSchema, SugarMetrics } from './types'
import { calculateSugarRecovery, formatWeight } from '@erp/common'

export const CreateSugarProductionSchema = SugarProductionSchema.omit({ 
  id: true,
  recoveryRate: true, // Auto-calculated
})

export type CreateSugarProduction = z.infer<typeof CreateSugarProductionSchema>

// Sugar production service interface
export interface SugarProductionService {
  getProduction(filters?: { date?: string; shift?: string; status?: string }): Promise<SugarProduction[]>
  getProductionById(id: string): Promise<SugarProduction | null>
  createProduction(data: CreateSugarProduction): Promise<SugarProduction>
  updateProduction(id: string, data: Partial<SugarProduction>): Promise<SugarProduction>
  getMetrics(period?: 'today' | 'week' | 'month' | 'year'): Promise<SugarMetrics>
  getDashboardData(): Promise<{
    currentProduction: SugarProduction[]
    metrics: SugarMetrics
    alerts: Array<{ type: string; message: string; timestamp: Date }>
  }>
}

// Mock sugar production service
export class MockSugarProductionService implements SugarProductionService {
  private productions: SugarProduction[] = [
    {
      id: '1',
      batchNumber: 'SB-2024-001',
      productionDate: new Date(),
      shift: 'A',
      caneUsed: 100,
      sugarProduced: 11.2,
      recoveryRate: 11.2,
      grade: 'A',
      molassesOutput: 4.5,
      bagasseOutput: 28,
      status: 'completed',
      qualityParameters: {
        pol: 99.7,
        purity: 99.9,
        moisture: 0.05,
        ash: 0.02,
        color: 45,
      },
    },
    {
      id: '2',
      batchNumber: 'SB-2024-002',
      productionDate: new Date(),
      shift: 'B',
      caneUsed: 95,
      sugarProduced: 10.64,
      recoveryRate: 11.2,
      grade: 'A',
      molassesOutput: 4.2,
      bagasseOutput: 26.6,
      status: 'in-progress',
      qualityParameters: {
        pol: 99.6,
        purity: 99.8,
        moisture: 0.06,
        ash: 0.03,
        color: 48,
      },
    },
  ]

  async getProduction(filters?: { date?: string; shift?: string; status?: string }) {
    let filtered = this.productions

    if (filters?.date) {
      filtered = filtered.filter(p => 
        p.productionDate.toISOString().startsWith(filters.date!)
      )
    }

    if (filters?.shift) {
      filtered = filtered.filter(p => p.shift === filters.shift)
    }

    if (filters?.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    return filtered.sort((a, b) => 
      b.productionDate.getTime() - a.productionDate.getTime()
    )
  }

  async getProductionById(id: string) {
    return this.productions.find(p => p.id === id) || null
  }

  async createProduction(data: CreateSugarProduction): Promise<SugarProduction> {
    const recoveryRate = calculateSugarRecovery(data.sugarProduced, data.caneUsed)
    
    const production: SugarProduction = {
      id: crypto.randomUUID(),
      ...data,
      recoveryRate,
    }

    this.productions.unshift(production)
    return production
  }

  async updateProduction(id: string, data: Partial<SugarProduction>): Promise<SugarProduction> {
    const productionIndex = this.productions.findIndex(p => p.id === id)
    if (productionIndex === -1) {
      throw new Error('Production batch not found')
    }

    const updated = { ...this.productions[productionIndex], ...data }
    
    // Recalculate recovery rate if relevant fields changed
    if (data.sugarProduced || data.caneUsed) {
      updated.recoveryRate = calculateSugarRecovery(updated.sugarProduced, updated.caneUsed)
    }

    this.productions[productionIndex] = updated
    return updated
  }

  async getMetrics(period: 'today' | 'week' | 'month' | 'year' = 'today'): Promise<SugarMetrics> {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    const filtered = this.productions.filter(p => p.productionDate >= startDate)
    const completed = filtered.filter(p => p.status === 'completed')

    const totalSugar = completed.reduce((sum, p) => sum + p.sugarProduced, 0)
    const totalCane = completed.reduce((sum, p) => sum + p.caneUsed, 0)
    const avgRecovery = totalCane > 0 ? (totalSugar / totalCane) * 100 : 0

    // Grade distribution
    const gradeDistribution: Record<string, number> = {}
    completed.forEach(p => {
      gradeDistribution[p.grade] = (gradeDistribution[p.grade] || 0) + p.sugarProduced
    })

    return {
      production: {
        today: period === 'today' ? totalSugar : completed.length > 0 ? completed[0].sugarProduced : 0,
        month: period === 'month' ? totalSugar : 450, // Mock data
        year: period === 'year' ? totalSugar : 5400, // Mock data
        target: period === 'today' ? 12 : 500, // Mock targets
        efficiency: Math.min(100, (totalSugar / (period === 'today' ? 12 : 500)) * 100),
      },
      crushing: {
        rate: 4.2, // MT/hour
        extractionRate: 97.5,
        operatingHours: 22,
      },
      quality: {
        averageRecovery: avgRecovery,
        gradeDistribution,
        rejectionRate: 2.5,
      },
      inventory: {
        caneStock: 2500,
        sugarStock: 180,
        molassesStock: 45,
      },
    }
  }

  async getDashboardData() {
    const currentProduction = await this.getProduction({ 
      date: new Date().toISOString().split('T')[0] 
    })
    const metrics = await this.getMetrics('today')

    const alerts = [
      {
        type: 'warning',
        message: 'Mill 2 efficiency below 90%',
        timestamp: new Date(),
      },
      {
        type: 'info',
        message: 'Quality test completed for batch SB-2024-002',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    ]

    return {
      currentProduction,
      metrics,
      alerts,
    }
  }
}