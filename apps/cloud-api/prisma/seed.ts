import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const managerPassword = await bcrypt.hash('manager123', 10)
  const operatorPassword = await bcrypt.hash('operator123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@erp.com' },
    update: {},
    create: {
      email: 'manager@erp.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER',
      isActive: true
    }
  })

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@erp.com' },
    update: {},
    create: {
      email: 'operator@erp.com',
      name: 'Operator User',
      password: operatorPassword,
      role: 'OPERATOR',
      isActive: true
    }
  })

  console.log('✅ Created users:', adminUser.name, managerUser.name, operatorUser.name)

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

  // Link users to company
  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: adminUser.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      companyId: company.id,
      role: 'ADMIN',
      permissions: JSON.stringify(['ALL']),
      isDefault: true
    }
  })

  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: managerUser.id
      }
    },
    update: {},
    create: {
      userId: managerUser.id,
      companyId: company.id,
      role: 'MANAGER',
      permissions: JSON.stringify(['VIEW', 'EDIT']),
      isDefault: true
    }
  })

  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: operatorUser.id
      }
    },
    update: {},
    create: {
      userId: operatorUser.id,
      companyId: company.id,
      role: 'OPERATOR',
      permissions: JSON.stringify(['VIEW']),
      isDefault: true
    }
  })

  console.log('✅ Linked users to company')

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