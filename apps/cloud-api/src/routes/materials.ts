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
  industryCategory: z.string().optional(),
  division: z.enum(['sugar', 'ethanol', 'power', 'feed', 'common']),
  unit: z.string().min(1),
  hsnCode: z.string().optional(),
  technicalGrade: z.string().optional(),
  complianceStandard: z.string().optional(),
  specifications: z.string().optional(),
  criticalItem: z.boolean().default(false),
  shelfLife: z.number().optional(),
  storageConditions: z.string().optional(),
  hazardCategory: z.string().optional(),
  reorderLevel: z.number().optional(),
  reorderQuantity: z.number().optional(),
  minOrderQuantity: z.number().optional(),
  maxOrderQuantity: z.number().optional(),
  leadTimeDays: z.number().default(0),
  preferredVendors: z.array(z.string()).optional(),
  qualityParameters: z.record(z.any()).optional()
})

// Generate material code
async function generateMaterialCode(companyId: string, category: string, division: string): Promise<string> {
  // Division prefixes
  const divisionPrefix = {
    'sugar': 'S',
    'ethanol': 'E',
    'power': 'P',
    'feed': 'F',
    'common': 'C'
  }[division] || 'X'
  
  // Category prefixes
  const categoryPrefix = {
    'raw_material': 'RM',
    'consumable': 'CON',
    'spare_part': 'SP',
    'chemical': 'CHM',
    'packing': 'PKG',
    'other': 'OTH'
  }[category] || 'MAT'
  
  // Get count of materials in this category and division
  const materialCount = await prisma.material.count({
    where: {
      companyId,
      category,
      division
    }
  })
  
  // Generate code with division, category and sequential number
  const paddedNumber = String(materialCount + 1).padStart(4, '0')
  return `${divisionPrefix}${categoryPrefix}${paddedNumber}`
}

// Get all materials
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { category, division, industryCategory, criticalItem, isActive, search } = c.req.query()
  
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
    if (division) where.division = division
    if (industryCategory) where.industryCategory = industryCategory
    if (criticalItem !== undefined) where.criticalItem = criticalItem === 'true'
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { hsnCode: { contains: search, mode: 'insensitive' } }
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
    const code = await generateMaterialCode(companyId, validated.category, validated.division)
    
    // Process data for storage
    const data: any = {
      ...validated,
      code,
      companyId
    }
    
    // Convert arrays to JSON strings for storage
    if (validated.preferredVendors) {
      data.preferredVendors = JSON.stringify(validated.preferredVendors)
    }
    if (validated.qualityParameters) {
      data.qualityParameters = JSON.stringify(validated.qualityParameters)
    }
    
    const material = await prisma.material.create({
      data
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

// Get industry categories for a division and category
app.get('/industry-categories', async (c) => {
  const { division, category } = c.req.query()
  
  if (!division || !category) {
    return c.json({ success: false, error: 'Division and category are required' }, 400)
  }
  
  // This would typically come from the shared constants
  // For now, returning a hardcoded response
  const industryCategories = {
    sugar: {
      chemical: [
        { value: 'juice_clarification', label: 'Juice Clarification Chemicals' },
        { value: 'color_precipitant', label: 'Color Precipitants' },
        { value: 'flocculant', label: 'Flocculants' },
        { value: 'viscosity_reducer', label: 'Viscosity Reducers' },
        { value: 'biocide', label: 'Biocides & Mill Sanitizers' },
        { value: 'enzyme', label: 'Enzymes (Dextranase, Amylase)' },
        { value: 'antiscalant', label: 'Antiscalants' },
        { value: 'ph_modifier', label: 'pH Modifiers (Lime, Sulphur)' }
      ]
    },
    ethanol: {
      chemical: [
        { value: 'yeast', label: 'Yeast Strains' },
        { value: 'nutrient', label: 'Fermentation Nutrients' },
        { value: 'antifoam', label: 'Antifoam Agents' },
        { value: 'denaturant', label: 'Denaturants' },
        { value: 'molecular_sieve', label: 'Molecular Sieves' },
        { value: 'cleaning_cip', label: 'CIP Cleaning Chemicals' },
        { value: 'ph_control', label: 'pH Control Chemicals' }
      ]
    },
    power: {
      chemical: [
        { value: 'water_treatment', label: 'Boiler Water Treatment Chemicals' },
        { value: 'dm_resin', label: 'DM Plant Resins' },
        { value: 'cooling_chemical', label: 'Cooling Tower Chemicals' },
        { value: 'descalant', label: 'Descaling Chemicals' },
        { value: 'corrosion_inhibitor', label: 'Corrosion Inhibitors' }
      ]
    },
    feed: {
      chemical: [
        { value: 'vitamin_premix', label: 'Vitamin Premixes' },
        { value: 'mineral_premix', label: 'Mineral Premixes' },
        { value: 'probiotic', label: 'Probiotics' },
        { value: 'preservative', label: 'Feed Preservatives' },
        { value: 'mycotoxin_binder', label: 'Mycotoxin Binders' },
        { value: 'acidifier', label: 'Feed Acidifiers' }
      ]
    }
  }
  
  const divisionCategories = industryCategories[division as keyof typeof industryCategories]
  const categories = divisionCategories?.[category as keyof typeof divisionCategories] || []
  
  return c.json({ success: true, categories })
})

export default app