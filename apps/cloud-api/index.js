// Simple entry point for Railway
import('./src/index.ts').catch(err => {
  console.error('Failed to start TypeScript server:', err)
  console.log('Starting basic server...')
  
  // Fallback basic server
  import('hono').then(({ Hono }) => {
    import('@hono/node-server').then(({ serve }) => {
      const app = new Hono()
      
      app.get('/health', (c) => {
        return c.json({ status: 'ok', mode: 'fallback' })
      })
      
      const port = process.env.PORT || 3001
      serve({ fetch: app.fetch, port })
      console.log(`Fallback server running on port ${port}`)
    })
  })
})