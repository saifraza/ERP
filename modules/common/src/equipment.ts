import { z } from 'zod'

// Equipment schemas
export const EquipmentSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  division: z.enum(['sugar', 'power', 'ethanol', 'feed', 'common']),
  type: z.string(),
  status: z.enum(['operational', 'maintenance', 'breakdown', 'retired']).default('operational'),
  efficiency: z.number().min(0).max(100).optional(),
  lastMaintenance: z.date().optional(),
  nextMaintenance: z.date().optional(),
  specifications: z.record(z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
})

export const MaintenanceLogSchema = z.object({
  id: z.string().uuid().optional(),
  equipmentId: z.string().uuid(),
  date: z.date().default(() => new Date()),
  type: z.enum(['preventive', 'corrective', 'breakdown', 'inspection']),
  description: z.string(),
  cost: z.number().positive().optional(),
  performedBy: z.string(),
  nextDue: z.date().optional(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    quantity: z.number().positive(),
    cost: z.number().positive().optional(),
  })).optional(),
})

export type Equipment = z.infer<typeof EquipmentSchema>
export type MaintenanceLog = z.infer<typeof MaintenanceLogSchema>

// Equipment service interface
export interface EquipmentService {
  getEquipment(filters?: { division?: string; status?: string }): Promise<Equipment[]>
  getEquipmentById(id: string): Promise<Equipment | null>
  updateEquipmentStatus(id: string, status: Equipment['status']): Promise<Equipment>
  getMaintenanceLogs(equipmentId: string): Promise<MaintenanceLog[]>
  createMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): Promise<MaintenanceLog>
  getMaintenanceSchedule(): Promise<Equipment[]>
}

// Mock equipment service
export class MockEquipmentService implements EquipmentService {
  private equipment: Equipment[] = [
    {
      id: '1',
      code: 'MILL-01',
      name: 'Sugar Mill 1',
      division: 'sugar',
      type: 'Mill',
      status: 'operational',
      efficiency: 94,
      lastMaintenance: new Date('2024-01-01'),
      nextMaintenance: new Date('2024-04-01'),
      specifications: {
        capacity: '500 TCD',
        power: '750 HP',
      },
      createdAt: new Date('2023-01-01'),
    },
    {
      id: '2',
      code: 'BOILER-01',
      name: 'Main Boiler',
      division: 'power',
      type: 'Boiler',
      status: 'operational',
      efficiency: 89,
      lastMaintenance: new Date('2024-01-15'),
      nextMaintenance: new Date('2024-02-15'),
      specifications: {
        capacity: '45 TPH',
        pressure: '87 kg/cm²',
      },
      createdAt: new Date('2023-01-01'),
    },
    {
      id: '3',
      code: 'FERM-01',
      name: 'Fermentation Tank 1',
      division: 'ethanol',
      type: 'Tank',
      status: 'operational',
      efficiency: 96,
      specifications: {
        capacity: '50000 L',
        material: 'Stainless Steel',
      },
      createdAt: new Date('2023-01-01'),
    },
  ]

  private maintenanceLogs: MaintenanceLog[] = [
    {
      id: '1',
      equipmentId: '1',
      date: new Date('2024-01-01'),
      type: 'preventive',
      description: 'Regular maintenance and lubrication',
      cost: 15000,
      performedBy: 'Maintenance Team A',
      nextDue: new Date('2024-04-01'),
    },
  ]

  async getEquipment(filters?: { division?: string; status?: string }) {
    let filtered = this.equipment

    if (filters?.division) {
      filtered = filtered.filter(e => e.division === filters.division)
    }

    if (filters?.status) {
      filtered = filtered.filter(e => e.status === filters.status)
    }

    return filtered
  }

  async getEquipmentById(id: string) {
    return this.equipment.find(e => e.id === id) || null
  }

  async updateEquipmentStatus(id: string, status: Equipment['status']) {
    const equipmentIndex = this.equipment.findIndex(e => e.id === id)
    if (equipmentIndex === -1) {
      throw new Error('Equipment not found')
    }

    this.equipment[equipmentIndex].status = status
    return this.equipment[equipmentIndex]
  }

  async getMaintenanceLogs(equipmentId: string) {
    return this.maintenanceLogs.filter(log => log.equipmentId === equipmentId)
  }

  async createMaintenanceLog(log: Omit<MaintenanceLog, 'id'>) {
    const newLog: MaintenanceLog = {
      id: crypto.randomUUID(),
      ...log,
    }

    this.maintenanceLogs.push(newLog)

    // Update equipment last maintenance date
    const equipment = this.equipment.find(e => e.id === log.equipmentId)
    if (equipment) {
      equipment.lastMaintenance = log.date
      if (log.nextDue) {
        equipment.nextMaintenance = log.nextDue
      }
    }

    return newLog
  }

  async getMaintenanceSchedule() {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return this.equipment.filter(e => 
      e.nextMaintenance && e.nextMaintenance <= nextWeek
    )
  }
}