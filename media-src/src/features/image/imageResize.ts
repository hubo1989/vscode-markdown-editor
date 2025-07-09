/**
 * 图片大小调整功能
 * 在 Vditor 所见即所得模式下支持鼠标拖拽调整图片大小
 */

import { sendMessageToVSCode } from '../../utils/common';

interface ResizeHandle {
  element: HTMLElement;
  direction: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number;
  direction: string;
  image: HTMLImageElement;
  resizeContainer: HTMLElement;
}

let resizeState: ResizeState | null = null;
let activeImage: HTMLImageElement | null = null;
let resizeContainer: HTMLElement | null = null;

/**
 * 初始化图片大小调整功能
 */
export function initImageResize(): void {
  console.log('初始化图片大小调整功能');
  
  // 添加全局样式
  addGlobalStyles();
  
  // 延迟初始化，确保 Vditor 完全加载
  setTimeout(() => {
    setupImageResizeHandlers();
    
    // 监听编辑器内容变化，重新绑定事件
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'IMG' || element.querySelector('img')) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        console.log('Content changed, re-setting up image handlers');
        setTimeout(() => setupImageResizeHandlers(), 100);
      }
    });
    
    // 监听多个可能的内容容器
    const containers = [
      '.vditor-ir',
      '.vditor-wysiwyg',
      '.vditor-sv',
      '.vditor-reset'
    ];
    
    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`观察容器: ${selector}`);
        observer.observe(container, {
          childList: true,
          subtree: true
        });
      }
    });
  }, 500);
  
  // 监听全局鼠标事件
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('click', handleDocumentClick);
}

/**
 * 添加全局样式
 */
function addGlobalStyles(): void {
  const styleId = 'image-resize-styles';
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* 图片调整大小时的全局样式 */
    body.image-resizing {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }
    
    /* 防止图片拖拽 */
    .vditor-ir img,
    .vditor-wysiwyg img {
      user-drag: none;
      -webkit-user-drag: none;
      -moz-user-drag: none;
      -ms-user-drag: none;
      display: block;
      margin: 4px auto;
    }
    
    /* 图片边缘检测时的样式 */
    .vditor-ir img[data-on-edge="true"],
    .vditor-wysiwyg img[data-on-edge="true"] {
      outline: 1px solid rgba(74, 144, 226, 0.5) !important;
    }
    
    /* 调整大小容器样式 */
    .image-resize-container {
      transition: all 0.1s ease;
      background: rgba(74, 144, 226, 0.1) !important;
      border: 2px solid rgba(74, 144, 226, 0.8) !important;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * 处理图片鼠标移动事件 - 检测是否在边缘
 */
function handleImageMouseMove(image: HTMLImageElement, event: MouseEvent): void {
  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 边缘检测区域的宽度（像素）
  const edgeSize = 10;
  
  // 检测是否在边缘
  const isOnEdge = (
    x <= edgeSize || // 左边缘
    y <= edgeSize || // 上边缘
    x >= rect.width - edgeSize || // 右边缘
    y >= rect.height - edgeSize // 下边缘
  );
  
  if (isOnEdge) {
    // 在边缘，设置拖拽光标
    const direction = getResizeDirection(image, event);
    if (direction) {
      const cursor = getResizeCursor(direction);
      image.style.cursor = cursor;
      image.dataset.onEdge = 'true';
      
      // 显示细微的边框提示（可选）
      image.style.outline = '1px solid rgba(74, 144, 226, 0.5)';
    }
  } else {
    // 不在边缘，恢复正常状态
    image.style.cursor = '';
    image.style.outline = '';
    image.dataset.onEdge = 'false';
  }
}

/**
 * 获取调整大小方向
 */
function getResizeDirection(image: HTMLImageElement, event: MouseEvent): string | null {
  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 边缘检测区域的宽度
  const edgeSize = 10;
  
  // 角落优先级最高
  if (x <= edgeSize && y <= edgeSize) return 'nw';
  if (x >= rect.width - edgeSize && y <= edgeSize) return 'ne';
  if (x <= edgeSize && y >= rect.height - edgeSize) return 'sw';
  if (x >= rect.width - edgeSize && y >= rect.height - edgeSize) return 'se';
  
  // 边缘
  if (x <= edgeSize) return 'w';
  if (x >= rect.width - edgeSize) return 'e';
  if (y <= edgeSize) return 'n';
  if (y >= rect.height - edgeSize) return 's';
  
  return null;
}

/**
 * 根据方向获取光标样式
 */
function getResizeCursor(direction: string): string {
  switch (direction) {
    case 'nw':
    case 'se':
      return 'nw-resize';
    case 'ne':
    case 'sw':
      return 'ne-resize';
    case 'n':
    case 's':
      return 'n-resize';
    case 'e':
    case 'w':
      return 'e-resize';
    default:
      return 'default';
  }
}

/**
 * 设置图片调整大小处理器
 */
function setupImageResizeHandlers(): void {
  console.log('Setting up image resize handlers...');
  
  // 获取所有在 IR 模式下的图片元素
  const images = document.querySelectorAll('.vditor-ir img, .vditor-wysiwyg img');
  
  console.log(`Found ${images.length} images`);
  
  images.forEach((img, index) => {
    const imageElement = img as HTMLImageElement;
    
    // 避免重复绑定
    if (imageElement.dataset.resizeEnabled === 'true') {
      return;
    }
    
    console.log(`Setting up image ${index + 1}:`, imageElement.src);
    
    imageElement.dataset.resizeEnabled = 'true';
    
    // 绑定鼠标移动事件来检测边缘
    imageElement.addEventListener('mousemove', (e) => {
      handleImageMouseMove(imageElement, e);
    });
    
    imageElement.addEventListener('mouseleave', (e) => {
      console.log('Mouse leave image:', imageElement.src);
      // 恢复图片的正常状态
      imageElement.style.cursor = '';
      
      // 清除边缘状态
      imageElement.dataset.onEdge = 'false';
      
      setTimeout(() => {
        if (!resizeState?.isResizing) {
          hideResizeHandles(imageElement);
        }
      }, 100);
    });
    
    imageElement.addEventListener('click', (e) => {
      console.log('Click image:', imageElement.src);
      
      // 如果正在拖拽，不处理点击事件
      if (resizeState?.isResizing) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // 如果鼠标在边缘，禁用点击
      if (imageElement.dataset.onEdge === 'true') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      e.stopPropagation();
      selectImage(imageElement);
    });
    
    // 绑定鼠标按下事件来开始拖拽
    imageElement.addEventListener('mousedown', (e) => {
      // 只有在边缘才能开始拖拽
      if (imageElement.dataset.onEdge === 'true') {
        const direction = getResizeDirection(imageElement, e);
        if (direction) {
          e.preventDefault();
          e.stopPropagation();
          startResize(imageElement, direction, e);
        }
      }
    });
  });
}

/**
 * 隐藏调整大小手柄
 */
function hideResizeHandles(image: HTMLImageElement): void {
  // 这个函数现在只是清理图片状态，不再需要处理调整手柄
  if (activeImage === image) {
    activeImage = null;
    
    // 恢复图片的正常状态
    image.style.cursor = '';
    image.style.outline = '';
    image.dataset.onEdge = 'false';
    
    // 恢复全局光标
    document.body.style.cursor = '';
  }
}

/**
 * 隐藏所有调整大小手柄
 */
function hideAllResizeHandles(): void {
  if (activeImage) {
    hideResizeHandles(activeImage);
  }
}

/**
 * 选择图片
 */
function selectImage(image: HTMLImageElement): void {
  // 不再显示蓝色遮罩，只在边缘处理拖拽
  console.log('Image selected:', image.src);
}

/**
 * 开始调整大小
 */
function startResize(image: HTMLImageElement, direction: string, event: MouseEvent): void {
  const rect = image.getBoundingClientRect();
  
  // 确定cursor样式
  let cursor = 'nw-resize';
  switch (direction) {
    case 'nw':
    case 'se':
      cursor = 'nw-resize';
      break;
    case 'ne':
    case 'sw':
      cursor = 'ne-resize';
      break;
    case 'n':
    case 's':
      cursor = 'n-resize';
      break;
    case 'e':
    case 'w':
      cursor = 'e-resize';
      break;
  }
  
  // 创建临时的调整容器用于显示边框（可选）
  const tempContainer = document.createElement('div');
  tempContainer.className = 'image-resize-container';
  tempContainer.style.cssText = `
    position: absolute;
    border: 2px solid rgba(74, 144, 226, 0.8);
    pointer-events: none;
    z-index: 1000;
    box-sizing: border-box;
    background: rgba(74, 144, 226, 0.1);
  `;
  
  // 定位容器
  updateResizeContainer(image, tempContainer);
  document.body.appendChild(tempContainer);
  
  resizeState = {
    isResizing: true,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: rect.width,
    startHeight: rect.height,
    aspectRatio: rect.width / rect.height,
    direction,
    image,
    resizeContainer: tempContainer
  };
  
  // 添加调整大小时的样式到整个文档
  document.body.classList.add('image-resizing');
  document.body.style.cursor = cursor + ' !important';
  document.body.style.userSelect = 'none';
  
  // 给图片添加拖拽状态样式
  image.style.cursor = cursor + ' !important';
  image.style.pointerEvents = 'none';
  
  // 阻止默认行为
  event.preventDefault();
  event.stopPropagation();
}

/**
 * 更新调整大小容器位置
 */
function updateResizeContainer(image: HTMLImageElement, container: HTMLElement): void {
  const rect = image.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  container.style.left = `${rect.left + scrollLeft}px`;
  container.style.top = `${rect.top + scrollTop}px`;
  container.style.width = `${rect.width}px`;
  container.style.height = `${rect.height}px`;
}

/**
 * 处理鼠标移动
 */
function handleMouseMove(event: MouseEvent): void {
  if (!resizeState?.isResizing) return;
  
  const { startX, startY, startWidth, startHeight, aspectRatio, direction, image } = resizeState;
  
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  
  let newWidth = startWidth;
  let newHeight = startHeight;
  
  // 根据方向计算新的尺寸
  switch (direction) {
    case 'se':
      newWidth = startWidth + deltaX;
      newHeight = startHeight + deltaY;
      break;
    case 'sw':
      newWidth = startWidth - deltaX;
      newHeight = startHeight + deltaY;
      break;
    case 'ne':
      newWidth = startWidth + deltaX;
      newHeight = startHeight - deltaY;
      break;
    case 'nw':
      newWidth = startWidth - deltaX;
      newHeight = startHeight - deltaY;
      break;
    case 'e':
      newWidth = startWidth + deltaX;
      newHeight = newWidth / aspectRatio;
      break;
    case 'w':
      newWidth = startWidth - deltaX;
      newHeight = newWidth / aspectRatio;
      break;
    case 's':
      newHeight = startHeight + deltaY;
      newWidth = newHeight * aspectRatio;
      break;
    case 'n':
      newHeight = startHeight - deltaY;
      newWidth = newHeight * aspectRatio;
      break;
  }
  
  // 保持宽高比（当按住 Shift 键时或者从角落拖拽时）
  if (event.shiftKey || ['nw', 'ne', 'sw', 'se'].includes(direction)) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newHeight = newWidth / aspectRatio;
    } else {
      newWidth = newHeight * aspectRatio;
    }
  }
  
  // 设置最小尺寸
  const minSize = 20;
  newWidth = Math.max(minSize, newWidth);
  newHeight = Math.max(minSize, newHeight);
  
  // 设置最大尺寸（不超过容器）
  const container = image.closest('.vditor-ir');
  if (container) {
    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - 40; // 留一些边距
    const maxHeight = containerRect.height - 40;
    
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
  }
  
  // 应用新尺寸
  image.style.width = `${newWidth}px`;
  image.style.height = `${newHeight}px`;
  
  // 更新容器位置
  updateResizeContainer(image, resizeState.resizeContainer);
}

/**
 * 处理鼠标松开
 */
function handleMouseUp(event: MouseEvent): void {
  if (!resizeState?.isResizing) return;
  
  const { image, resizeContainer } = resizeState;
  
  console.log('拖拽结束，开始更新图片尺寸');
  
  // 获取最终的尺寸
  const finalWidth = Math.round(parseFloat(image.style.width));
  const finalHeight = Math.round(parseFloat(image.style.height));
  
  console.log(`最终尺寸: ${finalWidth}x${finalHeight}`);
  
  // 更新图片的属性
  image.setAttribute('width', finalWidth.toString());
  image.setAttribute('height', finalHeight.toString());
  
  // 清理临时容器
  if (resizeContainer) {
    resizeContainer.remove();
  }
  
  // 清理调整大小状态
  resizeState = null;
  
  // 恢复所有样式
  document.body.classList.remove('image-resizing');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // 恢复图片样式
  image.style.cursor = '';
  image.style.pointerEvents = '';
  image.style.outline = '';
  image.dataset.onEdge = 'false';
  
  // 更新 Markdown 内容
  updateMarkdownImageSize(image);
  
  console.log('Resize completed');
}

/**
 * 更新 Markdown 中的图片尺寸
 */
function updateMarkdownImageSize(image: HTMLImageElement): void {
  console.log('开始更新图片尺寸到 Markdown');
  
  if (!window.vditor) {
    console.warn('window.vditor 不存在，无法更新内容');
    return;
  }
  
  // 获取图片的新尺寸
  const width = Math.round(parseFloat(image.style.width));
  const height = Math.round(parseFloat(image.style.height));
  
  console.log(`新的图片尺寸: ${width}x${height}`);
  
  // 获取当前的 Markdown 内容
  const content = window.vditor.getValue();
  
  // 获取图片的 src 属性
  const src = image.getAttribute('src') || '';
  const alt = image.getAttribute('alt') || '';
  
  console.log(`图片信息: src="${src}", alt="${alt}"`);
  
  // 生成新的 HTML 标签
  const newImgTag = `<img src="${src}" alt="${alt}" width="${width}" height="${height}">`;
  
  // 创建正则表达式来匹配图片
  const imgRegex = new RegExp(`<img[^>]*src=["']?${escapeRegExp(src)}["']?[^>]*>`, 'g');
  const markdownImgRegex = new RegExp(`!\\[${escapeRegExp(alt)}\\]\\(${escapeRegExp(src)}\\)`, 'g');
  
  let newContent = content;
  
  // 替换现有的 HTML 图片标签
  if (imgRegex.test(content)) {
    console.log('找到 HTML 图片标签，进行替换');
    newContent = content.replace(imgRegex, newImgTag);
  }
  // 替换 Markdown 格式的图片
  else if (markdownImgRegex.test(content)) {
    console.log('找到 Markdown 图片语法，进行替换');
    newContent = content.replace(markdownImgRegex, newImgTag);
  }
  else {
    console.log('未找到匹配的图片标签，尝试其他方式');
    // 如果找不到匹配的标签，尝试更宽松的匹配
    const looseSrcRegex = new RegExp(`<img[^>]*src=["']?[^"']*${escapeRegExp(src.split('/').pop() || '')}[^"']*["']?[^>]*>`, 'g');
    if (looseSrcRegex.test(content)) {
      console.log('使用宽松匹配找到图片标签');
      newContent = content.replace(looseSrcRegex, newImgTag);
    }
  }
  
  // 如果内容有变化，更新 Vditor
  if (newContent !== content) {
    console.log('内容已更改，更新 Vditor');
    window.vditor.setValue(newContent);
    
    // 直接触发与用户输入相同的同步逻辑
    setTimeout(() => {
      if (window.vditor) {
        // 发送 edit 消消息到 VS Code，与用户输入时使用相同的逻辑
        sendMessageToVSCode({
          command: 'edit',
          content: newContent
        });
        
        console.log('已发送 edit 消息到 VS Code');
      }
    }, 100);
  } else {
    console.log('内容未发生变化');
  }
}

/**
 * 转义正则表达式中的特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 处理文档点击事件
 */
function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  
  // 如果点击的不是图片或调整手柄，隐藏所有调整手柄
  if (!target.closest('img') && !target.closest('.image-resize-container')) {
    hideAllResizeHandles();
  }
}

/**
 * 清理调整大小功能
 */
export function cleanupImageResize(): void {
  hideAllResizeHandles();
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('click', handleDocumentClick);
  
  // 清理所有图片的调整大小标记
  const images = document.querySelectorAll('img[data-resize-enabled="true"]');
  images.forEach(img => {
    delete (img as HTMLImageElement).dataset.resizeEnabled;
  });
}

/**
 * 手动触发图片调整大小设置（用于调试）
 */
export function debugImageResize(): void {
  console.log('=== 调试图片调整大小功能 ===');
  
  // 检查 Vditor 是否存在
  if (!window.vditor) {
    console.log('❌ window.vditor 不存在');
    return;
  }
  
  console.log('✅ window.vditor 存在');
  
  // 检查容器
  const containers = ['.vditor-ir', '.vditor-wysiwyg', '.vditor-sv'];
  containers.forEach(selector => {
    const container = document.querySelector(selector);
    console.log(`${selector}: ${container ? '✅ 存在' : '❌ 不存在'}`);
  });
  
  // 检查图片
  const images = document.querySelectorAll('img');
  console.log(`总共找到 ${images.length} 个图片`);
  
  images.forEach((img, index) => {
    console.log(`图片 ${index + 1}: ${img.src}`);
    console.log(`  - 父元素: ${img.parentElement?.tagName}`);
    console.log(`  - 类名: ${img.className}`);
    console.log(`  - 调整大小已启用: ${(img as HTMLImageElement).dataset.resizeEnabled}`);
  });
  
  // 重新设置处理器
  setupImageResizeHandlers();
}
