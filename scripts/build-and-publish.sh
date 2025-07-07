#!/bin/bash

# Complete Build, Package and Publish Script for VS Code Markdown Editor Extension
# Usage: ./scripts/build-and-publish.sh [options]
# Options:
#   --package-only    Only build and package, don't publish
#   --skip-version    Skip version bump
#   --help           Show help message

set -e  # Exit on any error

PACKAGE_ONLY=false
SKIP_VERSION=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --package-only)
            PACKAGE_ONLY=true
            shift
            ;;
        --skip-version)
            SKIP_VERSION=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --package-only    Only build and package, don't publish"
            echo "  --skip-version    Skip version bump"
            echo "  --help           Show help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Starting complete build and publish process..."

# Step 1: Build media-src
echo "📦 Building media-src..."
cd media-src
bun run build
cd ..

# Step 2: Build main project (TypeScript compilation)
echo "🔨 Building main project..."
tsc -p ./

# Step 3: Version bump (if not skipped)
if [ "$SKIP_VERSION" = false ] && [ "$PACKAGE_ONLY" = false ]; then
    echo "📝 Bumping version..."
    npm version patch
fi

# Step 4: Generate VSIX package
echo "📤 Generating VSIX package..."
npx vsce package --no-yarn

if [ "$PACKAGE_ONLY" = true ]; then
    echo "✅ Package build complete!"
    echo "📦 VSIX file generated: $(ls -la *.vsix | tail -n 1 | awk '{print $9}')"
    exit 0
fi

# Step 5: Push to git (if not package-only)
echo "📤 Pushing to git..."
git push origin master --tags

# Step 6: Publish to marketplace
echo "🚀 Publishing to marketplace..."
npx vsce publish --no-yarn

echo "✅ Publish complete!"
echo "🎉 Extension has been published successfully!"
