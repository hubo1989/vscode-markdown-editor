import './preload'

import {
  fileToBase64,
  fixCut,
  fixDarkTheme,
  fixLinkClick,
  fixPanelHover,
  handleToolbarClick,
  saveVditorOptions,
} from './utils'

import { merge } from 'lodash'
import Vditor from 'vditor'
import { format } from 'date-fns'
import 'vditor/dist/index.css'
import { t, lang } from './lang'
import { toolbar } from './toolbar'
import { fixTableIr } from './fix-table-ir'
import './main.css'

function initVditor(msg) {
  console.log('msg', msg)
  let inputTimer
  let defaultOptions: any = {}
  if (msg.theme === 'dark') {
    // vditor.setTheme('dark', 'dark')
    defaultOptions = merge(defaultOptions, {
      theme: 'dark',
      preview: {
        theme: {
          current: 'dark',
        },
      }
    })
  }
  defaultOptions = merge(defaultOptions, msg.options, {
    preview: {
      math: {
        inlineDigit: true,
      }
    }
  })
  if (window.vditor) {
    vditor.destroy()
    window.vditor = null
  }
  window.vditor = new Vditor('app', {
    width: '100%',
    height: '100%',
    minHeight: '100%',
    lang,
    value: msg.content,
    mode: 'ir',
    cache: { enable: false },
    toolbar,
    toolbarConfig: { pin: true },
    outline: {
      enable: msg.options && msg.options.showOutlineByDefault ? true : false,
      position: msg.options && msg.options.outlinePosition ? msg.options.outlinePosition : 'left'
    },
    ...defaultOptions,
    after() {
      fixDarkTheme()
      handleToolbarClick()
      fixTableIr()
      fixPanelHover()
      setupResizableOutline(msg.options)
    },
    input() {
      inputTimer && clearTimeout(inputTimer)
      inputTimer = setTimeout(() => {
        vscode.postMessage({ command: 'edit', content: vditor.getValue() })
      }, 100)
    },
    upload: {
      url: '/fuzzy', // 没有 url 参数粘贴图片无法上传 see: https://github.com/Vanessa219/vditor/blob/d7628a0a7cfe5d28b055469bf06fb0ba5cfaa1b2/src/ts/util/fixBrowserBehavior.ts#L1409
      async handler(files) {
        // console.log('files', files)
        let fileInfos = await Promise.all(
          files.map(async (f) => {
            const d = new Date()
            return {
              base64: await fileToBase64(f),
              name: `${format(new Date(), 'yyyyMMdd_HHmmss')}_${f.name}`.replace(
                /[^\w-_.]+/,
                '_'
              ),
            }
          })
        )
        vscode.postMessage({
          command: 'upload',
          files: fileInfos,
        })
      },
    },
  })
}

/**
 * 设置可调整大小的大纲面板
 */
function setupResizableOutline(options: any) {
  if (!options) return
  
  const enableResize = options.enableOutlineResize !== false
  const defaultWidth = options.outlineWidth || 200
  const position = options.outlinePosition || 'left'
  
  // 等待大纲元素加载
  setTimeout(() => {
    const outline = document.querySelector('.vditor-outline') as HTMLElement
    if (!outline) return
    
    // 设置初始宽度
    outline.style.width = `${defaultWidth}px`
    outline.style.minWidth = '150px'
    outline.style.maxWidth = '500px'
    outline.style.position = 'relative'
    
    if (!enableResize) return
    
    // 创建调整大小的手柄
    const resizeHandle = document.createElement('div')
    resizeHandle.className = 'outline-resize-handle'
    resizeHandle.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      background: transparent;
      cursor: col-resize;
      z-index: 1000;
      transition: background-color 0.2s ease;
      ${position === 'left' ? 'right: 0;' : 'left: 0;'}
    `
    
    // 添加悬停效果
    resizeHandle.addEventListener('mouseenter', () => {
      resizeHandle.style.backgroundColor = 'var(--vscode-sash-hoverBorder, rgba(0, 122, 255, 0.5))'
    })
    
    resizeHandle.addEventListener('mouseleave', () => {
      resizeHandle.style.backgroundColor = 'transparent'
    })
    
    outline.appendChild(resizeHandle)
    
    // 拖拽调整大小的逻辑
    let isResizing = false
    let startX = 0
    let startWidth = 0
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true
      startX = e.clientX
      startWidth = outline.offsetWidth
      
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      e.preventDefault()
    })
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return
      
      const deltaX = position === 'left' ? (e.clientX - startX) : (startX - e.clientX)
      const newWidth = Math.max(150, Math.min(500, startWidth + deltaX))
      
      outline.style.width = `${newWidth}px`
      
      // 发送宽度变化到VS Code配置
      vscode.postMessage({
        command: 'update-outline-width',
        width: newWidth
      })
    })
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    })
    
    // 添加双击重置宽度的功能
    resizeHandle.addEventListener('dblclick', () => {
      const resetWidth = options.outlineWidth || 200
      outline.style.width = `${resetWidth}px`
      
      vscode.postMessage({
        command: 'update-outline-width',
        width: resetWidth
      })
    })
  }, 100)
}

window.addEventListener('message', (e) => {
  const msg = e.data
  // console.log('msg from vscode', msg)
  switch (msg.command) {
    case 'update': {
      if (msg.type === 'init') {
        if (msg.options && msg.options.useVscodeThemeColor) {
          document.body.setAttribute('data-use-vscode-theme-color', '1')
        } else {
          document.body.setAttribute('data-use-vscode-theme-color', '0')
        }
        try {
          initVditor(msg)
        } catch (error) {
          // reset options when error
          console.error(error)
          initVditor({content: msg.content})
          saveVditorOptions()
        }
        console.log('initVditor')
      } else {
        vditor.setValue(msg.content)
        console.log('setValue')
      }
      break
    }
    case 'uploaded': {
      msg.files.forEach((f) => {
        if (f.endsWith('.wav')) {
          vditor.insertValue(
            `\n\n<audio controls="controls" src="${f}"></audio>\n\n`
          )
        } else {
          const i = new Image()
          i.src = f
          i.onload = () => {
            vditor.insertValue(`\n\n![](${f})\n\n`)
          }
          i.onerror = () => {
            vditor.insertValue(`\n\n[${f.split('/').slice(-1)[0]}](${f})\n\n`)
          }
        }
      })
      break
    }
    default:
      break
  }
})

fixLinkClick()
fixCut()

vscode.postMessage({ command: 'ready' })
