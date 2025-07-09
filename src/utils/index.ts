import * as vscode from 'vscode'
import * as NodePath from 'path'

export function debug(...args: any[]) {
  console.log(...args)
}

export function showError(msg: string) {
  vscode.window.showErrorMessage(`[markdown-editor] ${msg}`)
}

export function showInfo(msg: string) {
  vscode.window.showInformationMessage(msg)
}

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function getAssetsFolder(uri: vscode.Uri, imageSaveFolder: string): string {
  const processedFolder = imageSaveFolder
    .replace(
      '${projectRoot}',
      vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || ''
    )
    .replace('${file}', uri.fsPath)
    .replace(
      '${fileBasenameNoExtension}',
      NodePath.basename(uri.fsPath, NodePath.extname(uri.fsPath))
    )
    .replace('${dir}', NodePath.dirname(uri.fsPath))
  
  return NodePath.resolve(NodePath.dirname(uri.fsPath), processedFolder)
}

export function getWebviewOptions(uri?: vscode.Uri): vscode.WebviewOptions & vscode.WebviewPanelOptions {
  const folders = []
  for (let i = 65; i <= 90; i++) {
    folders.push(vscode.Uri.file(`${String.fromCharCode(i)}:/`))
  }

  return {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.file("/"), ...folders],
    retainContextWhenHidden: true,
    enableCommandUris: true,
  }
}

export function getCurrentTheme(): 'dark' | 'light' {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light'
}
