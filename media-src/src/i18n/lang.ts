/**
 * 国际化语言配置
 */

// 语言定义
export interface LanguageDefinition {
  save: string;
  copyMarkdown?: string;
  copyHtml?: string;
  resetConfig?: string;
  resetConfirm?: string;
  alignLeft?: string;
  alignCenter?: string; 
  alignRight?: string;
  insertRowAbove?: string;
  insertRowBelow?: string;
  insertColumnLeft?: string;
  insertColumnRight?: string;
  'delete-row'?: string;
  'delete-column'?: string;
  [key: string]: string | undefined;
}

// 语言包定义
export interface Languages {
  en_US: LanguageDefinition;
  ja_JP: LanguageDefinition;
  ko_KR: LanguageDefinition;
  zh_CN: LanguageDefinition;
  [key: string]: LanguageDefinition;
}

// 语言配置
export const Langs: Languages = {
  en_US: {
    save: 'Save',
    copyMarkdown: 'Copy Markdown',
    copyHtml: 'Copy HTML',
    resetConfig: 'Reset config',
    resetConfirm: "Are you sure to reset the markdown-editor's config?",
    alignLeft: 'Align Left',
    alignCenter: 'Align Center', 
    alignRight: 'Align Right',
    insertRowAbove: 'Insert Row Above',
    insertRowBelow: 'Insert Row Below',
    insertColumnLeft: 'Insert Column Left',
    insertColumnRight: 'Insert Column Right',
    'delete-row': 'Delete Row',
    'delete-column': 'Delete Column'
  },
  ja_JP: {
    save: '保存する',
  },
  ko_KR: {
    save: '저장',
  },
  zh_CN: {
    save: '保存',
    copyMarkdown: '复制 Markdown',
    copyHtml: '复制 HTML',
    resetConfig: '重置配置',
    resetConfirm: '确定要重置 markdown-editor 的配置么?',
  },
};

// 获取当前语言
export const getCurrentLanguage = (): string => {
  let l: string = navigator.language.replace('-', '_');
  if (!Langs[l]) {
    l = 'en_US';
  }
  return l;
};

// 当前语言
export const lang = getCurrentLanguage();

/**
 * 国际化翻译函数
 * @param key 翻译键值
 * @returns 翻译后的文本
 */
export function t(key: string): string {
  return (Langs[lang] && Langs[lang][key]) || Langs.en_US[key] || key;
}

/**
 * 更新热键提示
 * @param tip 热键提示
 * @returns 更新后的热键提示
 */
export function updateHotkeyTip(tip: string): string {
  return tip;
}
