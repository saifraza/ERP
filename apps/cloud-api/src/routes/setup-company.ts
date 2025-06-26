import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Check if user has company
app.get('/check-status', async (c) => {
  try {
    const userId = c.get('userId')
    
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      include: {
        company: {
          include: {
            factories: true
          }
        }
      }
    })
    
    return c.json({
      hasCompany: !!companyUser,
      company: companyUser?.company || null
    })
  } catch (error) {
    console.error('Check status error:', error)
    return c.json({ error: 'Failed to check status' }, 500)
  }
})

// Schema for company setup
const companySetupSchema = z.object({
  company: z.object({
    name: z.string(),
    legalName: z.string(),
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
    currentFY: z.string(),
    logo: z.string().optional(), // Base64 encoded image
    letterhead: z.string().optional() // Base64 encoded image/pdf
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
    feedCapacity: z.number().optional(),
    gstNumber: z.string().optional(),
    factoryLicense: z.string().optional(),
    pollutionLicense: z.string().optional()
  })),
  masterDataTemplate: z.string()
})

// Complete company setup
app.post('/complete', async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    
    console.log('Setup company request:', JSON.stringify(body, null, 2))
    
    // Validate the data
    let data
    try {
      data = companySetupSchema.parse(body)
    } catch (error) {
      console.error('Validation error:', error)
      if (error instanceof z.ZodError) {
        return c.json({ 
          error: 'Validation failed', 
          details: error.errors 
        }, 400)
      }
      throw error
    }
    
    // Check if user already has a company
    const existingCompany = await prisma.companyUser.findFirst({
      where: { userId },
      include: { company: true }
    })
    
    if (existingCompany) {
      console.log('User already has company:', existingCompany.company.name)
      return c.json({ 
        error: 'User already belongs to a company',
        companyName: existingCompany.company.name 
      }, 400)
    }
    
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          code: `COMP${Date.now().toString().slice(-6)}`,
          name: data.company.name,
          legalName: data.company.legalName,
          gstNumber: data.company.gstNumber,
          panNumber: data.company.panNumber,
          tanNumber: data.company.tanNumber,
          cinNumber: data.company.cinNumber,
          addressLine1: data.company.addressLine1,
          addressLine2: data.company.addressLine2,
          city: data.company.city,
          state: data.company.state,
          pincode: data.company.pincode,
          email: data.company.email,
          phone: data.company.phone,
          website: data.company.website,
          fyStartMonth: data.company.fyStartMonth,
          currentFY: data.company.currentFY,
          logo: data.company.logo,
          letterhead: data.company.letterhead
        }
      })
      
      // Link user to company as admin
      await tx.companyUser.create({
        data: {
          companyId: company.id,
          userId,
          role: 'ADMIN',
          isDefault: true
        }
      })
      
      // Create factories
      const factories = await Promise.all(
        data.factories.map((factory, index) =>
          tx.factory.create({
            data: {
              companyId: company.id,
              code: `PLANT${String(index + 1).padStart(3, '0')}`,
              name: factory.name,
              type: factory.type.toUpperCase() as any, // Convert to uppercase for Prisma enum
              addressLine1: factory.addressLine1,
              addressLine2: factory.addressLine2,
              city: factory.city,
              state: factory.state,
              pincode: factory.pincode,
              crushingCapacity: factory.crushingCapacity,
              powerCapacity: factory.powerCapacity,
              ethanolCapacity: factory.ethanolCapacity,
              feedCapacity: factory.feedCapacity,
              gstNumber: factory.gstNumber,
              factoryLicense: factory.factoryLicense,
              pollutionLicense: factory.pollutionLicense
            }
          })
        )
      )
      
      // Create master data based on template
      // This would be expanded based on the selected template
      if (data.masterDataTemplate) {
        // Create divisions based on factory types
        const divisionTypes = [...new Set(data.factories.map(f => f.type))]
        
        for (const type of divisionTypes) {
          const divisionType = type === 'integrated' ? 'SUGAR' : type.toUpperCase()
          await tx.division.create({
            data: {
              companyId: company.id,
              code: divisionType.slice(0, 3),
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} Division`,
              type: divisionType as any,
              description: `${type} operations division`
            }
          })
        }
        
        // Create default UOMs
        const defaultUOMs = [
          { code: 'KG', name: 'Kilogram', category: 'WEIGHT' },
          { code: 'MT', name: 'Metric Ton', category: 'WEIGHT' },
          { code: 'L', name: 'Liter', category: 'VOLUME' },
          { code: 'KL', name: 'Kiloliter', category: 'VOLUME' },
          { code: 'NOS', name: 'Numbers', category: 'COUNT' },
          { code: 'M', name: 'Meter', category: 'LENGTH' },
          { code: 'SQM', name: 'Square Meter', category: 'AREA' }
        ]
        
        await Promise.all(
          defaultUOMs.map(uom =>
            tx.uOM.create({
              data: {
                companyId: company.id,
                ...uom
              }
            })
          )
        )
        
        // Create default tax rates
        const defaultTaxRates = [
          { code: 'GST5', name: 'GST 5%', rate: 5, type: 'GST' },
          { code: 'GST12', name: 'GST 12%', rate: 12, type: 'GST' },
          { code: 'GST18', name: 'GST 18%', rate: 18, type: 'GST' },
          { code: 'GST28', name: 'GST 28%', rate: 28, type: 'GST' },
          { code: 'IGST5', name: 'IGST 5%', rate: 5, type: 'IGST' },
          { code: 'IGST12', name: 'IGST 12%', rate: 12, type: 'IGST' },
          { code: 'IGST18', name: 'IGST 18%', rate: 18, type: 'IGST' },
          { code: 'IGST28', name: 'IGST 28%', rate: 28, type: 'IGST' }
        ]
        
        await Promise.all(
          defaultTaxRates.map(tax =>
            tx.taxRate.create({
              data: {
                companyId: company.id,
                ...tax
              }
            })
          )
        )
      }
      
      return { company, factories }
    })
    
    return c.json({
      message: 'Company setup completed successfully',
      company: result.company,
      factories: result.factories
    })
  } catch (error) {
    console.error('Company setup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ 
      error: 'Failed to complete company setup',
      details: errorMessage 
    }, 500)
  }
})

// Upload company logo
app.post('/upload-logo', async (c) => {
  try {
    const userId = c.get('userId')
    const { companyId, logo } = await c.req.json()
    
    // Verify user has access to company
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: 'ADMIN'
      }
    })
    
    if (!companyUser) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Update company logo
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { logo }
    })
    
    return c.json({
      message: 'Logo uploaded successfully',
      company
    })
  } catch (error) {
    console.error('Logo upload error:', error)
    return c.json({ error: 'Failed to upload logo' }, 500)
  }
})

// Upload company letterhead
app.post('/upload-letterhead', async (c) => {
  try {
    const userId = c.get('userId')
    const { companyId, letterhead } = await c.req.json()
    
    // Verify user has access to company
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: 'ADMIN'
      }
    })
    
    if (!companyUser) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Update company letterhead
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { letterhead }
    })
    
    return c.json({
      message: 'Letterhead uploaded successfully',
      company
    })
  } catch (error) {
    console.error('Letterhead upload error:', error)
    return c.json({ error: 'Failed to upload letterhead' }, 500)
  }
})

export default app