import { z } from 'zod'

// Farmer schemas
export const FarmerSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(2),
  village: z.string(),
  phoneNumber: z.string(),
  bankAccount: z.string().optional(),
  landArea: z.number().positive(),
  contractedArea: z.number().positive(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  createdAt: z.date().default(() => new Date()),
})

export const CreateFarmerSchema = FarmerSchema.omit({ 
  id: true, 
  createdAt: true 
}).extend({
  code: z.string().optional(), // Auto-generated if not provided
})

export const UpdateFarmerSchema = CreateFarmerSchema.partial()

export const DeliverySchema = z.object({
  id: z.string().uuid().optional(),
  farmerId: z.string().uuid(),
  date: z.date().default(() => new Date()),
  vehicleNumber: z.string(),
  grossWeight: z.number().positive(),
  tareWeight: z.number().positive(),
  netWeight: z.number().positive(),
  qualityGrade: z.string(),
  recoveryRate: z.number().min(0).max(100),
  amount: z.number().positive(),
  paymentStatus: z.enum(['pending', 'processing', 'paid', 'failed']).default('pending'),
})

export type Farmer = z.infer<typeof FarmerSchema>
export type CreateFarmer = z.infer<typeof CreateFarmerSchema>
export type UpdateFarmer = z.infer<typeof UpdateFarmerSchema>
export type Delivery = z.infer<typeof DeliverySchema>

// Farmer service interface
export interface FarmerService {
  getFarmers(filters?: { search?: string; status?: string }): Promise<Farmer[]>
  getFarmerById(id: string): Promise<Farmer | null>
  createFarmer(data: CreateFarmer): Promise<Farmer>
  updateFarmer(id: string, data: UpdateFarmer): Promise<Farmer>
  getFarmerDeliveries(farmerId: string): Promise<Delivery[]>
  calculatePayment(delivery: Partial<Delivery>): Promise<number>
}

// Mock farmer service implementation
export class MockFarmerService implements FarmerService {
  private farmers: Farmer[] = [
    {
      id: '1',
      code: 'F2341',
      name: 'Rajesh Kumar',
      village: 'Chandrapur',
      phoneNumber: '+91 98765 43210',
      bankAccount: 'XXXX1234',
      landArea: 25.5,
      contractedArea: 20,
      status: 'active',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      code: 'F2342',
      name: 'Suresh Patil',
      village: 'Rampur',
      phoneNumber: '+91 98765 43211',
      bankAccount: 'XXXX5678',
      landArea: 18.0,
      contractedArea: 15,
      status: 'active',
      createdAt: new Date('2024-01-02'),
    },
  ]

  private deliveries: Delivery[] = [
    {
      id: '1',
      farmerId: '1',
      date: new Date('2024-01-15'),
      vehicleNumber: 'MH 12 AB 1234',
      grossWeight: 25000,
      tareWeight: 8000,
      netWeight: 17000,
      qualityGrade: 'A',
      recoveryRate: 11.2,
      amount: 52000,
      paymentStatus: 'paid',
    },
  ]

  async getFarmers(filters?: { search?: string; status?: string }) {
    let filtered = this.farmers

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search) ||
        f.code.toLowerCase().includes(search) ||
        f.village.toLowerCase().includes(search)
      )
    }

    if (filters?.status) {
      filtered = filtered.filter(f => f.status === filters.status)
    }

    return filtered
  }

  async getFarmerById(id: string) {
    return this.farmers.find(f => f.id === id) || null
  }

  async createFarmer(data: CreateFarmer): Promise<Farmer> {
    const farmer: Farmer = {
      id: crypto.randomUUID(),
      code: data.code || `F${Date.now()}`,
      ...data,
      createdAt: new Date(),
    }

    this.farmers.push(farmer)
    return farmer
  }

  async updateFarmer(id: string, data: UpdateFarmer): Promise<Farmer> {
    const farmerIndex = this.farmers.findIndex(f => f.id === id)
    if (farmerIndex === -1) {
      throw new Error('Farmer not found')
    }

    this.farmers[farmerIndex] = { ...this.farmers[farmerIndex], ...data }
    return this.farmers[farmerIndex]
  }

  async getFarmerDeliveries(farmerId: string) {
    return this.deliveries.filter(d => d.farmerId === farmerId)
  }

  async calculatePayment(delivery: Partial<Delivery>): Promise<number> {
    if (!delivery.netWeight || !delivery.recoveryRate) {
      throw new Error('Net weight and recovery rate required for payment calculation')
    }

    // Basic payment calculation: Net weight * recovery rate * base rate
    const baseRatePerTon = 3000 // Base rate per ton
    const qualityMultiplier = this.getQualityMultiplier(delivery.qualityGrade || 'B')
    
    return (delivery.netWeight / 1000) * delivery.recoveryRate * baseRatePerTon * qualityMultiplier
  }

  private getQualityMultiplier(grade: string): number {
    const multipliers: Record<string, number> = {
      'A': 1.1,
      'B': 1.0,
      'C': 0.9,
    }
    return multipliers[grade] || 1.0
  }
}