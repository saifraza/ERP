import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function updateUserRole() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'saif' }
    })
    
    if (!user) {
      console.error('User not found')
      return
    }
    
    console.log('Found user:', user.id, user.email)
    
    // Update all CompanyUser entries for this user to ADMIN role
    const result = await prisma.companyUser.updateMany({
      where: { userId: user.id },
      data: { role: 'ADMIN' }
    })
    
    console.log(`Updated ${result.count} company-user associations to ADMIN role`)
    
    // Verify the update
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId: user.id },
      include: {
        company: {
          select: { name: true }
        }
      }
    })
    
    console.log('\nUser roles after update:')
    companyUsers.forEach(cu => {
      console.log(`- Company: ${cu.company.name}, Role: ${cu.role}`)
    })
    
  } catch (error) {
    console.error('Error updating user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole()