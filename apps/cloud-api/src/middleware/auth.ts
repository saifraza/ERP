import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // For now, just set the userId and userRole
    // Full user data will be loaded when needed
    c.set('userId', decoded.userId)
    c.set('userRole', decoded.role)
    
    // Only load full user data for specific routes that need it
    const path = c.req.path
    if (path.includes('/vendors') || path.includes('/purchase-requisitions') || path.includes('/rfqs')) {
      // Fetch user with company data for these routes
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyUsers: {
            select: {
              companyId: true,
              role: true
            }
          }
        }
      })
      
      if (!user) {
        return c.json({ error: 'User not found' }, 401)
      }
      
      // Get the first company (assuming user belongs to one company)
      const companyUser = user.companyUsers[0]
      
      // Set user data in context
      c.set('user', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: companyUser?.companyId || null
      })
    }
    
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}