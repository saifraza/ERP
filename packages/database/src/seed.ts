import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@factory.com' },
    update: {},
    create: {
      email: 'admin@factory.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      divisions: ['sugar', 'power', 'ethanol', 'feed'],
    },
  })
  console.log('Created admin user:', adminUser.email)

  // Create sample farmers
  const farmers = await Promise.all([
    prisma.farmer.upsert({
      where: { code: 'F2341' },
      update: {},
      create: {
        code: 'F2341',
        name: 'Rajesh Kumar',
        village: 'Chandrapur',
        phoneNumber: '+91 98765 43210',
        bankAccount: 'XXXX1234',
        landArea: 25.5,
        contractedArea: 20,
        status: 'ACTIVE',
      },
    }),
    prisma.farmer.upsert({
      where: { code: 'F2342' },
      update: {},
      create: {
        code: 'F2342',
        name: 'Suresh Patil',
        village: 'Rampur',
        phoneNumber: '+91 98765 43211',
        bankAccount: 'XXXX5678',
        landArea: 18.0,
        contractedArea: 15,
        status: 'ACTIVE',
      },
    }),
  ])
  console.log(`Created ${farmers.length} farmers`)

  // Create sample equipment
  const equipment = await Promise.all([
    prisma.equipment.upsert({
      where: { code: 'MILL-01' },
      update: {},
      create: {
        code: 'MILL-01',
        name: 'Sugar Mill 1',
        division: 'sugar',
        type: 'Mill',
        status: 'OPERATIONAL',
      },
    }),
    prisma.equipment.upsert({
      where: { code: 'BOILER-01' },
      update: {},
      create: {
        code: 'BOILER-01',
        name: 'Main Boiler',
        division: 'power',
        type: 'Boiler',
        status: 'OPERATIONAL',
      },
    }),
    prisma.equipment.upsert({
      where: { code: 'FERM-01' },
      update: {},
      create: {
        code: 'FERM-01',
        name: 'Fermentation Tank 1',
        division: 'ethanol',
        type: 'Tank',
        status: 'OPERATIONAL',
      },
    }),
  ])
  console.log(`Created ${equipment.length} equipment records`)

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })