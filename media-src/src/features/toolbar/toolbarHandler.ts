/**
 * 工具栏处理模块
 * 负责控制工具栏的显示和隐藏
 */

/**
 * 更新工具栏显示/隐藏状态
 * @param showToolbar 是否显示工具栏
 */
export function updateToolbarVisibility(showToolbar: boolean): void {
  try {
    console.log('Updating toolbar visibility:', showToolbar);
    
    if (!window.vditor) {
      console.warn('Vditor not initialized yet');
      return;
    }
    
    // 更新选项
    window.vditor.vditor.options.toolbarConfig.hide = !showToolbar;
    
    // 直接更新工具栏DOM元素
    const toolbar = document.querySelector('.vditor-toolbar');
    if (toolbar) {
      if (showToolbar) {
        // 显示工具栏
        toolbar.classList.remove('vditor-toolbar--hide');
        toolbar.setAttribute('style', 'display: block !important');
      } else {
        // 隐藏工具栏
        toolbar.classList.add('vditor-toolbar--hide');
        toolbar.setAttribute('style', 'display: none !important');
      }
    } else {
      console.warn('Toolbar element not found');
    }
  } catch (error) {
    console.error('Error updating toolbar visibility:', error);
  }
}
