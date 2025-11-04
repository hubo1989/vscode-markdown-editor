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
 * 导出为 PDF
 */
function exportToPDF(): void {
  const vditor = window.vditor;
  const content = vditor.getHTML();
  const title = document.title || 'Markdown Document';

  // 创建一个包含样式的完整 HTML 文档
  const fullHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      @import url('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css');
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      table, th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f5f5f5; font-weight: bold; }
      pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
      code { background-color: #f6f8fa; padding: 2px 4px; border-radius: 3px; }
      blockquote { border-left: 4px solid #dfe2e5; padding-left: 16px; margin: 0; color: #6a737d; }
      img { max-width: 100%; height: auto; }
      .mermaid, .plantuml, .echarts { text-align: center; margin: 20px 0; }
      .katex-display { margin: 20px 0; }
    </style>
  </head>
  <body>
    ${content}
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ]
        });
      });
    </script>
  </body>
  </html>`;

  // 创建一个新的窗口进行打印
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();

    // 等待内容加载完成后触发打印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  } else {
    sendMessageToVSCode({
      command: 'error',
      content: '无法打开打印窗口，请检查浏览器弹窗设置',
    });
  }
}

/**
 * 导出为 Word
 */
function exportToWord(): void {
  const vditor = window.vditor;
  const content = vditor.getHTML();

  // 处理图片，转换为 Base64 以便嵌入到 Word 文档中
  const processImages = async (html: string): Promise<string> => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const images = tempDiv.querySelectorAll('img');
    for (const img of images) {
      try {
        // 如果图片是网络图片，转换为 Base64
        if (img.src.startsWith('http')) {
          const response = await fetch(img.src);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = base64;
        }
      } catch (error) {
        console.warn('Failed to convert image:', error);
      }
    }

    return tempDiv.innerHTML;
  };

  // 创建一个包含完整样式的 HTML 文档
  const createWordDocument = async (processedContent: string) => {
    const wordHtml = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Document</title>
      <!--[if gte mso 9]>
      <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
      <![endif]-->
      <style>
        @page {
          margin: 2cm;
          size: A4;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #2c3e50;
          margin-top: 24pt;
          margin-bottom: 12pt;
          font-weight: 600;
        }
        h1 { font-size: 18pt; border-bottom: 2pt solid #3498db; padding-bottom: 6pt; }
        h2 { font-size: 16pt; border-bottom: 1pt solid #3498db; padding-bottom: 4pt; }
        h3 { font-size: 14pt; }
        h4 { font-size: 12pt; }
        h5 { font-size: 11pt; }
        h6 { font-size: 10pt; }

        table {
          border-collapse: collapse;
          width: 100%;
          margin: 16pt 0;
          border: 1pt solid #ddd;
        }
        table, th, td {
          border: 1pt solid #ddd;
          padding: 8pt;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          border: 1pt solid #bbb;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }

        pre {
          background-color: #f6f8fa;
          padding: 12pt;
          border: 1pt solid #e1e4e8;
          border-radius: 4pt;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 10pt;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        code {
          background-color: #f6f8fa;
          padding: 2pt 4pt;
          border-radius: 3pt;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 10pt;
          border: 1pt solid #e1e4e8;
        }
        blockquote {
          border-left: 4pt solid #3498db;
          padding-left: 12pt;
          margin: 16pt 0;
          background-color: #f8f9fa;
          padding: 12pt;
          border-radius: 0 4pt 4pt 0;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 12pt auto;
        }
        ul, ol {
          margin-left: 24pt;
          margin-bottom: 12pt;
        }
        li {
          margin-bottom: 4pt;
        }
        a {
          color: #3498db;
          text-decoration: underline;
        }
        p {
          margin: 12pt 0;
        }
        .mermaid, .plantuml, .echarts {
          text-align: center;
          margin: 20pt 0;
          padding: 16pt;
          border: 1pt solid #e1e4e8;
          border-radius: 4pt;
          background-color: #fafbfc;
        }
        .katex-display {
          margin: 20pt 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      ${processedContent}
    </body>
    </html>`;

    return wordHtml;
  };

  // 异步处理并导出
  const processAndExport = async () => {
    try {
      const processedContent = await processImages(content);
      const wordHtml = await createWordDocument(processedContent);

      // 创建 Blob 对象
      const blob = new Blob([wordHtml], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // 创建下载链接
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'document.doc';
      link.click();

      // 清理
      URL.revokeObjectURL(link.href);

      sendMessageToVSCode({
        command: 'info',
        content: 'Word 文档导出成功！',
      });
    } catch (error) {
      console.error('Word export error:', error);
      sendMessageToVSCode({
        command: 'error',
        content: 'Word 导出失败，请重试',
      });
    }
  };

  processAndExport();
}

/**
 * 导出为 HTML
 */
function exportToHTML(): void {
  const vditor = window.vditor;
  const content = vditor.getHTML();
  const title = document.title || 'Markdown Document';

  // 创建完整的 HTML 文档
  const fullHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
        color: #333;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      table, th, td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
      }
      th {
        background-color: #f8f9fa;
        font-weight: bold;
        border-top: 2px solid #dee2e6;
      }
      tr:nth-child(even) { background-color: #f8f9fa; }
      pre {
        background-color: #f6f8fa;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        border: 1px solid #e1e4e8;
      }
      code {
        background-color: #f6f8fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.9em;
        border: 1px solid #e1e4e8;
      }
      blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 16px;
        margin: 0;
        color: #6a737d;
        background-color: #f8f9fa;
        padding: 16px;
        border-radius: 0 6px 6px 0;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .mermaid, .plantuml, .echarts {
        text-align: center;
        margin: 20px 0;
        padding: 20px;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        background-color: #fafbfc;
      }
      .katex-display { margin: 20px 0; }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 30px;
        margin-bottom: 20px;
        color: #24292e;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 10px;
      }
      h1 { border-bottom: 2px solid #e1e4e8; }
      a { color: #0366d6; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    ${content}
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        // 渲染数学公式
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ]
        });

        // 初始化 Mermaid
        mermaid.initialize({ startOnLoad: true });

        // 渲染 PlantUML 图片
        document.querySelectorAll('.language-plantuml').forEach(element => {
          const code = element.textContent.trim();
          const img = document.createElement('img');
          img.src = \`https://www.plantuml.com/plantuml/svg/\${btoa(code)}\`;
          img.alt = code;
          img.style.maxWidth = '100%';
          element.parentNode.replaceChild(img, element);
        });

        // 渲染 ECharts
        document.querySelectorAll('.language-echarts').forEach(element => {
          const code = element.textContent.trim();
          try {
            const option = JSON.parse(code);
            const container = document.createElement('div');
            container.style.width = '100%';
            container.style.height = '400px';
            element.parentNode.replaceChild(container, element);

            // 动态加载 ECharts
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';
            script.onload = function() {
              echarts.init(container).setOption(option);
            };
            document.head.appendChild(script);
          } catch (e) {
            console.error('ECharts parsing error:', e);
          }
        });
      });
    </script>
  </body>
  </html>`;

  // 创建 Blob 对象
  const blob = new Blob([fullHtml], { type: 'text/html' });

  // 创建下载链接
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'document.html';
  link.click();

  // 清理
  URL.revokeObjectURL(link.href);

  sendMessageToVSCode({
    command: 'info',
    content: 'HTML 文件导出成功！',
  });
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
  // 导出按钮
  {
    name: 'export',
    tipPosition: 's',
    tip: '导出文档',
    className: 'export',
    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/><path d="M8 15h8v2H8zm0-4h8v2H8zm0-4h5v2H8z"/></svg>',
    toolbar: [
      {
        name: 'export-pdf',
        tip: '导出为 PDF',
        icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/><path d="M8 12h8v2H8zm0 3h8v2H8z"/></svg>',
        click: exportToPDF,
      },
      {
        name: 'export-word',
        tip: '导出为 Word',
        icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/><path d="M8 12h8v1H8zm0 2h8v1H8zm0-4h5v1H8z"/></svg>',
        click: exportToWord,
      },
      {
        name: 'export-html',
        tip: '导出为 HTML',
        icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
        click: exportToHTML,
      },
    ],
  },
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
