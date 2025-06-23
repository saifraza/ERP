import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default user
  const hashedPassword = await bcrypt.hash('1234', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'saif@erp.com' },
    update: {},
    create: {
      email: 'saif@erp.com',
      name: 'saif',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ Created user:', user.name)

  // Create default company
  const company = await prisma.company.upsert({
    where: { code: 'MSPIL' },
    update: {},
    create: {
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

  console.log('✅ Created company:', company.name)

  // Create factory
  const factory = await prisma.factory.upsert({
    where: { code: 'FAC001' },
    update: {},
    create: {
      code: 'FAC001',
      name: 'Pune Sugar & Ethanol Plant',
      companyId: company.id,
      type: 'INTEGRATED',
      crushingCapacity: 5000,  // TPD
      powerCapacity: 30,       // MW
      ethanolCapacity: 60,     // KLPD
      feedCapacity: 100,       // TPD
      addressLine1: 'Plot No. 123, MIDC',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      gstNumber: '27AAACM1234A1Z5',
      factoryLicense: 'FL/2024/001',
      pollutionLicense: 'PCB/2024/001'
    }
  })

  console.log('✅ Created factory:', factory.name)

  // Link user to company
  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: user.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: 'ADMIN',
      permissions: JSON.stringify(['ALL']),
      isDefault: true
    }
  })

  console.log('✅ Linked user to company')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })