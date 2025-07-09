import * as vscode from 'vscode'

export interface VditorOptions {
  useVscodeThemeColor?: boolean
  showOutlineByDefault?: boolean
  outlinePosition?: string
  outlineWidth?: number
  enableOutlineResize?: boolean
  [key: string]: any
}

export interface EditorConfig {
  externalCssFiles: string[]
  customCss: string
  cssLoadOrder: 'external-first' | 'custom-first'
  imageSaveFolder: string
  useVscodeThemeColor: boolean
  showOutlineByDefault: boolean
  outlinePosition: 'left' | 'right'
  outlineWidth: number
  enableOutlineResize: boolean
}

export interface WebviewMessage {
  command: string
  content?: string
  options?: VditorOptions
  files?: UploadFile[]
  href?: string
  width?: number
}

export interface UploadFile {
  name: string
  base64: string
}

export interface UpdateProps {
  type?: 'init' | 'update'
  options?: VditorOptions
  theme?: 'dark' | 'light'
}

export interface EditorPanelDependencies {
  context: vscode.ExtensionContext
  panel: vscode.WebviewPanel
  extensionUri: vscode.Uri
  document: vscode.TextDocument
  uri: vscode.Uri
}
