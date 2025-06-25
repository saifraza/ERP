import { Context } from 'hono'

export const errorHandler = (err: Error, c: Context) => {
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method
  })
  
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500)
}