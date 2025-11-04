/**
 * 编辑器初始化模块
 */
import { merge } from 'lodash';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { EditorOptions, UpdateMessage } from '../types';
import { setupThemeHandler, setupToolbarClickHandler } from './editorConfig';
import { setupPanelHoverEffects } from '../components/panelHover';
import { setupTableFeatures } from '../features/table/tableEditor';
import { toolbar } from '../features/toolbar/toolbarConfig';
import { createUploadConfig } from '../features/upload/uploadHandler';
import { sendMessageToVSCode } from '../utils/common';
import { initImageResize } from '../features/image/imageResize';

// 输入节流定时器
let inputTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 初始化Vditor编辑器
 * @param message 初始化消息
 */
export function initVditor(message: UpdateMessage): void {
  console.log('Initializing Vditor with:', message);
  
  // 清除旧的输入定时器
  if (inputTimer) {
    clearTimeout(inputTimer);
    inputTimer = null;
  }
  
  // 准备默认选项
  let defaultOptions: any = {};
  
  // 处理暗色主题
  if (message.theme === 'dark') {
    defaultOptions = merge(defaultOptions, {
      theme: 'dark',
      preview: {
        theme: {
          current: 'dark',
        },
      }
    });
  }
  
  // 合并用户选项和默认选项
  defaultOptions = merge(defaultOptions, message.options, {
    preview: {
      math: {
        inlineDigit: true,
        macros: {
          "\\f": "#1f(#2)",
        },
        engine: 'KaTeX', // 使用 KaTeX 渲染数学公式
      },
      // 启用图表支持
      mermaid: true,
      echarts: true,
      abc: true, // ABC 记谱法（五线谱）
      plantuml: true,
      // 启用代码块渲染优化
      cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.11.2',
      // 启用图表渲染引擎
      chart: true,
      // 启用流程图
      flowchart: true,
      // 启用序列图
      sequence: true,
      // PlantUML 特定配置 - 尝试使用本地渲染
      plantumlServer: 'https://www.plantuml.com/plantuml/png/',
      // PlantUML 备用服务器
      plantumlServerList: [
        'https://www.plantuml.com/plantuml/png/',
        'https://plantuml-server.kkeisuke.app/png/',
        'http://www.plantuml.com/plantuml/png/'
      ],
      // 启用图表渲染模式
      mode: 'both',
      // PlantUML 渲染配置
      plantumlRenderMode: 'local',
      // 启用 markdown 渲染扩展
      markdown: {
        autoSpace: false,
        gfmAutoLink: true,
        breaks: true,
        chinesePunct: true,
        paragraphBeginningSpace: false,
        sanitize: false
      },
      // 启用代码块主题
      code: {
        theme: 'github',
        lineNumber: false
      }
    },
    // 启用上传配置
    upload: createUploadConfig(),
    // 启用缓存配置
    cache: { enable: false },
    // 启用编辑器插件
    plugins: [
      // 可以在这里添加自定义插件
    ],
    // 启用扩展配置
    ext: true, // 启用 vditor 扩展
    // 启用代码块扩展
    code: {
      lineNumber: false,
      theme: 'auto'
    }
  });
  
  // 处理主题颜色样式
  if (message.options && message.options.useVscodeThemeColor) {
    document.body.setAttribute('data-use-vscode-theme-color', '1');
  } else {
    document.body.setAttribute('data-use-vscode-theme-color', '0');
  }
  
  // 如果已有编辑器实例，先销毁
  if (window.vditor) {
    window.vditor.destroy();
    window.vditor = null;
  }
  
  // 创建新的编辑器实例
  try {
    window.vditor = new Vditor('app', {
      width: '100%',
      height: '100%',
      minHeight: '100%',
      lang: navigator.language.replace('-', '_'),
      value: message.content,
      mode: 'ir',
      cache: { enable: false },
      toolbar,
      toolbarConfig: { 
        pin: true,
        hide: message.options?.showToolbar === false
      },
      outline: {
        enable: message.options?.showOutlineByDefault ?? false,
        position: message.options?.outlinePosition ?? 'left'
      },
      ...defaultOptions,
      after() {
        // 初始化后的设置
        setupThemeHandler();
        setupToolbarClickHandler();
        setupTableFeatures();
        setupPanelHoverEffects();
        
        // 初始化图片调整大小功能
        setTimeout(() => {
          initImageResize();
        }, 100);
        
        // 调试工具栏设置
        console.log('Toolbar config after init:', {
          showToolbar: message.options?.showToolbar,
          hide: window.vditor.vditor.options.toolbarConfig.hide
        });
        
        // 确保工具栏状态与设置一致
        const toolbar = document.querySelector('.vditor-toolbar');
        if (toolbar && message.options?.showToolbar === false) {
          toolbar.classList.add('vditor-toolbar--hide');
          toolbar.setAttribute('style', 'display: none !important');
        }
      },
      input() {
        // 处理输入事件，添加节流
        if (inputTimer) {
          clearTimeout(inputTimer);
        }
        
        inputTimer = setTimeout(() => {
          sendMessageToVSCode({
            command: 'edit',
            content: window.vditor.getValue()
          });
        }, 100);
      },
      upload: createUploadConfig()
    });
    
    console.log('Vditor initialized successfully');
  } catch (error) {
    // 出错时重置为简单配置
    console.error('Error initializing Vditor:', error);
    
    window.vditor = new Vditor('app', {
      width: '100%',
      height: '100%',
      value: message.content,
      mode: 'ir',
      cache: { enable: false },
      after: () => console.log('Fallback Vditor initialized'),
    });
  }
}
