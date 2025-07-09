import * as vscode from 'vscode'
import { EditorPanel } from './editor/editorPanel'
import { MarkdownEditorProvider } from './editor/markdownEditorProvider'
import { CONFIG_KEYS } from './config'
import { debug } from './utils'

export function activate(context: vscode.ExtensionContext) {
  // 注册打开编辑器命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'markdown-editor.openEditor',
      (uri?: vscode.Uri, ...args) => {
        debug('command', uri, args)
        EditorPanel.createOrShow(context, uri)
      }
    )
  )

  // 注册在拆分窗口中打开编辑器命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'markdown-editor.openInSplit',
      (uri?: vscode.Uri, ...args) => {
        debug('command openInSplit', uri, args)
        EditorPanel.createOrShow(context, uri, true)
      }
    )
  )

  // 注册自定义编辑器提供者
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'markdown-editor.editor',
      new MarkdownEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  )

  // 设置全局状态同步
  context.globalState.setKeysForSync([CONFIG_KEYS.VDITOR_OPTIONS])

  // 添加配置变更监听器以显示提示信息
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(CONFIG_KEYS.IS_DEFAULT)) {
        const config = vscode.workspace.getConfiguration('markdown-editor')
        const isDefault = config.get<boolean>('isDefault') || false
        
        if (isDefault) {
          vscode.window.showInformationMessage(
            '已将Markdown编辑器设为默认打开方式。需要重启VS Code以生效。',
            '重启VS Code'
          ).then(selection => {
            if (selection === '重启VS Code') {
              vscode.commands.executeCommand('workbench.action.reloadWindow')
            }
          })
        } else {
          vscode.window.showInformationMessage(
            '已将Markdown编辑器设为可选打开方式。需要重启VS Code以生效。',
            '重启VS Code'
          ).then(selection => {
            if (selection === '重启VS Code') {
              vscode.commands.executeCommand('workbench.action.reloadWindow')
            }
          })
        }
      }
    })
  )

  // 添加状态栏按钮，方便快速切换默认编辑器
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.command = 'markdown-editor.toggleDefault'
  
  // 更新状态栏文本
  const updateStatusBar = () => {
    const config = vscode.workspace.getConfiguration('markdown-editor')
    const isDefault = config.get<boolean>('isDefault') || false
    statusBarItem.text = `MD编辑器: ${isDefault ? '默认' : '可选'}`
    statusBarItem.tooltip = `点击切换Markdown编辑器为${isDefault ? '可选' : '默认'}打开方式`
    statusBarItem.show()
  }
  
  // 注册命令切换默认状态
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-editor.toggleDefault', async () => {
      const config = vscode.workspace.getConfiguration('markdown-editor')
      const isDefault = config.get<boolean>('isDefault') || false
      await config.update('isDefault', !isDefault, vscode.ConfigurationTarget.Global)
    })
  )
  
  // 初始化状态栏
  updateStatusBar()
  
  // 当配置更新时更新状态栏
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(CONFIG_KEYS.IS_DEFAULT)) {
        updateStatusBar()
      }
    })
  )
  
  // 当打开markdown文件时显示状态栏项
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'markdown') {
        statusBarItem.show()
      } else {
        statusBarItem.hide()
      }
    })
  )
  
  // 将状态栏项添加到订阅中
  context.subscriptions.push(statusBarItem)
}
