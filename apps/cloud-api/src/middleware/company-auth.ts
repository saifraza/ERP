import { Context, Next } from 'hono'
import { prisma } from '../lib/prisma.js'

export const companyAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const userId = c.get('userId')
    
    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    // Fetch user with company data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyAccess: {
          select: {
            companyId: true
          }
        }
      }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }
    
    // Get the first company (assuming user belongs to one company)
    const companyUser = user.companyAccess[0]
    
    if (!companyUser) {
      return c.json({ error: 'User is not associated with any company' }, 403)
    }
    
    // Set user data in context
    c.set('user', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: companyUser.companyId
    })
    
    await next()
  } catch (error) {
    console.error('Company auth middleware error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}