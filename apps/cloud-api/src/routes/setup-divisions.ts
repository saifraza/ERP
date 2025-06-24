import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Create default divisions for a company
app.post('/create-defaults', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true, role: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
    // Check if user is admin
    if (companyUser.role !== 'ADMIN' && companyUser.role !== 'OWNER') {
      return c.json({ 
        error: 'Only admin or owner can create default divisions' 
      }, 403)
    }
    
    // Check if divisions already exist
    const existingDivisions = await prisma.division.count({
      where: { companyId }
    })
    
    if (existingDivisions > 0) {
      return c.json({ 
        error: 'Divisions already exist for this company' 
      }, 400)
    }
    
    // Default divisions for an integrated sugar factory
    const defaultDivisions = [
      { name: 'Sugar', code: 'SUGAR' },
      { name: 'Ethanol', code: 'ETHANOL' },
      { name: 'Power', code: 'POWER' },
      { name: 'Animal Feed', code: 'FEED' },
      { name: 'Common', code: 'COMMON' }
    ]
    
    // Create all divisions
    const divisions = await prisma.$transaction(
      defaultDivisions.map(div => 
        prisma.division.create({
          data: {
            companyId,
            name: div.name,
            code: div.code
          }
        })
      )
    )
    
    return c.json({ 
      message: `Created ${divisions.length} default divisions`,
      divisions 
    })
  } catch (error: any) {
    console.error('Error creating default divisions:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create default factories for a company
app.post('/create-default-factories', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true, role: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
    // Check if user is admin
    if (companyUser.role !== 'ADMIN' && companyUser.role !== 'OWNER') {
      return c.json({ 
        error: 'Only admin or owner can create default factories' 
      }, 403)
    }
    
    // Check if factories already exist
    const existingFactories = await prisma.factory.count({
      where: { companyId }
    })
    
    if (existingFactories > 0) {
      return c.json({ 
        error: 'Factories already exist for this company' 
      }, 400)
    }
    
    // Get company details
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })
    
    if (!company) {
      return c.json({ 
        error: 'Company not found' 
      }, 404)
    }
    
    // Create a default integrated factory
    const factory = await prisma.factory.create({
      data: {
        companyId,
        code: 'MAIN',
        name: `${company.name} - Main Factory`,
        type: 'INTEGRATED',
        addressLine1: company.addressLine1,
        addressLine2: company.addressLine2,
        city: company.city,
        state: company.state,
        pincode: company.pincode,
        gstNumber: company.gstNumber,
        crushingCapacity: 5000, // 5000 TCD
        powerCapacity: 30, // 30 MW
        ethanolCapacity: 100, // 100 KLPD
        feedCapacity: 50, // 50 TPD
        isActive: true
      }
    })
    
    return c.json({ 
      message: 'Created default factory',
      factory 
    })
  } catch (error: any) {
    console.error('Error creating default factory:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app