/**
 * 工具栏配置模块
 */
import { t } from '../../i18n/lang';
import { confirm, sendMessageToVSCode } from '../../utils/common';

/**
 * 复制Markdown内容
 */
async function copyMarkdownContent(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.vditor.getValue());
    sendMessageToVSCode({
      command: 'info',
      content: 'Copy Markdown successfully!',
    });
  } catch (error: any) {
    sendMessageToVSCode({
      command: 'error',
      content: `Copy Markdown failed! ${error.message}`,
    });
  }
}

/**
 * 复制HTML内容
 */
async function copyHtmlContent(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.vditor.getHTML());
    sendMessageToVSCode({
      command: 'info',
      content: 'Copy HTML successfully!',
    });
  } catch (error: any) {
    sendMessageToVSCode({
      command: 'error',
      content: `Copy HTML failed! ${error.message}`,
    });
  }
}

/**
 * 重置编辑器配置
 */
function resetEditorConfig(): void {
  confirm(t('resetConfirm'), async () => {
    try {
      sendMessageToVSCode({
        command: 'reset-config',
      });
      sendMessageToVSCode({
        command: 'ready',
      });
      sendMessageToVSCode({
        command: 'info',
        content: 'Reset config successfully!',
      });
    } catch (error) {
      sendMessageToVSCode({
        command: 'error',
        content: 'Reset config failed!',
      });
    }
  });
}

/**
 * 保存文档
 */
function saveDocument(): void {
  sendMessageToVSCode({
    command: 'save',
    content: window.vditor.getValue(),
  });
}

/**
 * 插入 Mermaid 图表模板
 */
function insertMermaidChart(): void {
  const template = `\`\`\`mermaid
graph TD
    A[开始] --> B[处理数据]
    B --> C{判断条件}
    C -->|是| D[执行操作]
    C -->|否| E[结束]
    D --> E
\`\`\`

`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 插入 PlantUML 图表模板
 */
function insertPlantUMLChart(): void {
  const template = `\`\`\`plantuml
@startuml
Alice -> Bob: 请求认证
Bob --> Alice: 认证响应
Alice -> Bob: 请求数据
Bob --> Alice: 返回数据
@enduml
\`\`\`

`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 插入 ECharts 图表模板
 */
function insertEChartsChart(): void {
  const template = `\`\`\`echarts
{
  "title": {
    "text": "示例图表"
  },
  "tooltip": {},
  "xAxis": {
    "data": ["A", "B", "C", "D", "E"]
  },
  "yAxis": {},
  "series": [{
    "name": "销量",
    "type": "bar",
    "data": [5, 20, 36, 10, 20]
  }]
}
\`\`\`

`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 插入五线谱模板
 */
function insertStaffNotation(): void {
  const template = `\`\`\`abc
X:1
T:C
K:C
G4|C4 E4 G4|G4 F2 A2|B3 G3 B3|d4 B2|
w:3
GABc|d2 e2|f2 g2|a2 b2|
\`\`\`

`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 插入数学公式块
 */
function insertMathBlock(): void {
  const template = `$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 插入行级数学公式
 */
function insertInlineMath(): void {
  const template = `$E = mc^2$`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 插入图片
 */
function insertImage(): void {
  const template = `![图片描述](https://example.com/image.png)`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

/**
 * 工具栏配置
 */
export const toolbar = [
  // 保存按钮
  {
    hotkey: '⌘s',
    name: 'save',
    tipPosition: 's',
    tip: t('save'),
    className: 'save',
    icon:
      '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M810.667 938.667H213.333a128 128 0 01-128-128V213.333a128 128 0 01128-128h469.334a42.667 42.667 0 0130.293 12.374L926.293 311.04a42.667 42.667 0 0112.374 30.293v469.334a128 128 0 01-128 128zm-597.334-768a42.667 42.667 0 00-42.666 42.666v597.334a42.667 42.667 0 0042.666 42.666h597.334a42.667 42.667 0 0042.666-42.666v-451.84l-188.16-188.16z"/><path d="M725.333 938.667A42.667 42.667 0 01682.667 896V597.333H341.333V896A42.667 42.667 0 01256 896V554.667A42.667 42.667 0 01298.667 512h426.666A42.667 42.667 0 01768 554.667V896a42.667 42.667 0 01-42.667 42.667zM640 384H298.667A42.667 42.667 0 01256 341.333V128a42.667 42.667 0 0185.333 0v170.667H640A42.667 42.667 0 01640 384z"/></svg>',
    click: saveDocument,
  },

  // 标准按钮
  'emoji',
  'headings',
  'bold',
  'italic',
  'strike',
  'link',
  '|',
  'list',
  'ordered-list',
  'check',
  'outdent',
  'indent',
  '|',
  'quote',
  'line',
  'code',
  'inline-code',
  'insert-before',
  'insert-after',
  '|',
  // 插入图片
  {
    name: 'insert-image',
    tipPosition: 's',
    tip: '插入图片',
    hotkey: '⌘+shift+i',
    className: 'insert-image',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
    click: insertImage,
  },
  'upload',
  'table',
  '|',

  // Mermaid 图表
  {
    name: 'mermaid',
    tipPosition: 's',
    tip: '插入 Mermaid 图表',
    hotkey: '⌘+shift+m',
    className: 'mermaid',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    click: insertMermaidChart,
  },

  // PlantUML 图表
  {
    name: 'plantuml',
    tipPosition: 's',
    tip: '插入 PlantUML 图表',
    hotkey: '⌘+shift+p',
    className: 'plantuml',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11h8M8 15h8" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="9" r="1" fill="currentColor"/><circle cx="18" cy="9" r="1" fill="currentColor"/></svg>',
    click: insertPlantUMLChart,
  },

  // ECharts 图表
  {
    name: 'echarts',
    tipPosition: 's',
    tip: '插入 ECharts 图表',
    hotkey: '⌘+shift+e',
    className: 'echarts',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z"/></svg>',
    click: insertEChartsChart,
  },

  // 五线谱
  {
    name: 'staff',
    tipPosition: 's',
    tip: '插入五线谱',
    hotkey: '⌘+shift+n',
    className: 'staff',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><path d="M3 4h18v1H3V4zm0 3h18v1H3V7zm0 3h18v1H3v-1zm0 3h18v1H3v-1zm0 3h18v1H3v-1z"/><circle cx="8" cy="8.5" r="1.5"/><circle cx="16" cy="11.5" r="1.5"/><path d="M9.5 8.5v5m0-5l6.5 3"/></svg>',
    click: insertStaffNotation,
  },

  // 数学公式块
  {
    name: 'math-block',
    tipPosition: 's',
    tip: '插入数学公式块',
    hotkey: '⌘+shift+b',
    className: 'math-block',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><path d="M7 4h2v16H7V4zm4 0h2v16h-2V4zm4 0h2v16h-2V4z"/><path d="M5 12h14v-2H5v2z" fill="currentColor"/></svg>',
    click: insertMathBlock,
  },

  // 行级数学公式
  {
    name: 'inline-math',
    tipPosition: 's',
    tip: '插入行级数学公式',
    hotkey: '⌘+shift+i',
    className: 'inline-math',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="13" text-anchor="middle" font-size="8" font-family="monospace">∑</text></svg>',
    click: insertInlineMath,
  },
  '|',
  'undo',
  'redo',
  '|',
  { name: 'edit-mode', tipPosition: 'e' },
  
  // 更多选项菜单
  {
    name: 'more',
    tipPosition: 'e',
    toolbar: [
      'both',
      'code-theme',
      'content-theme',
      'outline',
      'preview',
      {
        name: 'copy-markdown',
        icon: t('copyMarkdown'),
        click: copyMarkdownContent,
      },
      {
        name: 'copy-html',
        icon: t('copyHtml'),
        click: copyHtmlContent,
      },
      {
        name: 'reset-config',
        icon: t('resetConfig'),
        click: resetEditorConfig,
      },
      'devtools',
      'info',
      'help',
    ],
  },
].map((item: any) => {
  if (typeof item === 'string') {
    item = { name: item };
  }
  item.tipPosition = item.tipPosition || 's';
  return item;
});
