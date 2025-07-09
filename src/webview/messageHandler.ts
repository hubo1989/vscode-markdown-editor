import * as vscode from 'vscode'
import * as NodePath from 'path'
import { WebviewMessage, VditorOptions } from '../types'
import { CONFIG_KEYS, ConfigManager } from '../config'
import { debug, showError, getAssetsFolder } from '../utils'

export class MessageHandler {
  constructor(
    private context: vscode.ExtensionContext,
    private panel: vscode.WebviewPanel,
    private document: vscode.TextDocument,
    private uri: vscode.Uri,
    private onUpdateEditTitle: () => void
  ) {}

  async handleMessage(message: WebviewMessage): Promise<void> {
    debug('msg from webview review', message, this.panel.active)

    switch (message.command) {
      case 'ready':
        await this.handleReady()
        break
      case 'save-options':
        await this.handleSaveOptions(message.options!)
        break
      case 'info':
        vscode.window.showInformationMessage(message.content!)
        break
      case 'error':
        showError(message.content!)
        break
      case 'edit':
        await this.handleEdit(message)
        break
      case 'reset-config':
        await this.handleResetConfig()
        break
      case 'save':
        await this.handleSave(message)
        break
      case 'upload':
        await this.handleUpload(message)
        break
      case 'open-link':
        await this.handleOpenLink(message)
        break
      case 'update-outline-width':
        await this.handleUpdateOutlineWidth(message)
        break
      default:
        console.warn('Unknown message command:', message.command)
    }
  }

  private async handleReady(): Promise<void> {
    const config = ConfigManager.getEditorConfig()
    const savedOptions = this.context.globalState.get(CONFIG_KEYS.VDITOR_OPTIONS) as VditorOptions | undefined
    const options = {
      ...config,
      ...(savedOptions || {}),
    }

    this.panel.webview.postMessage({
      command: 'update',
      content: this.getDocumentContent(),
      type: 'init',
      options,
      theme: vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light',
    })
  }

  private async handleSaveOptions(options: VditorOptions): Promise<void> {
    await this.context.globalState.update(CONFIG_KEYS.VDITOR_OPTIONS, options)
  }

  private async handleEdit(message: WebviewMessage): Promise<void> {
    if (this.panel.active) {
      await this.syncToEditor(message.content!)
      this.onUpdateEditTitle()
    }
  }

  private async handleResetConfig(): Promise<void> {
    await this.context.globalState.update(CONFIG_KEYS.VDITOR_OPTIONS, {})
  }

  private async handleSave(message: WebviewMessage): Promise<void> {
    await this.syncToEditor(message.content!)
    await this.document.save()
    this.onUpdateEditTitle()
  }

  private async handleUpload(message: WebviewMessage): Promise<void> {
    const config = ConfigManager.getEditorConfig()
    const assetsFolder = getAssetsFolder(this.uri, config.imageSaveFolder)
    
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(assetsFolder))
    } catch (error) {
      console.error(error)
      showError(`Invalid image folder: ${assetsFolder}`)
      return
    }

    await Promise.all(
      message.files!.map(async (f) => {
        const content = Buffer.from(f.base64, 'base64')
        return vscode.workspace.fs.writeFile(
          vscode.Uri.file(NodePath.join(assetsFolder, f.name)),
          content
        )
      })
    )

    const files = message.files!.map((f) =>
      NodePath.relative(
        NodePath.dirname(this.uri.fsPath),
        NodePath.join(assetsFolder, f.name)
      ).replace(/\\/g, '/')
    )

    this.panel.webview.postMessage({
      command: 'uploaded',
      files,
    })
  }

  private async handleOpenLink(message: WebviewMessage): Promise<void> {
    let url = message.href!
    if (!/^http/.test(url)) {
      url = NodePath.resolve(this.uri.fsPath, '..', url)
    }
    await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url))
  }

  private async handleUpdateOutlineWidth(message: WebviewMessage): Promise<void> {
    await ConfigManager.updateConfig('outlineWidth', message.width!)
  }

  private async syncToEditor(content: string): Promise<void> {
    debug('sync to editor', this.document, this.uri)
    if (this.document) {
      const edit = new vscode.WorkspaceEdit()
      edit.replace(
        this.document.uri,
        new vscode.Range(0, 0, this.document.lineCount, 0),
        content
      )
      await vscode.workspace.applyEdit(edit)
    } else if (this.uri) {
      await vscode.workspace.fs.writeFile(this.uri, Buffer.from(content, 'utf8'))
    } else {
      showError('Cannot find original file to save!')
    }
  }

  private getDocumentContent(): string {
    return this.document ? this.document.getText() : ''
  }
}
