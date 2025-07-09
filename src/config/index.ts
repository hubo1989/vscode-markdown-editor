import * as vscode from 'vscode'
import { EditorConfig } from '../types'

export const CONFIG_KEYS = {
  VDITOR_OPTIONS: 'vditor.options',
  EXTERNAL_CSS_FILES: 'markdown-editor.externalCssFiles',
  CUSTOM_CSS: 'markdown-editor.customCss',
  CSS_LOAD_ORDER: 'markdown-editor.cssLoadOrder',
  IMAGE_SAVE_FOLDER: 'markdown-editor.imageSaveFolder',
  USE_VSCODE_THEME_COLOR: 'markdown-editor.useVscodeThemeColor',
  SHOW_OUTLINE_BY_DEFAULT: 'markdown-editor.showOutlineByDefault',
  OUTLINE_POSITION: 'markdown-editor.outlinePosition',
  OUTLINE_WIDTH: 'markdown-editor.outlineWidth',
  IS_DEFAULT: 'markdown-editor.isDefault',
  SHOW_TOOLBAR: 'markdown-editor.showToolbar',
} as const

export class ConfigManager {
  private static get config() {
    return vscode.workspace.getConfiguration('markdown-editor')
  }

  static getEditorConfig(): EditorConfig {
    const config = this.config
    return {
      externalCssFiles: config.get<string[]>('externalCssFiles') || [],
      customCss: config.get<string>('customCss') || '',
      cssLoadOrder: config.get<'external-first' | 'custom-first'>('cssLoadOrder') || 'external-first',
      imageSaveFolder: config.get<string>('imageSaveFolder') || 'assets',
      useVscodeThemeColor: config.get<boolean>('useVscodeThemeColor') || false,
      showOutlineByDefault: config.get<boolean>('showOutlineByDefault') || false,
      outlinePosition: config.get<'left' | 'right'>('outlinePosition') || 'left',
      outlineWidth: config.get<number>('outlineWidth') || 300,
      isDefault: config.get<boolean>('isDefault') || false,
      showToolbar: config.get<boolean>('showToolbar', true),
    }
  }

  static async updateConfig(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global) {
    const config = vscode.workspace.getConfiguration('markdown-editor')
    await config.update(key, value, target)
  }

  static isCssConfigChanged(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(CONFIG_KEYS.EXTERNAL_CSS_FILES) ||
           e.affectsConfiguration(CONFIG_KEYS.CUSTOM_CSS) ||
           e.affectsConfiguration(CONFIG_KEYS.CSS_LOAD_ORDER)
  }

  static isOutlineConfigChanged(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(CONFIG_KEYS.SHOW_OUTLINE_BY_DEFAULT) ||
           e.affectsConfiguration(CONFIG_KEYS.OUTLINE_POSITION) ||
           e.affectsConfiguration(CONFIG_KEYS.OUTLINE_WIDTH) ||
           e.affectsConfiguration(CONFIG_KEYS.USE_VSCODE_THEME_COLOR)
  }

  static isToolbarConfigChanged(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(CONFIG_KEYS.SHOW_TOOLBAR)
  }
}
