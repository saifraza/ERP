#!/bin/bash

# Script to seed Railway database with initial data

echo "🌱 Seeding Railway database..."

# Go to cloud-api directory
cd apps/cloud-api

# Set the Railway database URL (you'll need to replace this with your actual URL)
export DATABASE_URL="postgresql://postgres:qRvNDeDRjOOJQhdpNlYzGMhfJhzdAwVn@postgres.railway.internal:5432/railway"

# First, let's check if we can connect
echo "📊 Checking database connection..."
npx prisma db push --skip-generate

# Run the seed script
echo "🌱 Running seed script..."
npx tsx prisma/seed.ts

echo "✅ Database seeded successfully!"