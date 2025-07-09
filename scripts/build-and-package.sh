#!/bin/bash

# Build and Package Script for VS Code Markdown Editor Extension
# This script automates the complete build and packaging process

set -e  # Exit on any error

echo "🚀 Starting complete build and package process..."

# Step 1: Clean old build files
echo "🧹 Cleaning old build files..."
rm -rf out/
rm -rf media/dist/
rm -f *.vsix

# Step 2: Build media-src
echo "📦 Building media-src..."
cd media-src
bun run build
cd ..

# Step 3: Build main project (TypeScript compilation)
echo "🔨 Building main project..."
tsc -p ./

# Step 4: Generate VSIX package
echo "📤 Generating VSIX package..."
npx vsce package --no-yarn

echo "✅ Package build complete!"
echo "📦 VSIX file generated: $(ls -la *.vsix | tail -n 1 | awk '{print $9}')"
