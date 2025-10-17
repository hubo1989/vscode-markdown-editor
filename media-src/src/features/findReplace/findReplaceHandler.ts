/**
 * 查找替换功能核心逻辑
 */

import { createFindReplacePanel, injectFindReplaceStyles } from './findReplaceUI'
import { HighlightOverlay } from './highlightOverlay'

interface FindOptions {
  matchCase: boolean
  matchWholeWord: boolean
  useRegex: boolean
}

interface FindResult {
  index: number
  length: number
  line: number
  column: number
}

class FindReplaceHandler {
  private panel: HTMLElement | null = null
  private findInput: HTMLInputElement | null = null
  private replaceInput: HTMLInputElement | null = null
  private replaceRow: HTMLElement | null = null
  private findCount: HTMLElement | null = null
  private findPrevBtn: HTMLButtonElement | null = null
  private findNextBtn: HTMLButtonElement | null = null
  
  private findResults: FindResult[] = []
  private currentResultIndex: number = -1
  private options: FindOptions = {
    matchCase: false,
    matchWholeWord: false,
    useRegex: false
  }
  
  private highlightOverlay: HighlightOverlay | null = null
  private isInitialized: boolean = false

  /**
   * 初始化查找替换功能
   */
  initialize(): void {
    console.log('FindReplaceHandler.initialize() 被调用');
    if (this.isInitialized) {
      console.log('FindReplaceHandler 已经初始化，跳过');
      return
    }

    try {
      // 注入样式
      injectFindReplaceStyles()
      console.log('样式已注入');
      
      // 创建面板
      this.panel = createFindReplacePanel()
      document.body.appendChild(this.panel)
      console.log('面板已创建并添加到DOM');
      
      // 获取元素引用
      this.findInput = this.panel.querySelector('.find-input')
      this.replaceInput = this.panel.querySelector('.replace-input')
      this.replaceRow = this.panel.querySelector('.replace-row')
      this.findCount = this.panel.querySelector('.find-count')
      this.findPrevBtn = this.panel.querySelector('.find-prev-btn')
      this.findNextBtn = this.panel.querySelector('.find-next-btn')
      
      console.log('元素引用已获取', {
        findInput: !!this.findInput,
        replaceInput: !!this.replaceInput,
        replaceRow: !!this.replaceRow,
        findCount: !!this.findCount,
        findPrevBtn: !!this.findPrevBtn,
        findNextBtn: !!this.findNextBtn
      });
      
      // 绑定事件
      this.bindEvents()
      console.log('事件已绑定');
      
      // 创建高亮叠加层
      this.highlightOverlay = new HighlightOverlay()
      console.log('高亮叠加层已创建');
      
      // 监听编辑器变化
      this.watchEditorChanges()
      console.log('编辑器变化监听器已设置');

      // 绑定滚动/尺寸变化时的重绘
      this.bindOverlaySyncEvents()
      console.log('叠加层同步事件已绑定');
      
      this.isInitialized = true
      console.log('FindReplaceHandler 初始化完成');
    } catch (error) {
      console.error('FindReplaceHandler 初始化过程中发生错误:', error);
    }
  }

  /**
   * 绑定事件处理器
   */
  private bindEvents(): void {
    if (!this.panel) return

    // 关闭按钮
    const closeBtn = this.panel.querySelector('.find-replace-close')
    closeBtn?.addEventListener('click', () => this.hide())

    // 查找输入框事件
    this.findInput?.addEventListener('input', () => this.onFindInputChange())
    this.findInput?.addEventListener('keydown', (e) => this.onFindInputKeydown(e as KeyboardEvent))

    // 替换输入框事件
    this.replaceInput?.addEventListener('keydown', (e) => this.onReplaceInputKeydown(e as KeyboardEvent))

    // 查找按钮事件绑定
    this.findPrevBtn?.addEventListener('click', () => this.findPrevious())
    this.findNextBtn?.addEventListener('click', () => this.findNext())

    // 替换按钮
    const replaceBtn = this.panel.querySelector('.replace-btn')
    const replaceAllBtn = this.panel.querySelector('.replace-all-btn')
    replaceBtn?.addEventListener('click', () => this.replaceCurrent())
    replaceAllBtn?.addEventListener('click', () => this.replaceAll())

    // 选项按钮
    const toggleReplaceBtn = this.panel.querySelector('.toggle-replace-btn')
    const matchCaseBtn = this.panel.querySelector('.match-case-btn')
    const matchWholeWordBtn = this.panel.querySelector('.match-whole-word-btn')
    const useRegexBtn = this.panel.querySelector('.use-regex-btn')

    toggleReplaceBtn?.addEventListener('click', () => this.toggleReplace())
    matchCaseBtn?.addEventListener('click', () => this.toggleOption('matchCase', matchCaseBtn))
    matchWholeWordBtn?.addEventListener('click', () => this.toggleOption('matchWholeWord', matchWholeWordBtn))
    useRegexBtn?.addEventListener('click', () => this.toggleOption('useRegex', useRegexBtn))

    // 全局键盘事件
    document.addEventListener('keydown', (e) => this.onGlobalKeydown(e))
  }

  /**
   * 显示查找面板
   */
  show(showReplace: boolean = false): void {
    console.log('FindReplaceHandler.show() 被调用，参数 showReplace:', showReplace);
    try {
      if (!this.isInitialized) {
        console.log('FindReplaceHandler 未初始化，开始初始化');
        this.initialize()
      }

      if (this.panel) {
        this.panel.classList.add('visible')
        console.log('面板已设置为可见');
        
        if (showReplace && this.replaceRow) {
          this.replaceRow.style.display = 'flex'
          // 更新箭头状态
          const toggleBtn = this.panel.querySelector('.toggle-replace-btn')
          if (toggleBtn) {
            toggleBtn.setAttribute('data-expanded', 'true')
          }
          console.log('替换行已显示');
        }

        // 获取当前选中的文本
        const selectedText = this.getSelectedText()
        if (selectedText && this.findInput) {
          this.findInput.value = selectedText
          this.performFind()
          console.log('已使用选中文本执行查找:', selectedText);
        }

        // 聚焦到查找输入框
        setTimeout(() => {
          if (this.findInput) {
            this.findInput.focus()
            this.findInput.select()
            console.log('查找输入框已聚焦并选中文本');
          }
        }, 100)
      } else {
        console.error('面板不存在，无法显示');
      }
    } catch (error) {
      console.error('显示查找面板时发生错误:', error);
    }
  }

  /**
   * 隐藏查找面板
   */
  hide(): void {
    if (this.panel) {
      this.panel.classList.remove('visible')
      this.clearHighlights()
    }
  }

  /**
   * 监听编辑器内容变化，自动清除高亮
   */
  private watchEditorChanges(): void {
    if (window.vditor && window.vditor.vditor) {
      const editorElement = window.vditor.vditor.element
      if (editorElement) {
        // 监听输入事件
        editorElement.addEventListener('input', () => {
          this.removeHighlights()
        })
      }
    }
  }

  /**
   * 绑定滚动/尺寸变化时重绘高亮
   */
  private bindOverlaySyncEvents(): void {
    const sync = () => this.highlightOverlay?.resync()
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
  }

  /**
   * 切换替换功能显示
   */
  private toggleReplace(): void {
    if (this.replaceRow) {
      const isVisible = this.replaceRow.style.display !== 'none'
      this.replaceRow.style.display = isVisible ? 'none' : 'flex'
      
      // 更新箭头状态
      const toggleBtn = this.panel?.querySelector('.toggle-replace-btn')
      if (toggleBtn) {
        toggleBtn.setAttribute('data-expanded', String(!isVisible))
      }
      
      if (!isVisible) {
        setTimeout(() => this.replaceInput?.focus(), 100)
      }
    }
  }

  /**
   * 切换选项
   */
  private toggleOption(option: keyof FindOptions, button: Element): void {
    this.options[option] = !this.options[option]
    button.setAttribute('data-active', String(this.options[option]))
    this.performFind()
  }

  /**
   * 查找输入框内容变化
   */
  private inputTimer: ReturnType<typeof setTimeout> | null = null
  
  private onFindInputChange(): void {
    if (this.inputTimer) {
      clearTimeout(this.inputTimer)
    }
    this.inputTimer = setTimeout(() => {
      this.performFind()
    }, 300)
  }

  /**
   * 查找输入框键盘事件
   */
  private onFindInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        this.findPrevious()
      } else {
        this.findNext()
      }
    } else if (e.key === 'Escape') {
      this.hide()
    }
  }

  /**
   * 替换输入框键盘事件
   */
  private onReplaceInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && e.ctrlKey && e.shiftKey) {
      e.preventDefault()
      this.replaceAll()
    } else if (e.key === 'Escape') {
      this.hide()
    }
  }

  /**
   * 全局键盘事件
   */
  private onGlobalKeydown(e: KeyboardEvent): void {
    if (!this.panel?.classList.contains('visible')) {
      return
    }

    if (e.key === 'Escape') {
      this.hide()
    }
  }

  /**
   * 获取编辑器内容
   */
  private getEditorContent(): string {
    if (window.vditor && window.vditor.getValue) {
      return window.vditor.getValue()
    }
    return ''
  }

  /**
   * 设置编辑器内容
   */
  private setEditorContent(content: string): void {
    if (window.vditor && window.vditor.setValue) {
      window.vditor.setValue(content)
    }
  }

  /**
   * 获取当前选中的文本
   */
  private getSelectedText(): string {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      return selection.toString()
    }
    return ''
  }

  /**
   * 执行查找
   */
  private performFind(): void {
    const searchText = this.findInput?.value || ''
    
    if (!searchText) {
      this.clearHighlights()
      this.updateFindCount(0, 0)
      return
    }

    const content = this.getEditorContent()
    this.findResults = this.findInText(content, searchText)
    
    if (this.findResults.length > 0) {
      this.currentResultIndex = 0
      this.updateFindCount(1, this.findResults.length)
      this.highlightResults()
    } else {
      this.clearHighlights()
      this.updateFindCount(0, 0)
    }
  }

  /**
   * 在文本中查找所有匹配项
   */
  private findInText(content: string, searchText: string): FindResult[] {
    const results: FindResult[] = []
    
    try {
      const regex = this.buildRegex(searchText, true)

      let match: RegExpExecArray | null
      while ((match = regex.exec(content)) !== null) {
        const index = match.index
        const beforeText = content.substring(0, index)
        const lines = beforeText.split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1

        results.push({
          index,
          length: match[0].length,
          line,
          column
        })

        // 防止无限循环（零宽度匹配）
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }
    } catch (error) {
      console.error('Find error:', error)
    }

    return results
  }

  /**
   * 高亮显示查找结果
   */
  private highlightResults(): void {
    if (!this.highlightOverlay) {
      console.warn('高亮叠加层未初始化')
      return
    }

    const searchText = this.findInput?.value || ''
    if (!searchText) {
      this.highlightOverlay.clearHighlights()
      return
    }

    console.log(`开始高亮显示: "${searchText}", 当前索引: ${this.currentResultIndex}`)

    // 使用叠加层显示高亮
    const highlightCount = this.highlightOverlay.showHighlights(
      searchText,
      this.currentResultIndex,
      this.options.matchCase,
      this.options.matchWholeWord,
      this.options.useRegex
    )

    console.log(`高亮显示完成，共 ${highlightCount} 个匹配项`)

    // 滚动到当前高亮并居中显示
    if (this.currentResultIndex >= 0 && highlightCount > 0) {
      setTimeout(() => {
        if (this.highlightOverlay) {
          console.log(`滚动到当前高亮项: ${this.currentResultIndex}`)
          this.highlightOverlay.updateCurrentHighlight(this.currentResultIndex)
          this.highlightOverlay.scrollToHighlight(this.currentResultIndex)
        }
      }, 100)
    }
  }

  /**
   * 清除高亮
   */
  private clearHighlights(): void {
    this.removeHighlights()
    this.findResults = []
    this.currentResultIndex = -1
  }
  
  /**
   * 移除所有高亮标记
   */
  private removeHighlights(): void {
    if (this.highlightOverlay) {
      this.highlightOverlay.clearHighlights()
    }
  }


  /**
   * 查找下一个
   */
  private findNext(): void {
    if (this.findResults.length === 0) {
      this.performFind()
      return
    }

    this.currentResultIndex = (this.currentResultIndex + 1) % this.findResults.length
    this.updateFindCount(this.currentResultIndex + 1, this.findResults.length)
    this.highlightResults()
    
    // 滚动到当前匹配项并居中显示
    if (this.highlightOverlay) {
      this.highlightOverlay.updateCurrentHighlight(this.currentResultIndex)
      this.highlightOverlay.scrollToHighlight(this.currentResultIndex)
    }
  }

  /**
   * 查找上一个
   */
  private findPrevious(): void {
    if (this.findResults.length === 0) {
      this.performFind()
      return
    }

    this.currentResultIndex = (this.currentResultIndex - 1 + this.findResults.length) % this.findResults.length
    this.updateFindCount(this.currentResultIndex + 1, this.findResults.length)
    this.highlightResults()
    
    // 滚动到当前匹配项并居中显示
    if (this.highlightOverlay) {
      this.highlightOverlay.updateCurrentHighlight(this.currentResultIndex)
      this.highlightOverlay.scrollToHighlight(this.currentResultIndex)
    }
  }

  /**
   * 替换当前匹配项
   */
  private replaceCurrent(): void {
    const searchText = this.findInput?.value || ''
    if (!searchText) return

    // 确保使用最新内容和结果
    const content = this.getEditorContent()
    this.findResults = this.findInText(content, searchText)

    if (this.currentResultIndex < 0 || this.currentResultIndex >= this.findResults.length) {
      return
    }

    const replaceText = this.replaceInput?.value || ''
    const target = this.findResults[this.currentResultIndex]

    // 使用同一构造方式的正则确保一致性
    const regex = this.buildRegex(searchText, true)
    regex.lastIndex = target.index
    const matchAtIndex = regex.exec(content)

    let start = target.index
    let end = target.index + target.length
    if (matchAtIndex && matchAtIndex.index === target.index) {
      start = matchAtIndex.index
      end = matchAtIndex.index + matchAtIndex[0].length
    }

    const newContent = content.substring(0, start) + replaceText + content.substring(end)
    this.setEditorContent(newContent)

    // 替换后重新查找并更新高亮
    setTimeout(() => {
      this.performFind()
    }, 50)
  }

  /**
   * 全部替换
   */
  private replaceAll(): void {
    if (this.findResults.length === 0) {
      return
    }

    const searchText = this.findInput?.value || ''
    const replaceText = this.replaceInput?.value || ''
    
    if (!searchText) {
      return
    }

    let content = this.getEditorContent()
    
    try {
      const regex = this.buildRegex(searchText, true)
      const newContent = content.replace(regex, replaceText)
      this.setEditorContent(newContent)
      
      // 更新显示
      setTimeout(() => {
        this.clearHighlights()
        this.updateFindCount(0, 0)
      }, 50)
    } catch (error) {
      console.error('Replace all error:', error)
    }
  }

  /**
   * 更新查找计数显示
   */
  private updateFindCount(current: number, total: number): void {
    if (this.findCount) {
      if (total === 0) {
        this.findCount.textContent = '无匹配'
      } else {
        this.findCount.textContent = `${current}/${total}`
      }
    }
    
    // 更新按钮状态
    this.updateNavigationButtonsState(total > 0)
  }
  
  /**
   * 更新导航按钮状态
   */
  private updateNavigationButtonsState(hasResults: boolean): void {
    if (this.findPrevBtn && this.findNextBtn) {
      if (hasResults) {
        this.findPrevBtn.disabled = false
        this.findNextBtn.disabled = false
      } else {
        this.findPrevBtn.disabled = true
        this.findNextBtn.disabled = true
      }
    }
  }
  /**
   * 构造与当前选项一致的正则
   */
  private buildRegex(searchText: string, global = true): RegExp {
    const flags = (this.options.matchCase ? '' : 'i') + (global ? 'g' : '')
    let pattern = this.options.useRegex
      ? searchText
      : searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (this.options.matchWholeWord) {
      pattern = `\\b${pattern}\\b`
    }
    return new RegExp(pattern, flags)
  }
}

// 创建全局实例
const findReplaceHandler = new FindReplaceHandler()

export { findReplaceHandler }
