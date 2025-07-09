/**
 * 链接处理模块
 */
import { sendMessageToVSCode } from './common';

/**
 * 修复链接点击行为，将链接点击转发到VS Code处理
 */
export function setupLinkHandler(): void {
  // 处理链接点击事件
  const openLink = (url: string): void => {
    sendMessageToVSCode({ command: 'open-link', href: url });
  };

  // 添加全局点击事件监听
  document.addEventListener('click', (e: MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.tagName === 'A') {
      e.preventDefault();
      openLink((el as HTMLAnchorElement).href);
    }
  });

  // 拦截window.open方法
  const originalOpen = window.open;
  window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
    if (url) {
      openLink(url.toString());
      return window;
    }
    return originalOpen.apply(window, [url, target, features]);
  };
}
