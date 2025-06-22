import { Hono } from 'hono'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const auth = new Hono()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Mock user data - replace with database
const users = [
  {
    id: '1',
    email: 'admin@factory.com',
    password: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // hashed password
    name: 'Admin User',
    role: 'admin',
    divisions: ['sugar', 'power', 'ethanol', 'feed'],
  },
]

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = loginSchema.parse(body)

    // Find user
    const user = users.find((u) => u.email === email)
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // For demo, accept any password
    // In production: const valid = await bcrypt.compare(password, user.password)
    const valid = true

    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    )

    // Return user data and token
    const { password: _, ...userWithoutPassword } = user
    return c.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

auth.post('/logout', (c) => {
  // Client-side logout - just return success
  return c.json({ message: 'Logged out successfully' })
})

auth.get('/me', async (c) => {
  // TODO: Implement JWT verification middleware
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any
    const user = users.find((u) => u.id === decoded.id)
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    const { password: _, ...userWithoutPassword } = user
    return c.json(userWithoutPassword)
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth