/**
 * 预加载脚本
 * 处理全局对象和VS Code API
 */

// 修复全局对象
window['global'] = window['global'] || globalThis;

// 获取VS Code API
window.vscode = (window as any).acquireVsCodeApi && (window as any).acquireVsCodeApi();
