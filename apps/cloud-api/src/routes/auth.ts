import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Login schema - accepts username or email
const loginSchema = z.object({
  email: z.string().min(1), // Can be username or email
  password: z.string().min(4) // Allow shorter passwords like '1234'
})

// Register schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  linkedEmail: z.string().email(), // Mandatory work email for sending/receiving emails
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']).optional()
})

// Login endpoint
app.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const data = loginSchema.parse(body)
    
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { name: data.email } // Allow login with username
        ]
      }
    })
    
    if (!user || !user.isActive) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password)
    if (!validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    
    return c.json({
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Register endpoint
app.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const data = registerSchema.parse(body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        linkedEmail: data.linkedEmail,
        role: data.role || 'VIEWER'
      }
    })
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    
    return c.json({
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400)
    }
    console.error('Register error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Get current user profile
app.get('/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        linkedGmailEmail: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    })
    
    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401)
    }
    
    return c.json({ user })
  } catch (error) {
    console.error('Get user profile error:', error)
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// Link Gmail account to user
app.post('/link-email', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { email } = await c.req.json()
    
    // Allow empty string to clear email
    if (email === '') {
      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: { linkedGmailEmail: null },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          linkedGmailEmail: true
        }
      })
      
      return c.json({ 
        message: 'Email unlinked successfully',
        user: updatedUser 
      })
    }
    
    if (!email || !email.includes('@')) {
      return c.json({ error: 'Invalid email address' }, 400)
    }
    
    // Check if email is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        linkedGmailEmail: email,
        id: { not: decoded.userId }
      }
    })
    
    if (existingUser) {
      return c.json({ error: 'This email is already linked to another user' }, 400)
    }
    
    // Update user with linked email
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { linkedGmailEmail: email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        linkedGmailEmail: true
      }
    })
    
    return c.json({ 
      message: 'Email linked successfully',
      user: updatedUser 
    })
  } catch (error) {
    console.error('Link email error:', error)
    return c.json({ error: 'Failed to link email' }, 500)
  }
})

// Verify token endpoint
app.get('/verify', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401)
    }
    
    const { password: _, ...userWithoutPassword } = user
    
    return c.json({
      user: userWithoutPassword,
      valid: true
    })
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default app