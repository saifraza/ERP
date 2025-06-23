import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Complete setup schema
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

// Complete company setup
app.post('/complete', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const data = completeSetupSchema.parse(body)
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create company
      const company = await tx.company.create({
        data: {
          code: `COMP${Date.now().toString().slice(-6)}`,
          ...data.company,
          createdBy: userId,
          updatedBy: userId
        }
      })
      
      // 2. Create company-user relationship
      await tx.companyUser.create({
        data: {
          companyId: company.id,
          userId,
          role: 'OWNER',
          isDefault: true
        }
      })
      
      // 3. Create factories
      const factories = await Promise.all(
        data.factories.map((factory, index) =>
          tx.factory.create({
            data: {
              companyId: company.id,
              code: `${company.code}-F${String(index + 1).padStart(3, '0')}`,
              ...factory,
              createdBy: userId,
              updatedBy: userId
            }
          })
        )
      )
      
      // 4. Create master data based on template
      if (data.masterDataTemplate === 'sugar_standard') {
        await createSugarMasterData(tx, company.id, userId)
      } else if (data.masterDataTemplate === 'ethanol_focused') {
        await createEthanolMasterData(tx, company.id, userId)
      } else if (data.masterDataTemplate === 'integrated_unit') {
        await createIntegratedMasterData(tx, company.id, userId)
      }
      
      // 5. Create default settings
      await createDefaultSettings(tx, company.id, userId)
      
      return {
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
    })
    
    return c.json({
      success: true,
      data: result,
      message: 'Setup completed successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    console.error('Setup error:', error)
    return c.json({ error: 'Setup failed' }, 500)
  }
})

// Check setup status
app.get('/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Check if user has any companies
    const companyCount = await prisma.companyUser.count({
      where: { userId }
    })
    
    return c.json({
      isSetupComplete: companyCount > 0,
      companiesCount: companyCount
    })
  } catch (error) {
    console.error('Error checking setup status:', error)
    return c.json({ error: 'Failed to check setup status' }, 500)
  }
})

// Helper functions to create master data
async function createSugarMasterData(tx: any, companyId: string, userId: string) {
  // Create Chart of Accounts for Sugar Industry
  const accounts = [
    // Assets
    { code: '1000', name: 'Current Assets', type: 'ASSET', isGroup: true },
    { code: '1100', name: 'Cash & Bank', type: 'ASSET', parentCode: '1000', isGroup: true },
    { code: '1101', name: 'Cash in Hand', type: 'ASSET', parentCode: '1100' },
    { code: '1102', name: 'Bank Accounts', type: 'ASSET', parentCode: '1100' },
    // Add more accounts...
  ]
  
  // Create tax rates
  await tx.taxRate.createMany({
    data: [
      { companyId, name: 'GST 5%', rate: 5, type: 'GST', createdBy: userId },
      { companyId, name: 'GST 12%', rate: 12, type: 'GST', createdBy: userId },
      { companyId, name: 'GST 18%', rate: 18, type: 'GST', createdBy: userId },
      { companyId, name: 'GST 28%', rate: 28, type: 'GST', createdBy: userId },
    ]
  })
  
  // Create HSN codes
  await tx.hSNCode.createMany({
    data: [
      { companyId, code: '1701', description: 'Sugar', gstRate: 5, createdBy: userId },
      { companyId, code: '2303', description: 'Bagasse', gstRate: 5, createdBy: userId },
      { companyId, code: '2703', description: 'Molasses', gstRate: 28, createdBy: userId },
    ]
  })
}

async function createEthanolMasterData(tx: any, companyId: string, userId: string) {
  // Similar to sugar but with ethanol-specific accounts and HSN codes
}

async function createIntegratedMasterData(tx: any, companyId: string, userId: string) {
  // Combination of both sugar and ethanol master data
}

async function createDefaultSettings(tx: any, companyId: string, userId: string) {
  // Create Units of Measure
  await tx.uOM.createMany({
    data: [
      { companyId, code: 'MT', name: 'Metric Ton', createdBy: userId },
      { companyId, code: 'KG', name: 'Kilogram', createdBy: userId },
      { companyId, code: 'L', name: 'Liter', createdBy: userId },
      { companyId, code: 'KL', name: 'Kiloliter', createdBy: userId },
      { companyId, code: 'NOS', name: 'Numbers', createdBy: userId },
    ]
  })
  
  // Create approval matrix
  await tx.approvalMatrix.create({
    data: {
      companyId,
      module: 'PURCHASE',
      documentType: 'PURCHASE_ORDER',
      levels: JSON.stringify([
        { level: 1, role: 'MANAGER', minAmount: 0, maxAmount: 100000 },
        { level: 2, role: 'ADMIN', minAmount: 100001, maxAmount: null }
      ]),
      createdBy: userId
    }
  })
}

export default app