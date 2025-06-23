import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import companyRoutes from './company'

const app = new Hono()

// Mount company routes
app.route('/', companyRoutes)

// Complete setup endpoint
const completeSetupSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    legalName: z.string().min(1),
    gstNumber: z.string(),
    panNumber: z.string(),
    tanNumber: z.string().optional(),
    cinNumber: z.string().optional(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    email: z.string().email(),
    phone: z.string(),
    website: z.string().optional(),
    fyStartMonth: z.number(),
    currentFY: z.string()
  }),
  factories: z.array(z.object({
    name: z.string(),
    type: z.enum(['sugar', 'ethanol', 'integrated', 'feed']),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    crushingCapacity: z.number().optional(),
    powerCapacity: z.number().optional(),
    ethanolCapacity: z.number().optional(),
    gstNumber: z.string().optional(),
    factoryLicense: z.string().optional(),
    pollutionLicense: z.string().optional()
  })).min(1),
  masterDataTemplate: z.string()
})

app.post('/complete', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const data = completeSetupSchema.parse(body)
    
    // In production, this would:
    // 1. Create company record
    // 2. Create factory records
    // 3. Set up master data based on template
    // 4. Create default users and roles
    // 5. Initialize chart of accounts
    
    // Generate IDs and codes
    const companyId = crypto.randomUUID()
    const companyCode = `COMP${Date.now().toString().slice(-6)}`
    
    const company = {
      id: companyId,
      code: companyCode,
      ...data.company,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const factories = data.factories.map((factory, index) => ({
      id: crypto.randomUUID(),
      companyId,
      code: `PLANT${String(index + 1).padStart(3, '0')}`,
      ...factory,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    // Mock response
    const setupResult = {
      company,
      factories,
      mastersCreated: {
        chartOfAccounts: 150,
        taxRates: 10,
        hsnCodes: 50,
        materialCategories: 20,
        approvalMatrix: 5
      }
    }
    
    return c.json({
      success: true,
      data: setupResult,
      message: 'Setup completed successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    return c.json({ error: 'Setup failed' }, 500)
  }
})

// Check if setup is complete
app.get('/status', authMiddleware, async (c) => {
  try {
    // In production, check if user has any companies set up
    const hasCompanies = false // Mock value
    
    return c.json({
      isSetupComplete: hasCompanies,
      companiesCount: 0
    })
  } catch (error) {
    return c.json({ error: 'Failed to check setup status' }, 500)
  }
})

export default app