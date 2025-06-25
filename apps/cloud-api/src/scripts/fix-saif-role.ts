import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSaifRole() {
  try {
    console.log('Fixing saif user role...')
    
    // Find saif user
    const saifUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'saif' },
          { email: 'saif@erp.com' }
        ]
      }
    })
    
    if (!saifUser) {
      console.log('Saif user not found')
      return
    }
    
    console.log('Found saif user:', saifUser.id)
    
    // Get all company users for saif
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId: saifUser.id }
    })
    
    console.log(`Found ${companyUsers.length} company associations`)
    
    // Update all to ADMIN role
    for (const cu of companyUsers) {
      await prisma.companyUser.update({
        where: { id: cu.id },
        data: {
          role: 'ADMIN',
          permissions: JSON.stringify(['ALL'])
        }
      })
      console.log(`Updated role for company ${cu.companyId} to ADMIN`)
    }
    
    console.log('✅ Role update complete')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSaifRole()