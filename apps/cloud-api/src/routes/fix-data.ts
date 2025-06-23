import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Fix database to ensure proper user and company setup
app.post('/ensure-setup', async (c) => {
  try {
    console.log('🔧 Ensuring database setup...')
    
    // 1. Check for existing user 'saif@erp.com'
    let user = await prisma.user.findUnique({
      where: { email: 'saif@erp.com' }
    })
    
    if (!user) {
      // Create saif user if doesn't exist
      const hashedPassword = await bcrypt.hash('1234', 10)
      user = await prisma.user.create({
        data: {
          email: 'saif@erp.com',
          name: 'Saif',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      })
      console.log('Created user: saif@erp.com')
    } else {
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('1234', 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      console.log('Updated password for: saif@erp.com')
    }
    
    // 2. Check for existing company
    let company = await prisma.company.findFirst()
    
    if (!company) {
      // Create default company
      company = await prisma.company.create({
        data: {
          code: 'MSPIL',
          name: 'Modern Sugar & Power Industries Ltd',
          legalName: 'Modern Sugar & Power Industries Limited',
          gstNumber: '27AAACM1234A1Z5',
          panNumber: 'AAACM1234A',
          addressLine1: 'Industrial Area, Phase II',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          phone: '+91 20 12345678',
          email: 'info@mspil.com',
          website: 'www.mspil.com',
          fyStartMonth: 4,
          currentFY: '2024-25'
        }
      })
      console.log('Created company:', company.name)
    }
    
    // 3. Check if user is linked to company
    const companyUser = await prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId: company.id,
          userId: user.id
        }
      }
    })
    
    if (!companyUser) {
      // Link user to company
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'ADMIN',
          permissions: JSON.stringify(['ALL']),
          isDefault: true
        }
      })
      console.log('Linked user to company')
    }
    
    // 4. Create factory if doesn't exist
    const factory = await prisma.factory.findFirst({
      where: { companyId: company.id }
    })
    
    if (!factory) {
      await prisma.factory.create({
        data: {
          code: 'FAC001',
          name: 'Pune Sugar & Ethanol Plant',
          companyId: company.id,
          type: 'INTEGRATED',
          crushingCapacity: 5000,
          powerCapacity: 30,
          ethanolCapacity: 60,
          feedCapacity: 100,
          addressLine1: 'Plot No. 123, MIDC',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          gstNumber: '27AAACM1234A1Z5',
          factoryLicense: 'FL/2024/001',
          pollutionLicense: 'PCB/2024/001'
        }
      })
      console.log('Created factory')
    }
    
    return c.json({
      success: true,
      message: 'Database setup ensured',
      user: { email: user.email, name: user.name },
      company: { code: company.code, name: company.name }
    })
    
  } catch (error) {
    console.error('Setup error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Setup failed'
    }, 500)
  }
})

export default app