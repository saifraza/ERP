import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Set user ID in context
    c.set('userId', decoded.userId)
    c.set('userRole', decoded.role)
    
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}