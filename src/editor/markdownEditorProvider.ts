import * as vscode from 'vscode'
import { EditorPanel } from './editorPanel'
import { getWebviewOptions } from '../utils'

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // 设置webview选项
    webviewPanel.webview.options = getWebviewOptions(document.uri)
    
    // 创建EditorPanel实例来处理编辑器逻辑，并设置为当前面板
    const editorPanel = new EditorPanel({
      context: this.context,
      panel: webviewPanel,
      extensionUri: this.context.extensionUri,
      document,
      uri: document.uri,
    })
    
    // 设置为当前活动面板，以便快捷键能够找到它
    EditorPanel.currentPanel = editorPanel
  }
}
