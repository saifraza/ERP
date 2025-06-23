import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  })
  console.log('✅ Created admin user:', adminUser.email)

  // Create demo users
  const managerPassword = await bcrypt.hash('manager123', 10)
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@erp.com' },
    update: {},
    create: {
      email: 'manager@erp.com',
      username: 'manager',
      password: managerPassword,
      name: 'Manager User',
      role: 'MANAGER'
    }
  })
  console.log('✅ Created manager user:', managerUser.email)

  const operatorPassword = await bcrypt.hash('operator123', 10)
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@erp.com' },
    update: {},
    create: {
      email: 'operator@erp.com',
      username: 'operator',
      password: operatorPassword,
      name: 'Operator User',
      role: 'OPERATOR'
    }
  })
  console.log('✅ Created operator user:', operatorUser.email)

  // Create a demo company if none exists
  const companyCount = await prisma.company.count()
  if (companyCount === 0) {
    const demoCompany = await prisma.company.create({
      data: {
        code: 'DEMO001',
        name: 'Demo Sugar Mills Pvt Ltd',
        legalName: 'Demo Sugar Mills Private Limited',
        gstNumber: '27AABCD1234E1ZH',
        panNumber: 'AABCD1234E',
        addressLine1: 'Demo Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        email: 'info@demosugar.com',
        phone: '9876543210',
        fyStartMonth: 4,
        currentFY: '2024-25',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
        users: {
          create: [
            {
              userId: adminUser.id,
              role: 'OWNER',
              isDefault: true
            },
            {
              userId: managerUser.id,
              role: 'MANAGER'
            },
            {
              userId: operatorUser.id,
              role: 'USER'
            }
          ]
        },
        factories: {
          create: [
            {
              code: 'DEMO001-F001',
              name: 'Main Sugar Plant',
              type: 'sugar',
              addressLine1: 'Demo Industrial Area',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001',
              crushingCapacity: 5000,
              powerCapacity: 25,
              createdBy: adminUser.id,
              updatedBy: adminUser.id
            }
          ]
        }
      }
    })
    console.log('✅ Created demo company:', demoCompany.name)

    // Create basic master data
    await prisma.taxRate.createMany({
      data: [
        { companyId: demoCompany.id, name: 'GST 5%', rate: 5, type: 'GST', createdBy: adminUser.id },
        { companyId: demoCompany.id, name: 'GST 12%', rate: 12, type: 'GST', createdBy: adminUser.id },
        { companyId: demoCompany.id, name: 'GST 18%', rate: 18, type: 'GST', createdBy: adminUser.id },
        { companyId: demoCompany.id, name: 'GST 28%', rate: 28, type: 'GST', createdBy: adminUser.id }
      ]
    })
    console.log('✅ Created tax rates')

    await prisma.uOM.createMany({
      data: [
        { companyId: demoCompany.id, code: 'MT', name: 'Metric Ton', createdBy: adminUser.id },
        { companyId: demoCompany.id, code: 'KG', name: 'Kilogram', createdBy: adminUser.id },
        { companyId: demoCompany.id, code: 'L', name: 'Liter', createdBy: adminUser.id },
        { companyId: demoCompany.id, code: 'NOS', name: 'Numbers', createdBy: adminUser.id }
      ]
    })
    console.log('✅ Created units of measure')
  }

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