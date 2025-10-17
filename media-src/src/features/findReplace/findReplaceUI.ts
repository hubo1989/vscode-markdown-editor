/**
 * 查找替换 UI 组件
 */

export function createFindReplacePanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.id = 'find-replace-panel'
  panel.className = 'find-replace-panel'
  panel.innerHTML = `
    <div class="find-replace-header">
      <div class="find-replace-title">查找和替换</div>
      <button class="find-replace-close" title="关闭 (Esc)">×</button>
    </div>
    
    <div class="find-replace-body">
      <!-- 查找输入框 -->
      <div class="find-replace-row">
        <input 
          type="text" 
          class="find-input" 
          placeholder="查找"
          spellcheck="false"
        />
        <div class="find-controls">
          <button class="find-prev-btn" title="上一个 (Shift+Enter)">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M8 6l4 4H4z"/>
            </svg>
          </button>
          <button class="find-next-btn" title="下一个 (Enter)">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M8 10L4 6h8z"/>
            </svg>
          </button>
          <span class="find-count">无匹配</span>
        </div>
      </div>
      
      <!-- 替换输入框 -->
      <div class="replace-row" style="display: none;">
        <input 
          type="text" 
          class="replace-input" 
          placeholder="替换为"
          spellcheck="false"
        />
        <div class="replace-controls">
          <button class="replace-btn" title="替换 (Ctrl+Shift+1)">替换</button>
          <button class="replace-all-btn" title="全部替换 (Ctrl+Shift+Enter)">全部替换</button>
        </div>
      </div>
      
      <!-- 选项按钮 -->
      <div class="find-replace-options">
        <button class="option-btn toggle-replace-btn" title="切换替换" data-expanded="false">
          <svg width="16" height="16" viewBox="0 0 16 16" class="arrow-icon">
            <path fill="currentColor" d="M8 11L4 7h8l-4 4z"/>
          </svg>
        </button>
        <button class="option-btn match-case-btn" title="区分大小写 (Alt+C)" data-active="false">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <text x="2" y="12" font-size="12" fill="currentColor">Aa</text>
          </svg>
        </button>
        <button class="option-btn match-whole-word-btn" title="全字匹配 (Alt+W)" data-active="false">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="2" y="4" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <text x="4" y="11" font-size="8" fill="currentColor">ab</text>
          </svg>
        </button>
        <button class="option-btn use-regex-btn" title="使用正则表达式 (Alt+R)" data-active="false">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <text x="2" y="12" font-size="10" fill="currentColor">.*</text>
          </svg>
        </button>
      </div>
    </div>
  `
  
  return panel
}

export function injectFindReplaceStyles(): void {
  const styleId = 'find-replace-styles'
  
  // 避免重复注入
  if (document.getElementById(styleId)) {
    return
  }
  
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    .find-replace-panel {
      position: fixed;
      top: 50px;
      right: 20px;
      width: 420px;
      background: var(--panel-background, #f3f3f3);
      border: 1px solid var(--panel-border, #ccc);
      border-radius: 6px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      display: none;
    }
    
    .find-replace-panel.visible {
      display: block;
      animation: slideInRight 0.2s ease-out;
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .find-replace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--header-background, #e8e8e8);
      border-bottom: 1px solid var(--panel-border, #ccc);
      border-radius: 6px 6px 0 0;
    }
    
    .find-replace-title {
      font-weight: 600;
      color: var(--text-color, #333);
    }
    
    .find-replace-close {
      background: transparent;
      border: none;
      font-size: 24px;
      line-height: 1;
      color: var(--text-color, #666);
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
    }
    
    .find-replace-close:hover {
      background: var(--hover-background, rgba(0, 0, 0, 0.05));
    }
    
    .find-replace-body {
      padding: 12px;
    }
    
    .find-replace-row,
    .replace-row {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    
    .find-input,
    .replace-input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid var(--input-border, #ccc);
      border-radius: 3px;
      font-size: 13px;
      background: var(--input-background, #fff);
      color: var(--text-color, #333);
    }
    
    .find-input:focus,
    .replace-input:focus {
      outline: none;
      border-color: var(--focus-border, #007acc);
      box-shadow: 0 0 0 1px var(--focus-border, #007acc);
    }
    
    .find-controls,
    .replace-controls {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .find-prev-btn,
    .find-next-btn,
    .replace-btn,
    .replace-all-btn {
      padding: 4px 8px;
      border: 1px solid var(--button-border, #ccc);
      border-radius: 3px;
      background: var(--button-background, #fff);
      color: var(--text-color, #333);
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
    
    .find-prev-btn,
    .find-next-btn {
      width: 28px;
      height: 28px;
      padding: 0;
    }
    
    .find-prev-btn:hover,
    .find-next-btn:hover,
    .replace-btn:hover,
    .replace-all-btn:hover {
      background: var(--hover-background, #e8e8e8);
    }
    
    .find-prev-btn:active,
    .find-next-btn:active,
    .replace-btn:active,
    .replace-all-btn:active {
      background: var(--active-background, #d8d8d8);
      transform: scale(0.95);
    }
    
    /* 按钮点击动画效果 */
    .find-prev-btn,
    .find-next-btn,
    .replace-btn,
    .replace-all-btn {
      transition: transform 0.1s ease-in-out, background-color 0.15s ease;
    }
    
    .find-prev-btn:active,
    .find-next-btn:active,
    .replace-btn:active,
    .replace-all-btn:active {
      transform: scale(0.92);
    }
    
    .find-prev-btn:disabled,
    .find-next-btn:disabled,
    .replace-btn:disabled,
    .replace-all-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .find-count {
      font-size: 11px;
      color: var(--secondary-text-color, #666);
      min-width: 50px;
      text-align: center;
    }
    
    .find-replace-options {
      display: flex;
      gap: 4px;
      padding-top: 4px;
      border-top: 1px solid var(--panel-border, #e0e0e0);
    }
    
    .option-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid var(--button-border, #ccc);
      border-radius: 3px;
      background: var(--button-background, #fff);
      color: var(--text-color, #666);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .option-btn:hover {
      background: var(--hover-background, #e8e8e8);
    }
    
    .option-btn[data-active="true"] {
      background: var(--active-background, #007acc);
      color: #fff;
      border-color: var(--active-background, #007acc);
    }
    
    /* 箭头图标旋转动画 */
    .toggle-replace-btn .arrow-icon {
      transition: transform 0.2s ease;
    }
    
    .toggle-replace-btn[data-expanded="true"] .arrow-icon {
      transform: rotate(180deg);
    }
    
    /* 查找结果高亮样式 */
    .find-highlight {
      background-color: rgba(255, 200, 0, 0.3);
      border-radius: 2px;
    }
    
    .find-highlight-current {
      background-color: rgba(255, 153, 0, 0.5);
      border-radius: 2px;
      box-shadow: 0 0 0 1px rgba(255, 153, 0, 0.8);
    }
    
    /* Dark theme support */
    body.vscode-dark .find-replace-panel {
      --panel-background: #252526;
      --panel-border: #3e3e42;
      --header-background: #2d2d30;
      --text-color: #cccccc;
      --input-background: #3c3c3c;
      --input-border: #3e3e42;
      --button-background: #333333;
      --button-border: #3e3e42;
      --hover-background: #2a2d2e;
      --active-background: #094771;
      --focus-border: #007acc;
      --secondary-text-color: #999;
    }
    
    /* High contrast theme support */
    body.vscode-high-contrast .find-replace-panel {
      --panel-background: #000;
      --panel-border: #6fc3df;
      --header-background: #000;
      --text-color: #fff;
      --input-background: #000;
      --input-border: #6fc3df;
      --button-background: #000;
      --button-border: #6fc3df;
      --hover-background: #2a2d2e;
      --active-background: #007acc;
      --focus-border: #f38518;
    }
  `
  
  document.head.appendChild(style)
}
