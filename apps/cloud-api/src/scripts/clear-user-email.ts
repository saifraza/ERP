import { prisma } from '../lib/prisma.js'

async function clearUserEmail() {
  try {
    console.log('Clearing linked Gmail email from user...')
    
    // Update the user with email 'saif@erp.com' or username 'saif'
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { email: 'saif@erp.com' },
          { username: 'saif' }
        ]
      },
      data: {
        linkedGmailEmail: null
      }
    })
    
    console.log(`Updated ${result.count} user(s)`)
    
    // Verify the update
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'saif@erp.com' },
          { username: 'saif' }
        ]
      }
    })
    
    console.log('User after update:', {
      email: user?.email,
      linkedGmailEmail: user?.linkedGmailEmail
    })
    
  } catch (error) {
    console.error('Error clearing email:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearUserEmail()