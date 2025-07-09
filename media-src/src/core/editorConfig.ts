/**
 * 编辑器配置模块
 */
import { sendMessageToVSCode } from '../utils/common';

/**
 * 保存编辑器配置到VS Code
 */
export function saveEditorOptions(): void {
  if (!window.vditor) return;
  
  const vditorOptions = {
    theme: window.vditor.vditor.options.theme,
    mode: window.vditor.vditor.currentMode,
    preview: window.vditor.vditor.options.preview,
  };
  
  sendMessageToVSCode({
    command: 'save-options',
    options: vditorOptions,
  });
}

/**
 * 修复暗色主题切换
 * 切换content-theme时自动修改vditor主题
 */
export function setupThemeHandler(): void {
  const contentThemeButton = document.querySelector('[data-type="content-theme"]');
  if (!contentThemeButton || !contentThemeButton.nextElementSibling) return;

  contentThemeButton.nextElementSibling.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON') return;
    
    const type = target.getAttribute('data-type');
    if (type === 'dark') {
      window.vditor.setTheme(type);
    } else {
      window.vditor.setTheme('classic');
    }
  });
}

/**
 * 设置工具栏点击事件处理
 * 在工具栏按钮点击时保存配置
 */
export function setupToolbarClickHandler(): void {
  const toolbarButtons = document.querySelectorAll(
    '.vditor-toolbar .vditor-panel--left button, .vditor-toolbar .vditor-panel--arrow button'
  );
  
  toolbarButtons.forEach(button => {
    button.addEventListener('click', () => {
      setTimeout(saveEditorOptions, 500);
    });
  });
}
