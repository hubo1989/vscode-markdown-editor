# Build and Package Scripts

This directory contains automated scripts for building and packaging the VS Code Markdown Editor extension.

## Scripts

### `build-and-package.sh`

A simple script that builds the extension and creates a VSIX package file.

**Usage:**
```bash
# Using npm script (recommended)
npm run package

# Direct execution
./scripts/build-and-package.sh
```

**What it does:**
1. 📦 Builds the media-src (frontend assets)
2. 🔨 Compiles TypeScript (main extension code)
3. 📤 Generates VSIX package using vsce

### `build-and-publish.sh`

A comprehensive script that builds, packages, and optionally publishes the extension.

**Usage:**
```bash
# Complete build and publish (version bump + publish)
npm run publish
# or
./scripts/build-and-publish.sh

# Only build and package (no publish)
npm run publish:package-only
# or
./scripts/build-and-publish.sh --package-only

# Build and publish without version bump
npm run publish:skip-version
# or
./scripts/build-and-publish.sh --skip-version

# Show help
./scripts/build-and-publish.sh --help
```

**What it does:**
1. 📦 Builds the media-src (frontend assets)
2. 🔨 Compiles TypeScript (main extension code)
3. 📝 Bumps version (unless --skip-version)
4. 📤 Generates VSIX package
5. 🚀 Pushes to git (unless --package-only)
6. 🎉 Publishes to marketplace (unless --package-only)

## Migration from Manual Process

### Before (Manual Process):
```bash
# Step 1: Build media-src
cd media-src
npm run build
cd ..

# Step 2: Build main project
bun run build

# Step 3: Generate VSIX
npx vsce package --no-yarn
```

### After (Automated):
```bash
# Just run one command!
npm run package
```

## Available npm Scripts

- `npm run package` - Build and create VSIX package
- `npm run publish` - Complete build, version bump, and publish
- `npm run publish:package-only` - Build and package only (no publish)
- `npm run publish:skip-version` - Build and publish without version bump

## Benefits

✅ **One-command operation** - No more manual multi-step process  
✅ **Error handling** - Scripts exit on any error  
✅ **Visual feedback** - Clear progress indicators with emojis  
✅ **Flexible options** - Support for different build scenarios  
✅ **Consistent builds** - Same process every time  
✅ **Time saving** - Automated workflow saves time and prevents mistakes  

## Troubleshooting

If you encounter issues:

1. **Permission denied**: Make sure scripts are executable
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Command not found**: Ensure all dependencies are installed
   ```bash
   npm install
   cd media-src && bun install
   ```

3. **Build failures**: Check individual commands manually
   ```bash
   cd media-src && bun run build
   tsc -p ./
   npx vsce package --no-yarn
   ```
