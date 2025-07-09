/**
 * 图片大小调整功能
 * 在 Vditor 所见即所得模式下支持鼠标拖拽调整图片大小
 */

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
    
    // 绑定鼠标事件
    imageElement.addEventListener('mouseenter', () => {
      console.log('Mouse enter image:', imageElement.src);
      showResizeHandles(imageElement);
    });
    
    imageElement.addEventListener('mouseleave', (e) => {
      console.log('Mouse leave image:', imageElement.src);
      // 延迟隐藏，允许鼠标移动到调整手柄
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
      e.stopPropagation();
      selectImage(imageElement);
    });
  });
}

/**
 * 显示调整大小手柄
 */
function showResizeHandles(image: HTMLImageElement): void {
  console.log('Showing resize handles for image:', image.src);
  
  hideAllResizeHandles();
  
  // 创建调整大小容器
  const container = document.createElement('div');
  container.className = 'image-resize-container';
  container.style.cssText = `
    position: absolute;
    border: none;
    pointer-events: none;
    z-index: 1000;
    box-sizing: border-box;
  `;
  
  // 创建调整手柄
  const handles: ResizeHandle[] = [
    { element: createHandle('nw'), direction: 'nw' },
    { element: createHandle('ne'), direction: 'ne' },
    { element: createHandle('sw'), direction: 'sw' },
    { element: createHandle('se'), direction: 'se' },
    { element: createHandle('n'), direction: 'n' },
    { element: createHandle('s'), direction: 's' },
    { element: createHandle('e'), direction: 'e' },
    { element: createHandle('w'), direction: 'w' }
  ];
  
  handles.forEach(handle => {
    container.appendChild(handle.element);
    handle.element.addEventListener('mousedown', (e) => {
      console.log('Handle mousedown:', handle.direction);
      e.preventDefault();
      e.stopPropagation();
      startResize(image, handle.direction, e);
    });
  });
  
  // 定位容器
  updateResizeContainer(image, container);
  
  // 添加到文档
  document.body.appendChild(container);
  
  resizeContainer = container;
  activeImage = image;
  
  console.log('Resize handles created and positioned');
}

/**
 * 创建调整手柄
 */
function createHandle(direction: string): HTMLElement {
  const handle = document.createElement('div');
  handle.className = `resize-handle resize-handle-${direction}`;
  
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
  
  handle.style.cssText = `
    position: absolute;
    background: transparent;
    border: none;
    pointer-events: all;
    cursor: ${cursor};
    box-sizing: border-box;
  `;
  
  // 定位手柄 - 增加拖拽区域的大小，但保持透明
  switch (direction) {
    case 'nw':
      handle.style.top = handle.style.left = '-10px';
      handle.style.width = handle.style.height = '20px';
      break;
    case 'ne':
      handle.style.top = handle.style.right = '-10px';
      handle.style.width = handle.style.height = '20px';
      break;
    case 'sw':
      handle.style.bottom = handle.style.left = '-10px';
      handle.style.width = handle.style.height = '20px';
      break;
    case 'se':
      handle.style.bottom = handle.style.right = '-10px';
      handle.style.width = handle.style.height = '20px';
      break;
    case 'n':
      handle.style.top = '-10px';
      handle.style.left = '10px';
      handle.style.right = '10px';
      handle.style.height = '20px';
      break;
    case 's':
      handle.style.bottom = '-10px';
      handle.style.left = '10px';
      handle.style.right = '10px';
      handle.style.height = '20px';
      break;
    case 'e':
      handle.style.right = '-10px';
      handle.style.top = '10px';
      handle.style.bottom = '10px';
      handle.style.width = '20px';
      break;
    case 'w':
      handle.style.left = '-10px';
      handle.style.top = '10px';
      handle.style.bottom = '10px';
      handle.style.width = '20px';
      break;
  }
  
  return handle;
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
 * 隐藏调整大小手柄
 */
function hideResizeHandles(image: HTMLImageElement): void {
  if (resizeContainer && activeImage === image) {
    resizeContainer.remove();
    resizeContainer = null;
    activeImage = null;
  }
}

/**
 * 隐藏所有调整大小手柄
 */
function hideAllResizeHandles(): void {
  if (resizeContainer) {
    resizeContainer.remove();
    resizeContainer = null;
    activeImage = null;
  }
}

/**
 * 选择图片
 */
function selectImage(image: HTMLImageElement): void {
  hideAllResizeHandles();
  showResizeHandles(image);
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
  
  resizeState = {
    isResizing: true,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: rect.width,
    startHeight: rect.height,
    aspectRatio: rect.width / rect.height,
    direction,
    image,
    resizeContainer: resizeContainer!
  };
  
  // 添加调整大小时的样式到整个文档
  document.body.classList.add('image-resizing');
  document.body.style.cursor = cursor + ' !important';
  document.body.style.userSelect = 'none';
  
  // 给图片添加拖拽状态样式
  image.style.cursor = cursor + ' !important';
  image.style.pointerEvents = 'none';
  
  // 给调整容器添加拖拽状态
  if (resizeContainer) {
    resizeContainer.style.cursor = cursor + ' !important';
  }
  
  // 阻止默认行为
  event.preventDefault();
  event.stopPropagation();
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
  
  const { image } = resizeState;
  
  // 清理调整大小状态
  resizeState = null;
  
  // 恢复所有样式
  document.body.classList.remove('image-resizing');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // 恢复图片样式
  image.style.cursor = '';
  image.style.pointerEvents = '';
  
  // 恢复调整容器样式
  if (resizeContainer) {
    resizeContainer.style.cursor = '';
  }
  
  // 更新 Markdown 内容
  updateMarkdownImageSize(image);
}

/**
 * 更新 Markdown 中的图片尺寸
 */
function updateMarkdownImageSize(image: HTMLImageElement): void {
  if (!window.vditor) return;
  
  // 获取图片的新尺寸
  const width = Math.round(parseFloat(image.style.width));
  const height = Math.round(parseFloat(image.style.height));
  
  // 获取当前的 Markdown 内容
  const content = window.vditor.getValue();
  
  // 获取图片的 src 属性
  const src = image.getAttribute('src') || '';
  const alt = image.getAttribute('alt') || '';
  
  // 生成新的 HTML 标签
  const newImgTag = `<img src="${src}" alt="${alt}" width="${width}" height="${height}">`;
  
  // 创建正则表达式来匹配图片
  const imgRegex = new RegExp(`<img[^>]*src=["']?${escapeRegExp(src)}["']?[^>]*>`, 'g');
  const markdownImgRegex = new RegExp(`!\\[${escapeRegExp(alt)}\\]\\(${escapeRegExp(src)}\\)`, 'g');
  
  let newContent = content;
  
  // 替换现有的 HTML 图片标签
  if (imgRegex.test(content)) {
    newContent = content.replace(imgRegex, newImgTag);
  }
  // 替换 Markdown 格式的图片
  else if (markdownImgRegex.test(content)) {
    newContent = content.replace(markdownImgRegex, newImgTag);
  }
  
  // 如果内容有变化，更新 Vditor
  if (newContent !== content) {
    window.vditor.setValue(newContent);
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

// 将调试函数添加到 window 对象，方便控制台调用
(window as any).debugImageResize = debugImageResize;
