#!/usr/bin/env bash

# MEGATAMA Website Setup Script
# This script sets up the development environment

echo "🚀 MEGATAMA Website Setup"
echo "================================"

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo "✓ NPM $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p src/assets/images
mkdir -p src/assets/videos
echo "✓ Directories created"

echo ""
echo "================================"
echo "✓ Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Run 'npm run dev' to start development server"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Edit files in src/ and index.html"
echo "  4. Run 'npm run build' for production"
echo ""
echo "📚 Documentation: See README.md"
echo "================================"
