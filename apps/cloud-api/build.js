// Build script for Railway
import { execSync } from 'child_process'

console.log('Building cloud-api for production...')

try {
  // Generate Prisma client
  console.log('Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  console.log('Build complete!')
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}