/**
 * 表格编辑功能模块
 * IR模式下的表格编辑功能增强
 */
import userEvent from '@testing-library/user-event';
import $ from 'jquery';
import { t, updateHotkeyTip } from '../../i18n/lang';

// 表格面板ID
const TABLE_PANEL_ID = 'fix-table-ir-wrapper';

// 是否禁用VS Code快捷键
let disableVscodeHotkeys = false;

/**
 * 创建表格编辑面板
 * @param eventRoot 事件根元素
 * @returns 表格编辑面板元素
 */
function createTablePanel(eventRoot: HTMLElement): HTMLDivElement {
  let tablePanel = eventRoot.querySelector<HTMLDivElement>(`#${TABLE_PANEL_ID}`);
  
  if (!tablePanel) {
    tablePanel = document.createElement('div');
    tablePanel.id = TABLE_PANEL_ID;
    eventRoot.appendChild(tablePanel);
    
    tablePanel.innerHTML = `<div
      class="vditor-panel vditor-panel--none vditor-panel-ir"
      data-top="73"
      style="left: 35px; top: 73px;display:none"
    >
      <button
        type="button"
        aria-label="${t('alignLeft')}<${updateHotkeyTip('⇧⌘L')}>"
        data-type="left"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n vditor-icon--current"
      >
        <svg><use xlink:href="#vditor-icon-align-left"></use></svg></button
      ><button
        type="button"
        aria-label="${t('alignCenter')}<${updateHotkeyTip('⇧⌘C')}>"
        data-type="center"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-align-center"></use></svg></button
      ><button
        type="button"
        aria-label="${t('alignRight')}<${updateHotkeyTip('⇧⌘R')}>"
        data-type="right"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-align-right"></use></svg></button
      ><button
        type="button"
        aria-label="${t('insertRowAbove')}<${updateHotkeyTip('⇧⌘F')}>"
        data-type="insertRowA"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-insert-rowb"></use></svg></button
      ><button
        type="button"
        aria-label="${t('insertRowBelow')}<${updateHotkeyTip('⌘=')}>"
        data-type="insertRowB"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-insert-row"></use></svg></button
      ><button
        type="button"
        aria-label="${t('insertColumnLeft')}<${updateHotkeyTip('⇧⌘G')}>"
        data-type="insertColumnL"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-insert-columnb"></use></svg></button
      ><button
        type="button"
        aria-label="${t('insertColumnRight')}<${updateHotkeyTip('⇧⌘=')}>"
        data-type="insertColumnR"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-insert-column"></use></svg></button
      ><button
        type="button"
        aria-label="${t('delete-row')}<${updateHotkeyTip('⌘-')}>"
        data-type="deleteRow"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-delete-row"></use></svg></button
      ><button
        type="button"
        aria-label="${t('delete-column')}<${updateHotkeyTip('⇧⌘-')}>"
        data-type="deleteColumn"
        class="vditor-icon vditor-tooltipped vditor-tooltipped__n"
      >
        <svg><use xlink:href="#vditor-icon-delete-column"></use></svg></button
      >
    </div>`;
    
    // 绑定按钮点击事件
    $(tablePanel).on('click', '.vditor-icon', handleTableButtonClick);
  }
  
  return tablePanel.children[0] as HTMLDivElement;
}

/**
 * 表格按钮点击处理
 * @param event 点击事件
 */
function handleTableButtonClick(event: any): void {
  const target = event.target as HTMLElement;
  const type = $(target).attr('data-type');
  
  if (!type) return;
  
  // 快捷键映射
  const keyboardShortcuts: Record<string, string[]> = {
    left: ['{ctrl}{shift}l{/shift}{/ctrl}', '{meta}{shift}l{/shift}{/meta}'],
    center: ['{ctrl}{shift}c{/shift}{/ctrl}', '{meta}{shift}c{/shift}{/meta}'],
    right: ['{ctrl}{shift}r{/shift}{/ctrl}', '{meta}{shift}r{/shift}{/meta}'],
    insertRowA: ['{ctrl}{shift}f{/shift}{/ctrl}', '{meta}{shift}f{/shift}{/meta}'],
    insertRowB: ['{ctrl}={/ctrl}', '{meta}={/meta}'],
    deleteRow: ['{ctrl}-{/ctrl}', '{meta}-{/meta}'],
    insertColumnL: ['{ctrl}{shift}g{/shift}{/ctrl}', '{meta}{shift}g{/shift}{/meta}'],
    insertColumnR: ['{ctrl}{shift}+{/shift}{/ctrl}', '{meta}{shift}={/shift}{/meta}'],
    deleteColumn: ['{ctrl}{shift}_{/shift}{/ctrl}', '{meta}{shift}-{/shift}{/meta}'],
  };
  
  // 选择适合当前平台的快捷键
  const isMac = navigator.platform.toLowerCase().includes('mac');
  const shortcut = keyboardShortcuts[type]?.[isMac ? 1 : 0];
  
  if (shortcut) {
    // 禁用VS Code快捷键以防冲突
    disableVscodeHotkeys = true;
    
    // 模拟键盘输入
    const eventRoot = window.vditor.vditor.ir.element;
    Promise.resolve(
      userEvent.keyboard(shortcut)
    ).finally(() => {
      disableVscodeHotkeys = false;
    });
  }
  
  event.stopPropagation();
}

/**
 * 设置表格功能增强
 */
export function setupTableFeatures(): void {
  if (!window.vditor) return;
  
  const eventRoot = window.vditor.vditor.ir.element;
  
  // 点击事件处理，显示/隐藏表格面板
  eventRoot.addEventListener('click', (e: MouseEvent) => {
    if (window.vditor.getCurrentMode() !== 'ir') return;
    
    const tablePanel = createTablePanel(eventRoot);
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    
    const clickEl = selection.anchorNode.parentElement as HTMLElement;
    
    if (clickEl && ['TD', 'TH', 'TR'].includes(clickEl.tagName)) {
      // 在表格元素内点击，显示表格面板
      if (tablePanel.style.display !== 'block') {
        tablePanel.style.display = 'block';
      }
      
      // 调整面板位置
      tablePanel.style.top = 
        `${clickEl.getBoundingClientRect().top - 
        eventRoot.getBoundingClientRect().top +
        eventRoot.scrollTop - 25}px`;
    } else {
      // 在表格外点击，隐藏表格面板
      if (tablePanel.style.display !== 'none') {
        tablePanel.style.display = 'none';
      }
    }
  });
  
  // 阻止键盘事件冒泡，防止与VS Code快捷键冲突
  const stopEvent = (e: KeyboardEvent): void => {
    if (disableVscodeHotkeys) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  // 添加键盘事件监听
  eventRoot.addEventListener('keydown', stopEvent);
  eventRoot.addEventListener('keyup', stopEvent);
}
