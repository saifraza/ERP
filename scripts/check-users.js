// Script to check existing users in the database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('Existing users in database:')
    console.log(JSON.stringify(users, null, 2))
    
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        code: true,
        name: true
      }
    })
    
    console.log('\nExisting companies:')
    console.log(JSON.stringify(companies, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()