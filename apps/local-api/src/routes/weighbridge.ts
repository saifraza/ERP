import { Hono } from 'hono'
import { z } from 'zod'

const weighbridge = new Hono()

// Mock weighbridge data
const weighbridgeData = {
  status: 'connected',
  currentWeight: 0,
  lastCalibration: '2024-01-01',
  transactions: [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00',
      vehicleNumber: 'MH 12 AB 1234',
      farmerCode: 'F2341',
      farmerName: 'Rajesh Kumar',
      grossWeight: 25000,
      tareWeight: 8000,
      netWeight: 17000,
      receiptNumber: 'WB2024001',
      status: 'completed',
    },
    {
      id: '2',
      timestamp: '2024-01-15T11:45:00',
      vehicleNumber: 'MH 12 CD 5678',
      farmerCode: 'F2342',
      farmerName: 'Suresh Patil',
      grossWeight: 22000,
      tareWeight: null,
      netWeight: null,
      receiptNumber: 'WB2024002',
      status: 'in-progress',
    },
  ],
}

// Get weighbridge status
weighbridge.get('/status', (c) => {
  return c.json({
    status: weighbridgeData.status,
    currentWeight: weighbridgeData.currentWeight,
    lastCalibration: weighbridgeData.lastCalibration,
    activeTransactions: weighbridgeData.transactions.filter(t => t.status === 'in-progress').length,
  })
})

// Get current weight (real-time endpoint)
weighbridge.get('/weight', (c) => {
  // Simulate real-time weight with some randomness
  const baseWeight = weighbridgeData.currentWeight
  const variation = Math.floor(Math.random() * 100) - 50
  
  return c.json({
    weight: Math.max(0, baseWeight + variation),
    unit: 'kg',
    timestamp: new Date().toISOString(),
    stable: Math.random() > 0.2, // 80% chance of stable reading
  })
})

// Get transactions
weighbridge.get('/transactions', (c) => {
  const { date, status } = c.req.query()
  
  let filtered = weighbridgeData.transactions
  
  if (date) {
    filtered = filtered.filter(t => t.timestamp.startsWith(date))
  }
  
  if (status) {
    filtered = filtered.filter(t => t.status === status)
  }
  
  return c.json({
    transactions: filtered,
    total: filtered.length,
  })
})

// Create new transaction (vehicle entry)
const createTransactionSchema = z.object({
  vehicleNumber: z.string(),
  farmerCode: z.string(),
  farmerName: z.string(),
})

weighbridge.post('/transactions', async (c) => {
  try {
    const body = await c.req.json()
    const data = createTransactionSchema.parse(body)
    
    const newTransaction = {
      id: String(weighbridgeData.transactions.length + 1),
      timestamp: new Date().toISOString(),
      ...data,
      grossWeight: null,
      tareWeight: null,
      netWeight: null,
      receiptNumber: `WB2024${String(weighbridgeData.transactions.length + 1).padStart(3, '0')}`,
      status: 'in-progress',
    }
    
    weighbridgeData.transactions.unshift(newTransaction)
    
    return c.json(newTransaction, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update transaction (capture weight)
const updateTransactionSchema = z.object({
  grossWeight: z.number().optional(),
  tareWeight: z.number().optional(),
})

weighbridge.put('/transactions/:id', async (c) => {
  const id = c.req.param('id')
  const transactionIndex = weighbridgeData.transactions.findIndex(t => t.id === id)
  
  if (transactionIndex === -1) {
    return c.json({ error: 'Transaction not found' }, 404)
  }
  
  try {
    const body = await c.req.json()
    const data = updateTransactionSchema.parse(body)
    
    const transaction = weighbridgeData.transactions[transactionIndex]
    
    if (data.grossWeight !== undefined) {
      transaction.grossWeight = data.grossWeight
    }
    
    if (data.tareWeight !== undefined) {
      transaction.tareWeight = data.tareWeight
      
      // Calculate net weight if both weights are available
      if (transaction.grossWeight && transaction.tareWeight) {
        transaction.netWeight = transaction.grossWeight - transaction.tareWeight
        transaction.status = 'completed'
      }
    }
    
    return c.json(transaction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Print receipt
weighbridge.post('/transactions/:id/print', (c) => {
  const id = c.req.param('id')
  const transaction = weighbridgeData.transactions.find(t => t.id === id)
  
  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }
  
  if (transaction.status !== 'completed') {
    return c.json({ error: 'Transaction not completed' }, 400)
  }
  
  // Mock receipt generation
  return c.json({
    success: true,
    receiptNumber: transaction.receiptNumber,
    printedAt: new Date().toISOString(),
  })
})

export default weighbridge