import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// Validation schemas
const vendorSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  type: z.enum(['supplier', 'contractor', 'service_provider']),
  category: z.array(z.string()),
  email: z.string().email(),
  phone: z.string().min(10),
  alternatePhone: z.string().optional(),
  website: z.string().url().optional(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  country: z.string().default('India'),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  paymentTerms: z.number().default(30),
  creditLimit: z.number().default(0),
})

// Get all vendors with filters
app.get('/', async (c) => {
  const { status, category, search, page = '1', limit = '20' } = c.req.query()
  
  // Mock data for now
  const vendors = [
    {
      id: '1',
      code: 'VEN-2025-001',
      name: 'Industrial Supplies Co',
      type: 'supplier',
      category: ['spare_parts', 'consumables'],
      email: 'contact@industrialsupplies.com',
      phone: '9876543210',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'active',
      rating: 4.5,
      totalBusiness: 2500000,
      onTimeDelivery: 95,
      paymentTerms: 30,
      creditLimit: 500000,
    },
    {
      id: '2',
      code: 'VEN-2025-002',
      name: 'Engineering Solutions Ltd',
      type: 'contractor',
      category: ['maintenance', 'installation'],
      email: 'info@engsolutions.com',
      phone: '9876543211',
      city: 'Pune',
      state: 'Maharashtra',
      status: 'active',
      rating: 4.2,
      totalBusiness: 1800000,
      onTimeDelivery: 92,
      paymentTerms: 45,
      creditLimit: 300000,
    }
  ]
  
  // Apply filters
  let filtered = vendors
  if (status) {
    filtered = filtered.filter(v => v.status === status)
  }
  if (category) {
    filtered = filtered.filter(v => v.category.includes(category))
  }
  if (search) {
    filtered = filtered.filter(v => 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.code.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  return c.json({
    vendors: filtered,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / parseInt(limit))
    }
  })
})

// Get vendor by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  // Mock detailed vendor data
  const vendor = {
    id,
    code: 'VEN-2025-001',
    name: 'Industrial Supplies Co',
    legalName: 'Industrial Supplies Company Private Limited',
    type: 'supplier',
    category: ['spare_parts', 'consumables'],
    email: 'contact@industrialsupplies.com',
    phone: '9876543210',
    alternatePhone: '9876543211',
    website: 'https://industrialsupplies.com',
    addressLine1: '123, Industrial Area',
    addressLine2: 'Phase 2',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    gstNumber: '27AABCI1234D1Z5',
    panNumber: 'AABCI1234D',
    bankName: 'State Bank of India',
    bankBranch: 'Industrial Area Branch',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    paymentTerms: 30,
    creditLimit: 500000,
    status: 'active',
    verificationStatus: 'verified',
    rating: 4.5,
    totalOrders: 125,
    totalBusiness: 2500000,
    onTimeDelivery: 95,
    qualityScore: 98,
    establishedDate: '2010-01-15',
    annualTurnover: 50000000,
    contacts: [
      {
        id: '1',
        name: 'Rajesh Kumar',
        designation: 'Sales Manager',
        email: 'rajesh@industrialsupplies.com',
        phone: '9876543212',
        isPrimary: true
      }
    ],
    documents: [
      {
        id: '1',
        type: 'gst_certificate',
        name: 'GST Registration Certificate',
        uploadedAt: '2025-01-01',
        validTo: '2026-01-01',
        isActive: true
      }
    ],
    recentOrders: [
      {
        poNumber: 'PO-2025-045',
        date: '2025-01-15',
        amount: 125000,
        status: 'delivered'
      }
    ]
  }
  
  return c.json(vendor)
})

// Create new vendor
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = vendorSchema.parse(body)
    
    // Generate vendor code
    const vendorCode = `VEN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    
    const newVendor = {
      id: String(Date.now()),
      code: vendorCode,
      ...validated,
      status: 'pending',
      verificationStatus: 'unverified',
      rating: 0,
      totalOrders: 0,
      totalBusiness: 0,
      onTimeDelivery: 100,
      qualityScore: 100,
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    }
    
    return c.json({
      success: true,
      vendor: newVendor,
      message: 'Vendor registered successfully. Pending verification.'
    }, 201)
  } catch (error) {
    return c.json({ error: 'Invalid vendor data' }, 400)
  }
})

// Update vendor
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  return c.json({
    success: true,
    vendor: { id, ...body },
    message: 'Vendor updated successfully'
  })
})

// Verify vendor
app.post('/:id/verify', async (c) => {
  const id = c.req.param('id')
  const { status, remarks } = await c.req.json()
  
  return c.json({
    success: true,
    message: `Vendor ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
    vendor: {
      id,
      verificationStatus: status,
      verifiedBy: 'current-user',
      verifiedAt: new Date().toISOString(),
      remarks
    }
  })
})

// Upload vendor document
app.post('/:id/documents', async (c) => {
  const id = c.req.param('id')
  
  // In real implementation, handle file upload
  return c.json({
    success: true,
    document: {
      id: String(Date.now()),
      vendorId: id,
      type: 'gst_certificate',
      name: 'GST Certificate.pdf',
      fileUrl: '/documents/vendor-1-gst.pdf',
      uploadedAt: new Date().toISOString()
    }
  })
})

// Get vendor performance metrics
app.get('/:id/performance', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    vendorId: id,
    metrics: {
      overall: {
        rating: 4.5,
        totalOrders: 125,
        totalBusiness: 2500000,
        averageOrderValue: 20000
      },
      delivery: {
        onTimeDelivery: 95,
        averageDelay: 0.5, // days
        delayedOrders: 6
      },
      quality: {
        qualityScore: 98,
        rejectionRate: 2,
        returnsCount: 3
      },
      financial: {
        paymentCompliance: 100,
        averagePaymentDays: 28,
        creditUtilization: 65
      },
      trends: {
        monthly: [
          { month: 'Jan', orders: 12, value: 250000 },
          { month: 'Feb', orders: 15, value: 300000 },
          { month: 'Mar', orders: 10, value: 200000 }
        ]
      }
    }
  })
})

// Get vendor communications
app.get('/:id/communications', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    communications: [
      {
        id: '1',
        type: 'email',
        direction: 'outbound',
        subject: 'RFQ for Spare Parts',
        content: 'Please find attached RFQ for various spare parts...',
        createdBy: 'Procurement Team',
        createdAt: '2025-01-20T10:00:00Z'
      },
      {
        id: '2',
        type: 'email',
        direction: 'inbound',
        subject: 'Re: RFQ for Spare Parts',
        content: 'Thank you for your inquiry. Please find our quotation attached...',
        createdBy: 'Vendor',
        createdAt: '2025-01-20T14:30:00Z'
      }
    ]
  })
})

// Bulk vendor actions
app.post('/bulk/invite', async (c) => {
  const { vendorIds, rfqId } = await c.req.json()
  
  return c.json({
    success: true,
    message: `Invited ${vendorIds.length} vendors to RFQ`,
    invited: vendorIds.length,
    failed: 0
  })
})

export default app