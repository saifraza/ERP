import { Hono } from 'hono'
import { z } from 'zod'

const farmers = new Hono()

// Mock farmer data
const farmersData = [
  {
    id: '1',
    code: 'F2341',
    name: 'Rajesh Kumar',
    village: 'Chandrapur',
    landArea: 25.5,
    contractedArea: 20,
    status: 'active',
    phoneNumber: '+91 98765 43210',
    bankAccount: 'XXXX1234',
    totalDeliveries: 145,
    totalAmount: 450000,
    pendingPayment: 35000,
  },
  {
    id: '2',
    code: 'F2342',
    name: 'Suresh Patil',
    village: 'Rampur',
    landArea: 18.0,
    contractedArea: 15,
    status: 'active',
    phoneNumber: '+91 98765 43211',
    bankAccount: 'XXXX5678',
    totalDeliveries: 98,
    totalAmount: 320000,
    pendingPayment: 0,
  },
]

// Get all farmers
farmers.get('/', (c) => {
  const { search, status } = c.req.query()
  
  let filtered = farmersData
  
  if (search) {
    filtered = filtered.filter(f => 
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.village.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  if (status) {
    filtered = filtered.filter(f => f.status === status)
  }
  
  return c.json({
    farmers: filtered,
    total: filtered.length,
  })
})

// Get farmer by ID
farmers.get('/:id', (c) => {
  const id = c.req.param('id')
  const farmer = farmersData.find(f => f.id === id)
  
  if (!farmer) {
    return c.json({ error: 'Farmer not found' }, 404)
  }
  
  return c.json(farmer)
})

// Create new farmer
const createFarmerSchema = z.object({
  name: z.string().min(2),
  village: z.string(),
  landArea: z.number().positive(),
  contractedArea: z.number().positive(),
  phoneNumber: z.string(),
  bankAccount: z.string(),
})

farmers.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = createFarmerSchema.parse(body)
    
    const newFarmer = {
      id: String(farmersData.length + 1),
      code: `F234${farmersData.length + 1}`,
      ...data,
      status: 'active',
      totalDeliveries: 0,
      totalAmount: 0,
      pendingPayment: 0,
    }
    
    farmersData.push(newFarmer)
    
    return c.json(newFarmer, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update farmer
farmers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const farmerIndex = farmersData.findIndex(f => f.id === id)
  
  if (farmerIndex === -1) {
    return c.json({ error: 'Farmer not found' }, 404)
  }
  
  try {
    const body = await c.req.json()
    farmersData[farmerIndex] = { ...farmersData[farmerIndex], ...body }
    
    return c.json(farmersData[farmerIndex])
  } catch (error) {
    return c.json({ error: 'Invalid input' }, 400)
  }
})

// Get farmer deliveries
farmers.get('/:id/deliveries', (c) => {
  const id = c.req.param('id')
  
  // Mock delivery data
  const deliveries = [
    {
      id: '1',
      date: '2024-01-15',
      vehicleNumber: 'MH 12 AB 1234',
      grossWeight: 25000,
      tareWeight: 8000,
      netWeight: 17000,
      qualityGrade: 'A',
      recoveryRate: 11.2,
      amount: 52000,
      paymentStatus: 'paid',
    },
    {
      id: '2',
      date: '2024-01-10',
      vehicleNumber: 'MH 12 CD 5678',
      grossWeight: 22000,
      tareWeight: 7500,
      netWeight: 14500,
      qualityGrade: 'B',
      recoveryRate: 10.8,
      amount: 43500,
      paymentStatus: 'pending',
    },
  ]
  
  return c.json({
    farmerId: id,
    deliveries,
    total: deliveries.length,
  })
})

export default farmers