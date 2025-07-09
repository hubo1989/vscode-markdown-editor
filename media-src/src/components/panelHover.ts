/**
 * 面板悬停处理模块
 */
import $ from 'jquery';

/**
 * 修复面板悬停效果
 * 添加悬停延迟，改善用户体验
 */
export function setupPanelHoverEffects(): void {
  $('.vditor-panel').each((i, element) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    $(element)
      .on('mouseenter', (event) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        event.currentTarget.classList.add('vditor-panel_hover');
      })
      .on('mouseleave', (event) => {
        const el = event.currentTarget;
        timer = setTimeout(() => {
          el.classList.remove('vditor-panel_hover');
        }, 2000);
      });
  });
}
