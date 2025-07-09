import * as vscode from 'vscode'
import * as NodePath from 'path'
import { EditorPanelDependencies } from '../types'
import { ConfigManager } from '../config'
import { debug, showError, getWebviewOptions, getCurrentTheme } from '../utils'
import { WebviewHtmlGenerator } from '../webview/htmlGenerator'
import { MessageHandler } from '../webview/messageHandler'

export class EditorPanel {
  public static currentPanel: EditorPanel | undefined
  public static readonly viewType = 'markdown-editor'

  private _disposables: vscode.Disposable[] = []
  private _isEdit = false
  private _messageHandler: MessageHandler
  private _htmlGenerator: WebviewHtmlGenerator

  constructor(private dependencies: EditorPanelDependencies) {
    this._htmlGenerator = new WebviewHtmlGenerator(
      this.dependencies.panel.webview,
      this.dependencies.extensionUri,
      this.dependencies.uri
    )

    this._messageHandler = new MessageHandler(
      this.dependencies.context,
      this.dependencies.panel,
      this.dependencies.document,
      this.dependencies.uri,
      () => this.updateEditTitle()
    )

    this.initialize()
    this.setupEventListeners()
  }

  public static async createOrShow(
    context: vscode.ExtensionContext,
    uri?: vscode.Uri,
    splitRight?: boolean
  ): Promise<void> {
    const column = splitRight 
      ? vscode.ViewColumn.Two 
      : vscode.window.activeTextEditor?.viewColumn

    // 如果已有面板但URI不同，则关闭当前面板
    if (EditorPanel.currentPanel && uri !== EditorPanel.currentPanel.dependencies.uri) {
      EditorPanel.currentPanel.dispose()
    }

    // 如果已有面板，则显示它
    if (EditorPanel.currentPanel) {
      EditorPanel.currentPanel.dependencies.panel.reveal(column)
      return
    }

    const document = await this.getDocument(uri)
    if (!document) {
      return
    }

    const panel = vscode.window.createWebviewPanel(
      EditorPanel.viewType,
      'markdown-editor',
      column || vscode.ViewColumn.One,
      getWebviewOptions(uri)
    )

    EditorPanel.currentPanel = new EditorPanel({
      context,
      panel,
      extensionUri: context.extensionUri,
      document,
      uri: uri || document.uri,
    })
  }

  private static async getDocument(uri?: vscode.Uri): Promise<vscode.TextDocument | undefined> {
    if (!vscode.window.activeTextEditor && !uri) {
      showError('Did not open markdown file!')
      return undefined
    }

    let doc: vscode.TextDocument | undefined

    if (uri) {
      doc = await vscode.workspace.openTextDocument(uri)
    } else {
      doc = vscode.window.activeTextEditor?.document
      if (doc && doc.languageId !== 'markdown') {
        showError(`Current file language is not markdown, got ${doc.languageId}`)
        return undefined
      }
    }

    if (!doc) {
      showError('Cannot find markdown file!')
      return undefined
    }

    return doc
  }

  private initialize(): void {
    this.dependencies.panel.webview.html = this.generateHtml()
    this.dependencies.panel.title = NodePath.basename(this.dependencies.uri.fsPath)
    this.dependencies.panel.onDidDispose(() => this.dispose(), null, this._disposables)
  }

  private setupEventListeners(): void {
    this.setupDocumentListeners()
    this.setupConfigurationListener()
    this.setupMessageListener()
  }

  private setupDocumentListeners(): void {
    let textEditTimer: NodeJS.Timeout | undefined

    // 关闭文档时关闭面板
    vscode.workspace.onDidCloseTextDocument((e) => {
      if (e.fileName === this.dependencies.uri.fsPath) {
        this.dispose()
      }
    }, this._disposables)

    // 文档内容变化时更新面板
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.fileName !== this.dependencies.document.fileName) {
        return
      }

      if (this.dependencies.panel.active) {
        return
      }

      if (textEditTimer) {
        clearTimeout(textEditTimer)
      }

      textEditTimer = setTimeout(() => {
        this.update()
        this.updateEditTitle()
      }, 300)
    }, this._disposables)
  }

  private setupConfigurationListener(): void {
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (ConfigManager.isCssConfigChanged(e)) {
        this.dependencies.panel.webview.html = this.generateHtml()
      }
      
      if (ConfigManager.isOutlineConfigChanged(e)) {
        const config = ConfigManager.getEditorConfig()
        this.dependencies.panel.webview.postMessage({
          command: 'config-update',
          config: {
            showOutlineByDefault: config.showOutlineByDefault,
            outlinePosition: config.outlinePosition,
            outlineWidth: config.outlineWidth,
            useVscodeThemeColor: config.useVscodeThemeColor,
          }
        })
      }

      if (ConfigManager.isToolbarConfigChanged(e)) {
        const config = ConfigManager.getEditorConfig()
        this.dependencies.panel.webview.postMessage({
          command: 'config-update',
          config: {
            showToolbar: config.showToolbar
          }
        })
      }
    }, this._disposables)
  }

  private setupMessageListener(): void {
    this.dependencies.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this._messageHandler.handleMessage(message)
      },
      null,
      this._disposables
    )
  }

  private generateHtml(): string {
    const config = ConfigManager.getEditorConfig()
    return this._htmlGenerator.generate(config)
  }

  private updateEditTitle(): void {
    const isEdit = this.dependencies.document.isDirty
    if (isEdit !== this._isEdit) {
      this._isEdit = isEdit
      this.dependencies.panel.title = `${isEdit ? '[edit]' : ''}${NodePath.basename(
        this.dependencies.uri.fsPath
      )}`
    }
  }

  private async update(): Promise<void> {
    const content = this.dependencies.document.getText()
    this.dependencies.panel.webview.postMessage({
      command: 'update',
      content,
      type: 'update',
      theme: getCurrentTheme(),
    })
  }

  public dispose(): void {
    EditorPanel.currentPanel = undefined
    this.dependencies.panel.dispose()

    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
