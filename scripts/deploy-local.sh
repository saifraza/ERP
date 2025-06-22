#!/bin/bash

# Local deployment script for ERP system

set -e

echo "🚀 Deploying ERP System Locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "docker/local/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp docker/local/.env.example docker/local/.env
    echo "⚠️  Please edit docker/local/.env with your configuration before proceeding."
    echo "   Required: SA_PASSWORD, JWT_SECRET, ANTHROPIC_API_KEY"
    exit 1
fi

# Build and start services
echo "🔨 Building Docker images..."
cd docker/local
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "🗃️  Running database migrations..."
docker-compose exec api bun run db:push
docker-compose exec api bun run db:seed

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Database: localhost:1433"
echo ""
echo "📋 Default login:"
echo "   Email: admin@factory.com"
echo "   Password: admin123"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Update services: docker-compose pull && docker-compose up -d"