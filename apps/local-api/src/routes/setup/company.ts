import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'

const app = new Hono()

// Get all companies for the current user
app.get('/companies', authMiddleware, async (c) => {
  try {
    // For now, return mock data
    // In production, this would query the database for companies the user has access to
    const mockCompanies = []
    
    return c.json({
      companies: mockCompanies,
      success: true
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch companies' }, 500)
  }
})

// Create a new company
const createCompanySchema = z.object({
  name: z.string().min(1),
  legalName: z.string().min(1),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  tanNumber: z.string().regex(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/).optional(),
  cinNumber: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  website: z.string().url().optional(),
  fyStartMonth: z.number().min(1).max(12),
  currentFY: z.string().min(1)
})

app.post('/companies', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const data = createCompanySchema.parse(body)
    
    // Generate company code
    const companyCode = `COMP${Date.now().toString().slice(-6)}`
    
    // In production, save to database
    const company = {
      id: crypto.randomUUID(),
      code: companyCode,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return c.json({
      company,
      success: true
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to create company' }, 500)
  }
})

export default app