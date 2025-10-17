import * as vscode from 'vscode'
import * as NodePath from 'path'
import * as fs from 'fs'
import { EditorPanelDependencies, EditorConfig } from '../types'
import { ConfigManager } from '../config'
import { debug, showError, getWebviewOptions, getCurrentTheme, isHttpUrl } from '../utils'
import { WebviewHtmlGenerator } from '../webview/htmlGenerator'
import { MessageHandler } from '../webview/messageHandler'

export class EditorPanel {
  public static currentPanel: EditorPanel | undefined
  public static readonly viewType = 'markdown-editor'

  private _disposables: vscode.Disposable[] = []
  private _isEdit = false
  private _messageHandler: MessageHandler
  private _htmlGenerator: WebviewHtmlGenerator

  private _cssFileWatchers: vscode.FileSystemWatcher[] = []

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

  public static openFindDialog(showReplace: boolean): void {
    if (EditorPanel.currentPanel) {
      EditorPanel.currentPanel.dependencies.panel.webview.postMessage({
        command: 'open-find-dialog',
        showReplace
      })
    }
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
    
    // 初始化时设置CSS文件监听器
    const config = ConfigManager.getEditorConfig()
    this.setupCssFileWatchers(config)
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
      const config = ConfigManager.getEditorConfig()
      
      if (ConfigManager.isCssConfigChanged(e)) {
        // 对于远程CSS URL的变更，仍然需要重新生成整个HTML
        const hasRemoteCssChanges = e.affectsConfiguration('markdown-editor.customCss') || 
                                   e.affectsConfiguration('markdown-editor.cssLoadOrder');
                                   
        // 检查是否只有本地CSS文件列表变化
        if (hasRemoteCssChanges) {
          // 如果有远程CSS变更或自定义CSS变更，重新生成整个HTML
          this.dependencies.panel.webview.html = this.generateHtml();
        } else {
          // 如果只是本地CSS文件列表变更，重新设置监听器，并发送更新消息
          this.setupCssFileWatchers(config);
          
          // 通知前端重新加载所有CSS
          this.dependencies.panel.webview.postMessage({
            command: 'reload-all-css',
            config: {
              externalCssFiles: config.externalCssFiles,
              customCss: config.customCss,
              cssLoadOrder: config.cssLoadOrder
            }
          });
        }
      }
      
      if (ConfigManager.isOutlineConfigChanged(e)) {
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

  private setupCssFileWatchers(config: EditorConfig): void {
    // 清除旧的监听器
    this._cssFileWatchers.forEach(watcher => watcher.dispose())
    this._cssFileWatchers = []
    
    // 只监听本地CSS文件
    const localCssFiles = config.externalCssFiles.filter(cssFile => !isHttpUrl(cssFile))
    debug(`Setting up watchers for ${localCssFiles.length} local CSS files`)
    
    for (const cssFile of localCssFiles) {
      try {
        // 解析完整路径
        let fullPath: string
        
        if (NodePath.isAbsolute(cssFile)) {
          fullPath = cssFile
        } else {
          const markdownDir = NodePath.dirname(this.dependencies.uri.fsPath)
          const relativeToMarkdown = NodePath.resolve(markdownDir, cssFile)
          
          if (fs.existsSync(relativeToMarkdown)) {
            fullPath = relativeToMarkdown
          } else {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.dependencies.uri)
            if (workspaceFolder) {
              fullPath = NodePath.resolve(workspaceFolder.uri.fsPath, cssFile)
            } else {
              fullPath = relativeToMarkdown
            }
          }
        }
        
        debug(`Resolved CSS file path: ${fullPath} for ${cssFile}`)
        
        // 尝试确定文件是否存在并创建合适的监听器
        const fileExists = fs.existsSync(fullPath)
        
        if (fileExists) {
          // 创建文件监听器
          const pattern = new vscode.RelativePattern(
            NodePath.dirname(fullPath),
            NodePath.basename(fullPath)
          )
          
          const watcher = vscode.workspace.createFileSystemWatcher(pattern)
          
          watcher.onDidChange(() => {
            debug(`CSS file changed: ${cssFile}`)
            this.updateCssFile(fullPath, cssFile) // 传递原始路径和完整路径
          })
          
          // 监听文件创建事件，有时编辑器会先删除再创建文件
          watcher.onDidCreate(() => {
            debug(`CSS file created: ${cssFile}`)
            this.updateCssFile(fullPath, cssFile)
          })
          
          // 监听文件删除事件
          watcher.onDidDelete(() => {
            debug(`CSS file deleted: ${cssFile}`)
            // 通知前端文件已被删除
            this.dependencies.panel.webview.postMessage({
              command: 'css-file-deleted',
              cssFile: cssFile
            })
          })
          
          this._cssFileWatchers.push(watcher)
          debug(`Watcher created for: ${fullPath}`)
        } else {
          // 文件不存在，监听目录以便文件创建时捕获
          const dirPath = NodePath.dirname(fullPath)
          
          // 确保目录存在
          if (fs.existsSync(dirPath)) {
            const pattern = new vscode.RelativePattern(
              dirPath,
              '*' // 监听目录下的所有文件
            )
            
            const watcher = vscode.workspace.createFileSystemWatcher(pattern)
            
            watcher.onDidCreate((createdUri) => {
              if (createdUri.fsPath === fullPath) {
                debug(`CSS file created: ${cssFile}`)
                this.updateCssFile(fullPath, cssFile)
              }
            })
            
            this._cssFileWatchers.push(watcher)
            debug(`Directory watcher created for: ${dirPath}`)
          } else {
            debug(`Directory does not exist for CSS file: ${dirPath}`)
          }
        }
      } catch (error) {
        console.warn(`Failed to watch CSS file: ${cssFile}`, error)
      }
    }
  }

  /**
   * 更新CSS文件
   * @param fullPath CSS文件的完整物理路径
   * @param originalPath 原始CSS路径（配置中使用的路径，可选）
   */
  private updateCssFile(fullPath: string, originalPath?: string): void {
    try {
      // 确保文件存在
      if (!fs.existsSync(fullPath)) {
        debug(`CSS file not found: ${fullPath}`)
        return
      }
      
      // 获取文件的URI
      const fileUri = vscode.Uri.file(fullPath)
      const webviewUri = this.dependencies.panel.webview.asWebviewUri(fileUri)
      
      debug(`Updating CSS file: ${fullPath}`)
      debug(`Webview URI: ${webviewUri.toString()}`)
      
      // 使用原始路径或完整路径作为标识符
      const cssFileIdentifier = originalPath || fullPath
      
      // 发送消息到前端，通知特定CSS文件需要更新
      this.dependencies.panel.webview.postMessage({
        command: 'update-css',
        cssFile: cssFileIdentifier, // 使用原始路径或完整路径，便于前端匹配
        fullPath: fullPath, // 始终包含完整路径用于调试
        uri: webviewUri.toString(),
        timestamp: new Date().getTime() // 添加时间戳避免缓存
      })
    } catch (error) {
      console.error(`Error updating CSS file: ${fullPath}`, error)
    }
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
