#!/bin/bash

echo "Running Prisma migrations on Railway..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo "Migrations completed successfully!"
    
    # Show current database status
    echo "Current database schema:"
    npx prisma db pull
    
    echo "Tables created:"
    npx prisma studio &
    sleep 5
    kill $!
else
    echo "Migration failed! Check the error messages above."
    exit 1
fi