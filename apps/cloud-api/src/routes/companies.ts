import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Get all companies for the current user
app.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Get companies where user has access AND company is active
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId },
      include: {
        company: {
          include: {
            factories: true
          }
        }
      }
    })
    
    // Filter out inactive companies
    const companies = companyUsers
      .map(cu => cu.company)
      .filter(company => company.isActive)
    
    return c.json({ companies })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return c.json({ error: 'Failed to fetch companies' }, 500)
  }
})

// Get a specific company
app.get('/:id', authMiddleware, async (c) => {
  try {
    const companyId = c.req.param('id')
    const userId = c.get('userId')
    
    // Check if user has access to this company
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId
      },
      include: {
        company: {
          include: {
            factories: true
          }
        }
      }
    })
    
    if (!companyUser) {
      return c.json({ error: 'Company not found or access denied' }, 404)
    }
    
    return c.json({ company: companyUser.company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return c.json({ error: 'Failed to fetch company' }, 500)
  }
})

// Update company schema
const updateCompanySchema = z.object({
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
})

// Update company details
app.put('/:id', authMiddleware, async (c) => {
  try {
    const companyId = c.req.param('id')
    const userId = c.get('userId')
    const body = await c.req.json()
    const data = updateCompanySchema.parse(body)
    
    // Check if user has access and proper role
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: { in: ['ADMIN', 'OWNER'] }
      }
    })
    
    if (!companyUser) {
      // Check what role the user actually has
      const userRole = await prisma.companyUser.findFirst({
        where: { userId, companyId },
        select: { role: true }
      })
      
      console.log(`User ${userId} has role ${userRole?.role} for company ${companyId}`)
      return c.json({ 
        error: `Access denied. Admin role required. Your role: ${userRole?.role || 'none'}` 
      }, 403)
    }
    
    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        factories: true
      }
    })
    
    return c.json({ company: updatedCompany })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    console.error('Error updating company:', error)
    return c.json({ error: 'Failed to update company' }, 500)
  }
})

// Delete a company (soft delete)
app.delete('/:id', authMiddleware, async (c) => {
  try {
    const companyId = c.req.param('id')
    const userId = c.get('userId')
    const hardDelete = c.req.query('hard') === 'true'
    
    // Only OWNER or ADMIN can delete company
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })
    
    if (!companyUser) {
      return c.json({ error: 'Only company owner or admin can delete company' }, 403)
    }
    
    if (hardDelete && process.env.NODE_ENV !== 'production') {
      // Hard delete for testing - remove all related data
      await prisma.$transaction(async (tx) => {
        // Delete all related data first
        await tx.companyUser.deleteMany({ where: { companyId } })
        await tx.factory.deleteMany({ where: { companyId } })
        await tx.division.deleteMany({ where: { companyId } })
        await tx.vendor.deleteMany({ where: { companyId } })
        await tx.material.deleteMany({ where: { companyId } })
        await tx.customer.deleteMany({ where: { companyId } })
        await tx.taxRate.deleteMany({ where: { companyId } })
        await tx.hSNCode.deleteMany({ where: { companyId } })
        await tx.uOM.deleteMany({ where: { companyId } })
        await tx.account.deleteMany({ where: { companyId } })
        await tx.emailCredential.deleteMany({ where: { companyId } })
        
        // Finally delete the company
        await tx.company.delete({ where: { id: companyId } })
      })
      
      return c.json({ message: 'Company permanently deleted' })
    } else {
      // Soft delete by marking as inactive
      await prisma.company.update({
        where: { id: companyId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
      
      return c.json({ message: 'Company deleted successfully' })
    }
  } catch (error) {
    console.error('Error deleting company:', error)
    return c.json({ error: 'Failed to delete company' }, 500)
  }
})

// Get factories for user's current company
app.get('/my/factories', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, factories: [] })
    }
    
    const factories = await prisma.factory.findMany({
      where: {
        companyId: companyId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        city: true,
        state: true,
        crushingCapacity: true,
        powerCapacity: true,
        ethanolCapacity: true,
        feedCapacity: true
      },
      orderBy: { name: 'asc' }
    })
    
    return c.json({ success: true, factories })
  } catch (error: any) {
    console.error('Error fetching factories:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app