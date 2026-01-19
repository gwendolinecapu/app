#!/bin/bash
# Setup script for PluralConnect - React Native/Expo application
# This script is designed to be run by Jules in a CI/automated environment

set -e

echo "🚀 Setting up PluralConnect environment..."

# Navigate to project root (the repo will be cloned into /app by Jules)
cd /app

# Install Node.js dependencies
echo "📦 Installing npm dependencies..."
npm install

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

# Run TypeScript type checking to verify the setup
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit || echo "⚠️ TypeScript found some issues (non-blocking)"

# Run linting to verify ESLint setup
echo "🧹 Running linter..."
npm run lint || echo "⚠️ Linting found some issues (non-blocking)"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  - Configure .env with your Firebase/Supabase credentials"
echo "  - Run 'npx expo start --ios' to start on iOS simulator"
echo "  - Run 'npx expo start --android' for Android emulator"
