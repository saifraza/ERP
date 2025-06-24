import { Context, Next } from 'hono'
import { prisma } from '../lib/prisma.js'

export const companyAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const userId = c.get('userId')
    
    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }
    
    // Get the user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
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