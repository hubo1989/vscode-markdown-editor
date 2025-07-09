/**
 * 工具函数模块
 */
import $ from 'jquery';
require('jquery-confirm')(window, $);
import 'jquery-confirm/css/jquery-confirm.css';
import { VSCodeMessage } from '../types';

/**
 * 创建确认对话框
 * @param msg 消息内容
 * @param onOk 确认回调
 */
export function confirm(msg: string, onOk: () => void): void {
  $.confirm({
    title: '',
    animation: 'top',
    closeAnimation: 'top',
    animateFromElement: false,
    boxWidth: '300px',
    useBootstrap: false,
    content: msg,
    buttons: {
      cancel: {
        text: 'Cancel',
      },
      confirm: {
        text: 'Confirm',
        action: onOk,
      },
    },
  });
}

/**
 * 文件转Base64编码
 * @param file 文件对象
 * @returns Promise<string> Base64编码字符串
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (evt) {
      if (evt.target) {
        resolve(evt.target.result?.toString().split(',')[1] || '');
      } else {
        reject(new Error('无法读取文件'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 向VS Code发送消息
 * @param message 消息对象
 */
export function sendMessageToVSCode(message: VSCodeMessage): void {
  if (window.vscode) {
    window.vscode.postMessage(message);
  }
}

/**
 * 修复剪切功能
 * 解决document.execCommand()递归调用的问题
 */
export function fixCut(): void {
  const _exec = document.execCommand.bind(document);
  document.execCommand = (cmd: string, ...args: any[]): boolean => {
    if (cmd === 'delete') {
      setTimeout(() => {
        return _exec(cmd, ...args);
      });
      return true;
    } else {
      return _exec(cmd, ...args);
    }
  };
}
