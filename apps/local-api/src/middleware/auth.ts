import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
      c.set('userId', decoded.userId)
      await next()
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401)
    }
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 401)
  }
}