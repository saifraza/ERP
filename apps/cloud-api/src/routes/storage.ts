import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const app = new Hono()

// Ensure all routes are protected
app.use('*', authMiddleware)

// Volume base path
const VOLUME_PATH = process.env.NODE_ENV === 'production' ? '/data' : './data'

// Ensure volume directories exist
const ensureDirectory = (path: string) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

// Storage paths
const storagePaths = {
  uploads: 'uploads',
  documents: 'documents',
  temp: 'temp',
  cache: 'cache',
  reports: 'reports',
  invoices: 'invoices',
  attachments: 'attachments'
}

// Initialize directories
Object.values(storagePaths).forEach(dir => {
  ensureDirectory(join(VOLUME_PATH, dir))
})

// Upload file
app.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body.file as File
    const type = body.type as keyof typeof storagePaths || 'uploads'
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File too large (max 10MB)' }, 400)
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${randomUUID()}.${ext}`
    const filepath = join(VOLUME_PATH, storagePaths[type], filename)
    
    // Save file
    const buffer = await file.arrayBuffer()
    const writeStream = createWriteStream(filepath)
    writeStream.write(Buffer.from(buffer))
    writeStream.end()
    
    // Store metadata in database
    const { prisma } = await import('../lib/prisma.js')
    const userId = c.get('userId')
    
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        filePath: `${storagePaths[type]}/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: userId,
        category: type.toUpperCase(),
        status: 'ACTIVE'
      }
    })
    
    return c.json({
      success: true,
      path: document.filePath,
      id: document.id,
      url: `/api/storage/file?path=${encodeURIComponent(document.filePath)}`
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get file
app.get('/file', async (c) => {
  try {
    const path = c.req.query('path')
    if (!path) {
      return c.json({ error: 'Path required' }, 400)
    }
    
    const filepath = join(VOLUME_PATH, path)
    
    // Security: Prevent directory traversal
    if (path.includes('..') || !filepath.startsWith(VOLUME_PATH)) {
      return c.json({ error: 'Invalid path' }, 400)
    }
    
    if (!existsSync(filepath)) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    // Stream file
    const stream = createReadStream(filepath)
    
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
    
  } catch (error) {
    console.error('File read error:', error)
    return c.json({ error: 'Failed to read file' }, 500)
  }
})

// Delete file
app.delete('/delete', async (c) => {
  try {
    const { path } = await c.req.json()
    if (!path) {
      return c.json({ error: 'Path required' }, 400)
    }
    
    const filepath = join(VOLUME_PATH, path)
    
    // Security: Prevent directory traversal
    if (path.includes('..') || !filepath.startsWith(VOLUME_PATH)) {
      return c.json({ error: 'Invalid path' }, 400)
    }
    
    // Delete physical file
    if (existsSync(filepath)) {
      unlinkSync(filepath)
    }
    
    // Update database
    const { prisma } = await import('../lib/prisma.js')
    await prisma.document.updateMany({
      where: { filePath: path },
      data: { status: 'DELETED' }
    })
    
    return c.json({ success: true })
    
  } catch (error) {
    console.error('Delete error:', error)
    return c.json({ error: 'Failed to delete file' }, 500)
  }
})

// Get storage info
app.get('/info', async (c) => {
  try {
    const { prisma } = await import('../lib/prisma.js')
    const userId = c.get('userId')
    
    // Get user's documents
    const documents = await prisma.document.groupBy({
      by: ['category'],
      where: {
        uploadedBy: userId,
        status: 'ACTIVE'
      },
      _count: true,
      _sum: {
        fileSize: true
      }
    })
    
    const totalSize = documents.reduce((acc, doc) => acc + (doc._sum.fileSize || 0), 0)
    
    return c.json({
      volumePath: VOLUME_PATH,
      isProduction: process.env.NODE_ENV === 'production',
      storage: {
        used: totalSize,
        limit: 1024 * 1024 * 1024, // 1GB
        percentage: (totalSize / (1024 * 1024 * 1024)) * 100
      },
      categories: documents.map(doc => ({
        category: doc.category,
        count: doc._count,
        size: doc._sum.fileSize || 0
      }))
    })
    
  } catch (error) {
    console.error('Storage info error:', error)
    return c.json({ error: 'Failed to get storage info' }, 500)
  }
})

export default app