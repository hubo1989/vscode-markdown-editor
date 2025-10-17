CLAUDE.md

This file provides guidance to CLAUDE (CLAUDE CODE) when working with code in this repository.

## Project Overview

A VS Code extension providing a WYSIWYG markdown editor with real-time preview. Built as a dual-process architecture with a TypeScript extension host and a webview-based editor frontend using [vditor](https://github.com/Vanessa219/vditor).

## Essential Commands

### Development

```bash
# Start development with watch mode (both extension and webview)
npm run watch
# or
foy watch

# Build for production
npm run build
# or
foy build
```

### Packaging & Publishing

```bash
# Create VSIX package only
npm run package

# Build and publish (with version bump)
npm run publish

# Build and package without publishing
npm run publish:package-only

# Build and publish without version bump
npm run publish:skip-version
```

### Testing Extension

To test the extension during development:

1. Press F5 in VS Code to launch Extension Development Host
2. Open a `.md` file in the new window
3. Use `Cmd+Shift+Alt+M` (Mac) or `Ctrl+Shift+Alt+M` (Win) to open with markdown editor
4. Or right-click file → "Open with markdown editor"

## Architecture

### Dual-Process Structure

The extension operates in two distinct environments that communicate via message passing:

1. **Extension Host** (`src/`)

   - Runs in Node.js context with access to VS Code API
   - Manages file system operations, configuration, and editor lifecycle
   - Entry point: `src/extension.ts`
2. **Webview** (`media-src/`)

   - Runs in sandboxed browser context
   - Handles markdown rendering and editing UI using vditor
   - Built with bun, output to `media/dist/`
   - Entry point: `media-src/src/main.ts`

### Key Components

#### Extension Host (`src/`)

- **`extension.ts`**: Activation entry point, registers commands and providers
- **`editor/editorPanel.ts`**: Manages webview panel lifecycle, handles split view
- **`editor/markdownEditorProvider.ts`**: Custom editor provider for `.md` files
- **`webview/htmlGenerator.ts`**: Generates HTML for webview with CSS injection
- **`webview/messageHandler.ts`**: Handles bidirectional messages between extension and webview
- **`config/`**: Configuration keys and utilities
- **`utils/`**: Shared utilities

#### Webview Frontend (`media-src/src/`)

- **`main.ts`**: Webview initialization and message handling setup
- **`core/editorInit.ts`**: vditor instance creation and configuration
- **`core/editorConfig.ts`**: Editor options and settings
- **`features/css/cssHandler.ts`**: External CSS loading and custom styling
- **`features/toolbar/`**: Toolbar configuration and interaction
- **`features/upload/`**: Image upload and asset management
- **`features/image/`**: Image resizing and manipulation
- **`features/table/`**: Table editing enhancements

### Communication Protocol

Extension and webview communicate via `postMessage` API:

**Extension → Webview:**

- `updateContent`: Sync markdown content from file
- `updateConfig`: Push configuration changes
- `updateTheme`: Update editor theme colors

**Webview → Extension:**

- `contentChanged`: Markdown content edited in webview
- `ready`: Webview initialized and ready
- `uploadImage`: Request to save uploaded image

## Directory Structure

```
vscode-markdown-editor/
├── src/                    # Extension host code (TypeScript)
│   ├── extension.ts        # Main activation entry
│   ├── editor/             # Editor panel and provider
│   ├── webview/            # HTML generation and messaging
│   ├── config/             # Configuration management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Shared utilities
├── media-src/              # Webview frontend source
│   └── src/
│       ├── main.ts         # Webview entry point
│       ├── core/           # Editor initialization
│       └── features/       # Feature modules (CSS, toolbar, upload, etc.)
├── media/                  # Static assets and compiled webview
│   └── dist/               # Built webview output (generated)
├── out/                    # Compiled extension code (generated)
├── scripts/                # Build and publish automation
├── docs/                   # Documentation
└── Foyfile.ts              # Task runner configuration
```

## Build System

### Foy Task Runner

Uses [Foy](https://github.com/zaaack/foy) for parallel build tasks:

- `foy watch`: Watches both TypeScript extension and webview with hot reload
- `foy build`: Production build of both extension and webview

### Frontend Build (Bun)

The webview frontend uses **bun** (not npm/pnpm) for faster builds:

```bash
cd media-src
bun install     # Install dependencies
bun start       # Watch mode
bun run build   # Production build
```

Output: Single bundled JS file in `media/dist/main.js`

### TypeScript Configuration

- Strict mode enabled in both `tsconfig.json` files
- Target: ES2019 for Node.js compatibility
- CommonJS modules for VS Code extension API compatibility

## External CSS Feature

A major feature allowing users to inject custom styles from multiple sources:

### Configuration

- `markdown-editor.externalCssFiles`: Array of URLs or local paths
- `markdown-editor.customCss`: Inline CSS string
- `markdown-editor.cssLoadOrder`: Priority order (`external-first` or `custom-first`)

### Implementation

- CSS loading: `media-src/src/features/css/cssHandler.ts`
- HTML injection: `src/webview/htmlGenerator.ts`
- Supports HTTP/HTTPS URLs, absolute paths, and workspace-relative paths
- Hot reload on configuration change

## VS Code Extension Points

### Commands

- `markdown-editor.openEditor`: Open file in markdown editor
- `markdown-editor.openInSplit`: Open in split view with source
- `markdown-editor.toggleDefault`: Toggle as default .md editor

### Custom Editor

Registers `markdown-editor.editor` as a custom editor for `*.md` files with configurable priority (default or option).

### Configuration Keys

All settings under `markdown-editor.*` namespace (see `package.json` for full list).

### Menus

- Explorer context menu (right-click on .md file)
- Editor title context menu
- Editor title toolbar (pencil icon for split view)

## Development Patterns

### TypeScript Conventions

- Use `interface` for object shapes (not `type`)
- Avoid `enum`, use const objects with `as const`
- Async/await preferred over promises
- Guard clauses and early returns

### Webview State Management

- Configuration changes trigger full webview reload
- Content syncs bidirectionally via message passing
- Webview retains context when hidden (`retainContextWhenHidden: true`)

### Error Handling

- Errors logged to VS Code output channel
- User-facing errors shown via `vscode.window.showErrorMessage`
- Webview errors captured and sent to extension host

## Testing in Development

1. Start watch mode: `npm run watch` or `foy watch`
2. Press F5 to launch Extension Development Host
3. Changes to `src/` trigger automatic recompile
4. Changes to `media-src/` auto-rebuild webview (requires manual reload)
5. Use Developer Tools (Help → Toggle Developer Tools) to debug webview

## Codebase Insights

### Image Upload Flow

1. User pastes/drops image in webview
2. Webview sends `uploadImage` message with base64 data
3. Extension saves to `assets/` (or configured folder)
4. Extension returns file path to webview
5. Webview inserts markdown image syntax

### Custom CSS Resolution

1. Extension reads config on startup and config change
2. Resolves relative paths (markdown file dir → workspace root)
3. Injects as `<link>` tags (URLs) or `<style>` tags (inline)
4. Order controlled by `cssLoadOrder` setting

### Split View Implementation

Split view uses two VS Code columns:

- Column 1: Standard text editor (source .md)
- Column 2: Webview panel (WYSIWYG editor)
  Both sync via file system and VS Code's document change events

## Package Manager Notes

- **Root project**: Uses `yarn` (specified in `package.json` packageManager)
- **Webview (`media-src/`)**: Uses `bun` for builds
- Do not use `pnpm` in `media-src/` - build scripts explicitly avoid it
- VSIX packaging: `npx vsce package --no-yarn` (uses npm internally)

## Key Dependencies

### Extension

- `vscode`: VS Code API (peer dependency)
- TypeScript 4.2.2

### Webview

- `vditor` (^3.8.4): Core WYSIWYG markdown editor
- `jquery` + `jquery-confirm`: UI interactions
- `date-fns`, `lodash`: Utilities

## Localization

UI strings are primarily in Chinese with some English. When adding user-facing messages:

- Status bar and notifications use Chinese
- Command titles and descriptions in `package.json` use English/Chinese mix
- Consider adding localization support for international users
