#!/bin/bash

echo "🚀 Setting up MSME AI Assistant..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
fi

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and update backend/.env with your configuration"
echo "  2. Review and update frontend/.env with your configuration"
echo "  3. Run 'npm run dev' to start the development servers"
echo ""
echo "Useful commands:"
echo "  npm run dev          - Start both backend and frontend"
echo "  npm run dev:backend  - Start backend only"
echo "  npm run dev:frontend - Start frontend only"
echo "  npm test             - Run all tests"
echo "  docker-compose down  - Stop database services"
echo ""
