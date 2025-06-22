#!/bin/bash

# Development environment setup script

set -e

echo "🛠️  Setting up ERP development environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "20" ]; then
    echo "❌ Node.js version 20+ required. Current version: $(node --version)"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo "📝 Setting up environment files..."
if [ ! -f "apps/local-api/.env" ]; then
    cp apps/local-api/.env.example apps/local-api/.env
    echo "✅ Created apps/local-api/.env"
fi

if [ ! -f "packages/database/.env" ]; then
    cp packages/database/.env.example packages/database/.env
    echo "✅ Created packages/database/.env"
fi

# Check if MS SQL Server is available
echo "🗃️  Checking database connection..."
if command -v sqlcmd &> /dev/null; then
    echo "✅ SQL Server tools found"
else
    echo "⚠️  SQL Server command line tools not found"
    echo "   For Mac: brew install microsoft/mssql-tools/mssql-tools"
    echo "   For Windows: Install SQL Server Management Studio"
fi

echo "✅ Development environment setup completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Configure your database connection in packages/database/.env"
echo "2. Configure API settings in apps/local-api/.env"
echo "3. Start development servers: pnpm dev"
echo ""
echo "📚 Available commands:"
echo "   pnpm dev          - Start all development servers"
echo "   pnpm dev:local    - Start only local services"
echo "   pnpm build        - Build for production"
echo "   pnpm test         - Run tests"
echo "   pnpm db:push      - Push database schema"
echo "   pnpm db:studio    - Open Prisma Studio"