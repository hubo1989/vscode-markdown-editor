/**
 * 查找高亮叠加层 - 不修改 DOM，使用绝对定位的叠加层
 */

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
  isCurrent: boolean
}

export class HighlightOverlay {
  private overlayContainer: HTMLElement | null = null
  
  constructor() {
    this.createOverlayContainer()
  }
  
  private createOverlayContainer(): void {
    // 创建叠加层容器（覆盖整个视口，使用视口坐标）
    this.overlayContainer = document.createElement('div')
    this.overlayContainer.id = 'find-highlight-overlay'
    this.overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `
    document.body.appendChild(this.overlayContainer)
  }
  
  /**
   * 显示高亮
   */
  showHighlights(searchText: string, currentIndex: number, matchCase: boolean, matchWholeWord: boolean, useRegex: boolean): number {
    if (!this.overlayContainer) {
      return 0
    }

    // 记录上一次参数
    this.lastArgs = { searchText, currentIndex, matchCase, matchWholeWord, useRegex }

    // 清除旧的高亮
    this.clearHighlights()

    if (!searchText) {
      return 0
    }

    // 获取编辑器内容元素
    const contentElement = this.getEditorContentElement()
    if (!contentElement) {
      console.warn('未找到编辑器内容元素')
      return 0
    }

    // 查找所有匹配位置
    const rects = this.findTextPositions(contentElement, searchText, matchCase, matchWholeWord, useRegex)

    console.log(`找到 ${rects.length} 个匹配项，当前索引: ${currentIndex}`)

    // 创建高亮元素
    rects.forEach((rect, index) => {
      const highlight = document.createElement('div')
      highlight.className = index === currentIndex ? 'find-overlay-current' : 'find-overlay'
      highlight.style.cssText = `
        position: absolute;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background-color: ${index === currentIndex ? 'rgba(255, 153, 0, 0.5)' : 'rgba(255, 200, 0, 0.3)'};
        border-radius: 2px;
        ${index === currentIndex ? 'box-shadow: 0 0 0 1px rgba(255, 153, 0, 0.8);' : ''}
        pointer-events: none;
        transition: background-color 0.15s ease, box-shadow 0.15s ease;
      `
      this.overlayContainer?.appendChild(highlight)
    })

    return rects.length
  }
  
  /**
   * 查找文本位置
   */
  private findTextPositions(element: HTMLElement, searchText: string, matchCase: boolean, matchWholeWord: boolean, useRegex: boolean): HighlightRect[] {
    const rects: HighlightRect[] = []
    const text = element.textContent || ''

    if (!text || !searchText) {
      return rects
    }

    // 创建正则表达式
    const flags = matchCase ? 'g' : 'gi'
    let pattern = searchText
    if (!useRegex) {
      pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (matchWholeWord) {
      pattern = `\\b${pattern}\\b`
    }
    const baseRegex = new RegExp(pattern, flags)

    // 使用 TreeWalker 查找文本节点
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    )

    let node: Node | null

    while ((node = walker.nextNode())) {
      const textNode = node as Text
      const nodeText = textNode.textContent || ''
      const nodeLength = nodeText.length

      if (!nodeLength || nodeText.trim() === '') continue

      // 在这个文本节点中查找匹配
      let match: RegExpExecArray | null
      // 为每个节点创建新的正则，避免 lastIndex 干扰
      const nodeRegex = new RegExp(baseRegex.source, baseRegex.flags)
      while ((match = nodeRegex.exec(nodeText)) !== null) {
        try {
          // 创建 Range 来获取位置
          const range = document.createRange()
          range.setStart(textNode, match.index)
          range.setEnd(textNode, match.index + match[0].length)

          // 获取范围相对于视口的坐标
          const clientRects = Array.from(range.getClientRects())
          clientRects.forEach(r => {
            if (r.width > 0 && r.height > 0) {
              rects.push({
                top: r.top + window.scrollY,
                left: r.left + window.scrollX,
                width: r.width,
                height: r.height,
                isCurrent: false
              })
            }
          })
        } catch (e) {
          console.debug('Cannot create range:', e)
        }

        // 防止无限循环（零宽度匹配）
        if (match.index === nodeRegex.lastIndex) {
          nodeRegex.lastIndex++
        }
      }
    }

    return rects
  }
  
  /**
   * 清除所有高亮
   */
  clearHighlights(): void {
    if (this.overlayContainer) {
      this.overlayContainer.innerHTML = ''
    }
  }
  
  /**
   * 销毁叠加层
   */
  destroy(): void {
    if (this.overlayContainer && this.overlayContainer.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer)
    }
    this.overlayContainer = null
  }
  
  /**
   * 滚动到指定的高亮
   */
  scrollToHighlight(index: number): void {
    if (!this.overlayContainer) return
    const highlights = this.overlayContainer.children
    if (!(index >= 0 && index < highlights.length)) return

    const highlight = highlights[index] as HTMLElement

    // 找到编辑器内容元素
    const contentElement = this.getEditorContentElement()
    if (!contentElement) {
      console.warn('无法找到编辑器内容元素进行滚动')
      return
    }

    // 获取编辑器的滚动容器
    const scrollContainer = this.getEditorScrollContainer(contentElement)

    // 获取高亮元素的位置信息
    const highlightTop = parseFloat(highlight.style.top)
    const highlightHeight = parseFloat(highlight.style.height)

    console.log(`滚动到高亮项 ${index}，位置: ${highlightTop}, 高度: ${highlightHeight}`)

    if (!scrollContainer || scrollContainer === window) {
      // 窗口滚动
      const viewportHeight = window.innerHeight
      const targetScrollTop = highlightTop - viewportHeight / 2 + highlightHeight / 2

      console.log(`窗口滚动到位置: ${targetScrollTop}`)
      window.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
    } else {
      // 编辑器内部滚动
      const container = scrollContainer as HTMLElement
      const containerRect = container.getBoundingClientRect()
      const containerHeight = container.clientHeight
      const containerScrollTop = container.scrollTop

      // 计算高亮在容器内的相对位置
      const relativeTop = highlightTop - containerRect.top + containerScrollTop
      const targetScrollTop = relativeTop - containerHeight / 2 + highlightHeight / 2

      console.log(`容器滚动到位置: ${targetScrollTop}，容器高度: ${containerHeight}`)
      container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
    }

    // 滚动结束后重新同步高亮位置
    setTimeout(() => {
      console.log('滚动完成后重新同步高亮')
      this.resync()
    }, 300)
  }

  /**
   * 获取编辑器内容元素
   */
  private getEditorContentElement(): HTMLElement | null {
    // 尝试多种选择器来找到编辑器内容区域
    const selectors = [
      '.vditor-wysiwyg__block',  // Vditor 所见即所得模式
      '.vditor-ir__block',       // Vditor 即时渲染模式
      '.vditor-sv__block',       // Vditor 源码视图模式
      '.vditor-content',         // Vditor 通用内容容器
      '.vditor-wysiwyg',         // Vditor 所见即所得编辑器
      '.vditor-ir',              // Vditor 即时渲染编辑器
      '.vditor-sv',              // Vditor 源码编辑器
      '.vditor-reset',           // Vditor 重置样式容器
      '[contenteditable="true"]' // 任何可编辑内容
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element && element.offsetParent !== null) {
        return element
      }
    }

    // 如果上述选择器都找不到，尝试查找 Vditor 的主要容器
    const vditorElement = document.querySelector('.vditor') as HTMLElement
    if (vditorElement) {
      // 在 Vditor 容器内查找可能的内容区域
      const contentElement = vditorElement.querySelector('[style*="height"], .vditor-content, .vditor-reset') as HTMLElement
      if (contentElement) {
        return contentElement
      }
    }

    return null
  }

  /**
   * 获取编辑器的滚动容器
   */
  private getEditorScrollContainer(contentElement: HTMLElement): HTMLElement | Window | null {
    if (!contentElement) return window

    // 首先检查内容元素本身是否可滚动
    const contentStyle = window.getComputedStyle(contentElement)
    const contentCanScroll = /(auto|scroll)/.test(contentStyle.overflowY) &&
                            contentElement.scrollHeight > contentElement.clientHeight
    if (contentCanScroll) {
      return contentElement
    }

    // 查找父级可滚动容器
    let node: HTMLElement | null = contentElement.parentElement
    while (node) {
      const style = window.getComputedStyle(node)
      const canScroll = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight
      if (canScroll) {
        return node
      }
      node = node.parentElement
    }

    // 如果没有找到内部滚动容器，返回窗口
    return window
  }

  
  private lastArgs: { searchText: string; currentIndex: number; matchCase: boolean; matchWholeWord: boolean; useRegex: boolean } | null = null;
  
  /**
   * 获取所有高亮元素
   */
  getHighlightElements(): HTMLCollection | null {
    return this.overlayContainer ? this.overlayContainer.children : null
  }
  
  /**
   * 更新当前高亮项的样式
   */
  updateCurrentHighlight(currentIndex: number): void {
    if (!this.overlayContainer) return
    
    const highlights = this.overlayContainer.children
    for (let i = 0; i < highlights.length; i++) {
      const highlight = highlights[i] as HTMLElement
      if (i === currentIndex) {
        // 当前项样式
        highlight.style.backgroundColor = 'rgba(255, 153, 0, 0.5)'
        highlight.style.boxShadow = '0 0 0 1px rgba(255, 153, 0, 0.8)'
        highlight.className = 'find-overlay-current'
      } else {
        // 非当前项样式
        highlight.style.backgroundColor = 'rgba(255, 200, 0, 0.3)'
        highlight.style.boxShadow = 'none'
        highlight.className = 'find-overlay'
      }
    }
  }
  
  resync(): void {
    if (!this.lastArgs) return
    const { searchText, currentIndex, matchCase, matchWholeWord, useRegex } = this.lastArgs
    this.showHighlights(searchText, currentIndex, matchCase, matchWholeWord, useRegex)
  }
}
