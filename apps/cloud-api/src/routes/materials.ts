import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Material creation schema
const materialSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['raw_material', 'consumable', 'spare_part', 'chemical', 'packing', 'other']),
  subCategory: z.string().optional(),
  unit: z.string().min(1),
  hsnCode: z.string().optional(),
  specifications: z.string().optional(),
  reorderLevel: z.number().optional(),
  reorderQuantity: z.number().optional(),
  minOrderQuantity: z.number().optional(),
  leadTimeDays: z.number().default(0)
})

// Generate material code
async function generateMaterialCode(companyId: string, category: string): Promise<string> {
  // Category prefixes
  const categoryPrefix = {
    'raw_material': 'RM',
    'consumable': 'CON',
    'spare_part': 'SP',
    'chemical': 'CHM',
    'packing': 'PKG',
    'other': 'OTH'
  }[category] || 'MAT'
  
  // Get count of materials in this category
  const materialCount = await prisma.material.count({
    where: {
      companyId,
      category
    }
  })
  
  // Generate code with sequential number
  const paddedNumber = String(materialCount + 1).padStart(5, '0')
  return `${categoryPrefix}-${paddedNumber}`
}

// Get all materials
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { category, isActive, search } = c.req.query()
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, materials: [] })
    }
    
    const where: any = {
      companyId: companyId
    }
    
    if (category) where.category = category
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const materials = await prisma.material.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    return c.json({ success: true, materials })
  } catch (error: any) {
    console.error('Error fetching materials:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single material
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const materialId = c.req.param('id')
  
  try {
    const material = await prisma.material.findFirst({
      where: {
        id: materialId
      }
    })
    
    if (!material) {
      return c.json({ success: false, error: 'Material not found' }, 404)
    }
    
    return c.json({ success: true, material })
  } catch (error: any) {
    console.error('Error fetching material:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Search materials (for autocomplete)
app.get('/search/autocomplete', async (c) => {
  const userId = c.get('userId')
  const { q } = c.req.query()
  
  if (!q || q.length < 2) {
    return c.json({ success: true, materials: [] })
  }
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, materials: [] })
    }
    
    const materials = await prisma.material.findMany({
      where: {
        companyId: companyId,
        isActive: true,
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        unit: true,
        specifications: true
      },
      take: 10,
      orderBy: { name: 'asc' }
    })
    
    return c.json({ success: true, materials })
  } catch (error: any) {
    console.error('Error searching materials:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new material
app.post('/', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ 
        success: false, 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
    const body = await c.req.json()
    const validated = materialSchema.parse(body)
    
    // Generate material code
    const code = await generateMaterialCode(companyId, validated.category)
    
    const material = await prisma.material.create({
      data: {
        ...validated,
        code,
        companyId
      }
    })
    
    return c.json({ success: true, material })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error creating material:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update material
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const materialId = c.req.param('id')
  
  try {
    const body = await c.req.json()
    
    // Check if material exists
    const existing = await prisma.material.findFirst({
      where: {
        id: materialId
      }
    })
    
    if (!existing) {
      return c.json({ success: false, error: 'Material not found' }, 404)
    }
    
    const material = await prisma.material.update({
      where: { id: materialId },
      data: body
    })
    
    return c.json({ success: true, material })
  } catch (error: any) {
    console.error('Error updating material:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Toggle material active status
app.patch('/:id/toggle-status', async (c) => {
  const userId = c.get('userId')
  const materialId = c.req.param('id')
  
  try {
    const existing = await prisma.material.findFirst({
      where: { id: materialId }
    })
    
    if (!existing) {
      return c.json({ success: false, error: 'Material not found' }, 404)
    }
    
    const material = await prisma.material.update({
      where: { id: materialId },
      data: { isActive: !existing.isActive }
    })
    
    return c.json({ success: true, material })
  } catch (error: any) {
    console.error('Error toggling material status:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app