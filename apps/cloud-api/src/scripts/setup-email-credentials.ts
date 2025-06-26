#!/usr/bin/env bun

import { prisma } from '../lib/prisma.js'

async function setupEmailCredentials() {
  try {
    // Get the refresh token from environment
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    if (!refreshToken) {
      console.error('❌ GOOGLE_REFRESH_TOKEN not found in environment variables')
      process.exit(1)
    }

    // Find all users with linkedGmailEmail but no EmailCredential
    const usersWithoutCredentials = await prisma.user.findMany({
      where: {
        linkedGmailEmail: {
          not: '',
          not: null
        },
        emailCredentials: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        linkedGmailEmail: true,
        companies: {
          select: {
            companyId: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (usersWithoutCredentials.length === 0) {
      console.log('✅ All users with linkedGmailEmail already have EmailCredentials')
      return
    }

    console.log(`Found ${usersWithoutCredentials.length} users without email credentials:`)

    for (const user of usersWithoutCredentials) {
      console.log(`\nProcessing user: ${user.name} (${user.email})`)
      console.log(`  Linked Gmail: ${user.linkedGmailEmail}`)
      
      // Get the first company for this user (required field in EmailCredential)
      const firstCompany = user.companies[0]
      if (!firstCompany) {
        console.log(`  ⚠️  User has no associated companies, skipping...`)
        continue
      }

      try {
        // Create EmailCredential record
        const credential = await prisma.emailCredential.create({
          data: {
            companyId: firstCompany.companyId,
            userId: user.id,
            emailAddress: user.linkedGmailEmail!,
            provider: 'google',
            googleRefreshToken: refreshToken,
            isActive: true
          }
        })

        console.log(`  ✅ Created EmailCredential for ${user.linkedGmailEmail}`)
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('emailAddress')) {
          console.log(`  ⚠️  Email ${user.linkedGmailEmail} already exists in EmailCredentials`)
          
          // Update the existing record to link it to this user
          const existing = await prisma.emailCredential.findUnique({
            where: { emailAddress: user.linkedGmailEmail! }
          })
          
          if (existing && !existing.userId) {
            await prisma.emailCredential.update({
              where: { id: existing.id },
              data: { userId: user.id }
            })
            console.log(`  ✅ Updated existing EmailCredential to link with user`)
          }
        } else {
          console.error(`  ❌ Error creating credential:`, error.message)
        }
      }
    }

    console.log('\n✅ Email credentials setup complete!')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the setup
setupEmailCredentials()