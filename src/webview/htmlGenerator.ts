import * as vscode from 'vscode'
import * as NodePath from 'path'
import * as fs from 'fs'
import { EditorConfig } from '../types'
import { isHttpUrl } from '../utils'

export class WebviewHtmlGenerator {
  constructor(
    private webview: vscode.Webview,
    private extensionUri: vscode.Uri,
    private documentUri: vscode.Uri
  ) {}

  generate(config: EditorConfig): string {
    const baseHref = this.getBaseHref()
    const jsFiles = this.getJsFiles()
    const cssFiles = this.getCssFiles()
    const externalCssLinks = this.generateExternalCssLinks(config)
    const cssContent = this.generateCssContent(config, externalCssLinks)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${baseHref}" />
  ${cssFiles.map(f => `<link href="${f}" rel="stylesheet">`).join('\n')}
  ${cssContent}
  <title>markdown editor</title>
</head>
<body>
  <div id="app"></div>
  ${jsFiles.map(f => `<script src="${f}"></script>`).join('\n')}
</body>
</html>`
  }

  private getBaseHref(): string {
    const webviewUri = this.webview.asWebviewUri(vscode.Uri.file(this.documentUri.fsPath))
    return NodePath.dirname(webviewUri.toString()) + '/'
  }

  private getJsFiles(): string[] {
    return ['main.js']
      .map(f => `media/dist/${f}`)
      .map(f => this.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, f)).toString())
  }

  private getCssFiles(): string[] {
    return ['main.css']
      .map(f => `media/dist/${f}`)
      .map(f => this.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, f)).toString())
  }

  private generateExternalCssLinks(config: EditorConfig): string {
    return config.externalCssFiles.map(cssFile => {
      if (isHttpUrl(cssFile)) {
        return `<link href="${cssFile}" rel="stylesheet" crossorigin="anonymous">`
      } else if (NodePath.isAbsolute(cssFile)) {
        try {
          const cssUri = this.webview.asWebviewUri(vscode.Uri.file(cssFile))
          return `<link href="${cssUri}" rel="stylesheet">`
        } catch (error) {
          console.warn(`Failed to load CSS file: ${cssFile}`, error)
          return `<!-- Failed to load CSS: ${cssFile} -->`
        }
      } else {
        return this.handleRelativeCssPath(cssFile)
      }
    }).join('\n')
  }

  private handleRelativeCssPath(cssFile: string): string {
    try {
      const markdownDir = NodePath.dirname(this.documentUri.fsPath)
      const relativeToMarkdown = NodePath.resolve(markdownDir, cssFile)
      
      let resolvedPath: string
      if (fs.existsSync(relativeToMarkdown)) {
        resolvedPath = relativeToMarkdown
      } else {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.documentUri)
        if (workspaceFolder) {
          resolvedPath = NodePath.resolve(workspaceFolder.uri.fsPath, cssFile)
        } else {
          resolvedPath = relativeToMarkdown
        }
      }
      
      const cssUri = this.webview.asWebviewUri(vscode.Uri.file(resolvedPath))
      return `<link href="${cssUri}" rel="stylesheet">`
    } catch (error) {
      console.warn(`Failed to resolve CSS file: ${cssFile}`, error)
      return `<!-- Failed to resolve CSS: ${cssFile} -->`
    }
  }

  private generateCssContent(config: EditorConfig, externalCssLinks: string): string {
    const customCssStyle = config.customCss ? `<style>${config.customCss}</style>` : ''
    
    if (config.cssLoadOrder === 'external-first') {
      return externalCssLinks + (customCssStyle ? `\n${customCssStyle}` : '')
    } else {
      return (customCssStyle ? `${customCssStyle}\n` : '') + externalCssLinks
    }
  }
}
