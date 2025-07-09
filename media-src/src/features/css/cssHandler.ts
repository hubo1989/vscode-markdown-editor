/**
 * CSS处理模块
 * 负责处理动态CSS更新和加载
 */

/**
 * 根据CSS文件路径查找对应的link标签
 * @param cssFile CSS文件路径
 * @returns 找到的link元素或undefined
 */
export function findCssLinkTag(cssFile: string): HTMLLinkElement | undefined {
  // 获取所有link标签
  const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
  
  // 规范化路径，统一使用正斜杠
  const normalizedCssFile = cssFile.replace(/\\/g, '/');
  
  // 提取CSS文件名，忽略路径
  const cssFileName = normalizedCssFile.split('/').pop() || '';
  console.log(`Looking for CSS file: ${cssFileName}, normalized path: ${normalizedCssFile}`);
  
  // 首先尝试通过data-source属性匹配
  for (let i = 0; i < linkTags.length; i++) {
    const link = linkTags[i] as HTMLLinkElement;
    const dataSource = link.getAttribute('data-source');
    
    if (dataSource && (
        dataSource === cssFile || 
        dataSource === normalizedCssFile || 
        dataSource.endsWith(`/${cssFileName}`)
      )) {
      console.log(`Found matching link by data-source: ${link.href}`);
      return link;
    }
  }
  
  // 如果通过data-source找不到，尝试通过href匹配
  for (let i = 0; i < linkTags.length; i++) {
    const link = linkTags[i] as HTMLLinkElement;
    console.log(`Checking link: ${link.href}`);
    
    // 通过URL对象解析href，提取路径部分
    try {
      const url = new URL(link.href);
      const pathParts = url.pathname.split('/');
      const urlFileName = pathParts.pop() || '';
      
      // 1. 检查完整路径匹配
      if (link.href.includes(normalizedCssFile)) {
        console.log(`Found matching link by path: ${link.href}`);
        return link;
      }
      
      // 2. 检查文件名匹配（忽略查询参数）
      if (urlFileName === cssFileName || 
          urlFileName.startsWith(cssFileName + '?')) {
        console.log(`Found matching link by filename: ${link.href}`);
        return link;
      }
    } catch (e) {
      // 如果URL解析失败，退回到简单的字符串匹配
      if (link.href && link.href.includes(cssFileName)) {
        console.log(`Found matching link by simple string match: ${link.href}`);
        return link;
      }
    }
  }
  
  console.warn(`No matching CSS link found for: ${cssFile}`);
  return undefined;
}

/**
 * 重新加载所有CSS文件
 * @param config CSS配置
 */
export function reloadAllCss(config: any): void {
  console.log('Reloading all CSS files with config:', config);
  
  try {
    // 获取所有当前的CSS link标签
    const currentLinks = document.querySelectorAll('link[rel="stylesheet"][data-dynamic="true"]');
    console.log(`Found ${currentLinks.length} dynamic CSS links to replace`);
    
    // 创建一个映射来记录已删除的链接，以避免重复删除
    const removedLinks = new Set();
    
    // 移除所有动态加载的CSS
    currentLinks.forEach(link => {
      if (!removedLinks.has(link)) {
        link.remove();
        removedLinks.add(link);
      }
    });
    
    // 创建自定义样式标签
    let customStyleTag = document.getElementById('custom-css');
    if (!customStyleTag) {
      customStyleTag = document.createElement('style');
      customStyleTag.id = 'custom-css';
      document.head.appendChild(customStyleTag);
    }
    
    // 设置自定义CSS内容
    customStyleTag.textContent = config.customCss || '';
    console.log('Updated custom CSS content');
    
    // 处理外部CSS文件
    if (config.externalCssFiles && Array.isArray(config.externalCssFiles)) {
      const timestamp = new Date().getTime();
      console.log(`Loading ${config.externalCssFiles.length} external CSS files with timestamp: ${timestamp}`);
      
      // 根据加载顺序添加CSS
      if (config.cssLoadOrder === 'custom-first') {
        console.log('CSS load order: custom-first');
        // 先添加自定义CSS，已经在上面完成
        // 再添加外部CSS文件
        addExternalCssLinks(config.externalCssFiles, timestamp);
      } else {
        console.log('CSS load order: external-first');
        // 先添加外部CSS文件
        addExternalCssLinks(config.externalCssFiles, timestamp);
        // 再确保自定义CSS在最后（通过重新添加来确保顺序）
        document.head.appendChild(customStyleTag);
      }
    } else {
      console.log('No external CSS files to load');
    }
    
    console.log('All CSS files reloaded successfully');
  } catch (error) {
    console.error('Error during reloadAllCss:', error);
  }
}

/**
 * 添加外部CSS链接
 * @param cssFiles CSS文件路径数组
 * @param timestamp 时间戳，用于避免缓存
 */
function addExternalCssLinks(cssFiles: string[], timestamp: number): void {
  // 跟踪已处理的文件，避免重复添加
  const processedFiles = new Set();
  
  cssFiles.forEach(cssFile => {
    // 规范化CSS文件路径
    const normalizedCssFile = cssFile.replace(/\\/g, '/');
    
    // 如果已处理过该文件，跳过
    if (processedFiles.has(normalizedCssFile)) {
      console.log(`Skipping duplicate CSS file: ${normalizedCssFile}`);
      return;
    }
    
    processedFiles.add(normalizedCssFile);
    
    // 查找是否已存在该CSS文件的链接
    const existingLink = findCssLinkTag(cssFile);
    if (existingLink) {
      console.log(`Found existing link for ${cssFile}, updating it`);
      
      // 创建新链接替换旧链接
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.setAttribute('data-dynamic', 'true');
      newLink.setAttribute('data-source', normalizedCssFile);
      
      // 为本地文件添加时间戳避免缓存
      if (!normalizedCssFile.startsWith('http://') && !normalizedCssFile.startsWith('https://')) {
        // 确保URI格式正确
        let uri = normalizedCssFile;
        if (!uri.startsWith('vscode-resource:')) {
          uri = `vscode-resource://${uri}`;
        }
        newLink.href = `${uri}?t=${timestamp}`;
      } else {
        newLink.href = normalizedCssFile;
        newLink.crossOrigin = 'anonymous';
      }
      
      // 替换旧链接
      existingLink.parentNode?.insertBefore(newLink, existingLink);
      existingLink.parentNode?.removeChild(existingLink);
      console.log(`Updated link for ${cssFile}: ${newLink.href}`);
    } else {
      console.log(`Creating new link for ${cssFile}`);
      
      // 创建新的link标签
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-dynamic', 'true');
      link.setAttribute('data-source', normalizedCssFile);
      
      // 为本地文件添加时间戳避免缓存
      if (!normalizedCssFile.startsWith('http://') && !normalizedCssFile.startsWith('https://')) {
        // 确保URI格式正确
        let uri = normalizedCssFile;
        if (!uri.startsWith('vscode-resource:')) {
          uri = `vscode-resource://${uri}`;
        }
        link.href = `${uri}?t=${timestamp}`;
      } else {
        link.href = normalizedCssFile;
        link.crossOrigin = 'anonymous';
      }
      
      // 添加到文档中
      document.head.appendChild(link);
      console.log(`Added new link: ${link.href}`);
      
      // 添加加载事件监听
      link.onload = () => {
        console.log(`CSS file loaded successfully: ${cssFile}`);
      };
      
      link.onerror = (err) => {
        console.error(`Error loading CSS file: ${cssFile}`, err);
      };
    }
  });
}

/**
 * 更新单个CSS文件
 * @param cssFile CSS文件路径
 * @param uri CSS文件URI
 * @param timestamp 时间戳
 */
export function updateCssFile(cssFile: string, uri: string, timestamp: number): void {
  try {
    console.log('Updating CSS file:', cssFile);
    console.log('URI:', uri);
    
    // 查找现有的link标签
    const linkTag = findCssLinkTag(cssFile);
    
    if (linkTag) {
      // 通过创建新的link标签并替换旧标签的方式更新CSS
      // 这种方式比直接修改href更可靠，能确保样式立即生效且不受缓存影响
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = `${uri}?t=${timestamp}`;
      newLink.setAttribute('data-dynamic', 'true');
      newLink.setAttribute('data-source', cssFile);
      
      // 加载完成后删除旧标签，避免闪烁
      newLink.onload = () => {
        if (linkTag.parentNode) {
          linkTag.parentNode.removeChild(linkTag);
        }
        console.log('Old CSS link removed after new one loaded');
      };
      
      // 插入新标签
      linkTag.parentNode?.insertBefore(newLink, linkTag);
      console.log('New CSS link inserted:', newLink.href);
      
      // 如果5秒后onload没有触发，强制移除旧标签
      setTimeout(() => {
        if (linkTag.parentNode) {
          linkTag.parentNode.removeChild(linkTag);
          console.log('Old CSS link removed by timeout');
        }
      }, 5000);
    } else {
      // 如果找不到现有的link标签，尝试创建一个新的
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = `${uri}?t=${timestamp}`;
      newLink.setAttribute('data-dynamic', 'true');
      newLink.setAttribute('data-source', cssFile);
      
      // 检查是否已经有同名文件的标签
      const similarLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(link => {
        const href = (link as HTMLLinkElement).href;
        const fileName = cssFile.split(/[\/\\]/).pop() || '';
        return href.includes(fileName);
      });
      
      if (similarLinks.length > 0) {
        // 如果有类似文件名的标签，插入到它之后
        const lastSimilarLink = similarLinks[similarLinks.length - 1];
        lastSimilarLink.parentNode?.insertBefore(newLink, lastSimilarLink.nextSibling);
        console.log('New CSS link inserted after similar link:', newLink.href);
      } else {
        // 否则添加到文档头部
        document.head.appendChild(newLink);
        console.log('New CSS link added to head:', newLink.href);
      }
    }
  } catch (error) {
    console.error('Error updating CSS file:', error);
  }
}

/**
 * 处理CSS文件被删除的情况
 * @param cssFile 被删除的CSS文件路径
 */
export function handleCssFileDeleted(cssFile: string): void {
  try {
    console.log(`Handling CSS file deletion: ${cssFile}`);
    
    // 查找对应的link标签
    const linkTag = findCssLinkTag(cssFile);
    
    if (linkTag) {
      // 移除标签
      linkTag.parentNode?.removeChild(linkTag);
      console.log(`Removed CSS link for deleted file: ${cssFile}`);
    } else {
      console.warn(`No CSS link found for deleted file: ${cssFile}`);
    }
  } catch (error) {
    console.error(`Error handling CSS file deletion: ${cssFile}`, error);
  }
}
