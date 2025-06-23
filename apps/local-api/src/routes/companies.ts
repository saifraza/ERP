import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Get all companies for the current user
app.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    const companies = await prisma.company.findMany({
      where: {
        users: {
          some: {
            id: userId
          }
        }
      },
      include: {
        factories: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

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
    
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        users: {
          some: {
            id: userId
          }
        }
      },
      include: {
        factories: true
      }
    })

    if (!company) {
      return c.json({ error: 'Company not found' }, 404)
    }

    return c.json({ company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return c.json({ error: 'Failed to fetch company' }, 500)
  }
})

// Update company details
app.put('/:id', authMiddleware, async (c) => {
  try {
    const companyId = c.req.param('id')
    const userId = c.get('userId')
    const body = await c.req.json()
    
    // Check if user has access to this company
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
        users: {
          some: {
            id: userId
          }
        }
      }
    })

    if (!existingCompany) {
      return c.json({ error: 'Company not found or access denied' }, 404)
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: body.name,
        legalName: body.legalName,
        gstNumber: body.gstNumber,
        panNumber: body.panNumber,
        tanNumber: body.tanNumber,
        cinNumber: body.cinNumber,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        email: body.email,
        phone: body.phone,
        website: body.website,
        fyStartMonth: body.fyStartMonth,
        currentFY: body.currentFY,
        updatedAt: new Date()
      },
      include: {
        factories: true
      }
    })

    return c.json({ company: updatedCompany })
  } catch (error) {
    console.error('Error updating company:', error)
    return c.json({ error: 'Failed to update company' }, 500)
  }
})

// Delete a company (soft delete)
app.delete('/:id', authMiddleware, async (c) => {
  try {
    const companyId = c.req.param('id')
    const userId = c.get('userId')
    
    // Check if user has access and is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (user?.role !== 'ADMIN') {
      return c.json({ error: 'Only admins can delete companies' }, 403)
    }

    const existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
        users: {
          some: {
            id: userId
          }
        }
      }
    })

    if (!existingCompany) {
      return c.json({ error: 'Company not found or access denied' }, 404)
    }

    // Soft delete by marking as inactive
    await prisma.company.update({
      where: { id: companyId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return c.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return c.json({ error: 'Failed to delete company' }, 500)
  }
})

export default app