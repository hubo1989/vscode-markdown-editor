/**
 * 主应用入口
 */
import './preload';
import './styles/main.css'

import { fixCut } from './utils/common';
import { setupLinkHandler } from './utils/linkHandler';
import { initVditor } from './core/editorInit';
import { handleUploadedFiles } from './features/upload/uploadHandler';
import { sendMessageToVSCode } from './utils/common';
import { UpdateMessage } from './types';

/**
 * 初始化应用
 */
function initializeApp(): void {
  // 设置链接点击处理
  setupLinkHandler();
  
  // 修复剪切功能
  fixCut();
  
  // 处理消息事件
  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;
    
    switch (message.command) {
      case 'update': {
        if (message.type === 'init') {
          try {
            // 初始化编辑器
            initVditor(message as UpdateMessage);
          } catch (error) {
            console.error('Error initializing editor:', error);
            // 重置为简单配置
            initVditor({
              command: 'update',
              type: 'init',
              content: message.content,
              options: {}
            });
          }
        } else {
          // 更新内容
          if (window.vditor) {
            window.vditor.setValue(message.content);
          }
        }
        break;
      }
      
      case 'uploaded': {
        // 处理上传成功后的文件
        if (message.files && Array.isArray(message.files)) {
          handleUploadedFiles(message.files);
        }
        break;
      }
      
      case 'config-update': {
        // 处理配置更新
        if (message.config && window.vditor) {
          // 更新工具栏显示/隐藏状态
          if (message.config.showToolbar !== undefined) {
            try {
              console.log('Updating toolbar visibility:', message.config.showToolbar);
              
              // 更新选项
              window.vditor.vditor.options.toolbarConfig.hide = !message.config.showToolbar;
              
              // 直接重新初始化工具栏
              const toolbar = document.querySelector('.vditor-toolbar');
              if (toolbar) {
                if (message.config.showToolbar) {
                  // 显示工具栏
                  toolbar.classList.remove('vditor-toolbar--hide');
                  toolbar.setAttribute('style', 'display: block !important');
                } else {
                  // 隐藏工具栏
                  toolbar.classList.add('vditor-toolbar--hide');
                  toolbar.setAttribute('style', 'display: none !important');
                }
              }
            } catch (error) {
              console.error('Error updating toolbar visibility:', error);
            }
          }
          
          // 其他配置更新可以在这里处理
        }
        break;
      }
      
      default:
        // 忽略其他消息
        break;
    }
  });
  
  // 通知VS Code扩展准备就绪
  sendMessageToVSCode({ command: 'ready' });
}

// 启动应用
initializeApp();
