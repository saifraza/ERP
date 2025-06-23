// Build script for Railway
import { execSync } from 'child_process'
import fs from 'fs'

console.log('Building cloud-api for production...')

try {
  // Install dependencies
  console.log('Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })
  
  // Generate Prisma client
  console.log('Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  // Create a simple JS version of our TypeScript files
  console.log('Creating JavaScript version...')
  
  // Copy TypeScript files as JS (Railway will transpile at runtime with tsx)
  const srcFiles = [
    'src/index.ts',
    'src/lib/prisma.ts',
    'src/middleware/auth.ts',
    'src/routes/auth.ts',
    'src/routes/companies.ts',
    'src/routes/setup.ts'
  ]
  
  for (const file of srcFiles) {
    if (fs.existsSync(file)) {
      const jsFile = file.replace('.ts', '.js')
      fs.copyFileSync(file, jsFile)
      console.log(`Created ${jsFile}`)
    }
  }
  
  console.log('Build complete!')
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}