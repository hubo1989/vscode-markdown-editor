# Vditor 工具栏和右键菜单配置指南

## 📋 当前配置概览

### 🛠️ 工具栏配置位置
- **配置文件**: `media-src/src/features/toolbar/toolbarConfig.ts`
- **初始化位置**: `media-src/src/core/editorInit.ts` (第79行)
- **配置入口**: `toolbar` 变量

### 🎯 VS Code 扩展右键菜单配置
- **配置位置**: `package.json` 中的 `menus` 部分
- **作用范围**: 文件资源管理器和编辑器标题栏

---

## 🛠️ 工具栏配置详解

### 当前工具栏结构

```typescript
export const toolbar = [
  // 1. 自定义保存按钮
  {
    hotkey: '⌘s',
    name: 'save',
    tipPosition: 's',
    tip: t('save'),
    className: 'save',
    icon: '<svg>...</svg>',
    click: saveDocument,
  },

  // 2. 基础格式工具
  'emoji',           // 表情
  'headings',        // 标题
  'bold',            // 粗体
  'italic',          // 斜体
  'strike',          // 删除线
  'link',            // 链接

  // 3. 分隔符
  '|',

  // 4. 列表工具
  'list',            // 无序列表
  'ordered-list',    // 有序列表
  'check',           // 任务列表
  'outdent',         // 减少缩进
  'indent',          // 增加缩进

  // 5. 分隔符
  '|',

  // 6. 引用和代码
  'quote',           // 引用
  'line',            // 分割线
  'code',            // 代码块
  'inline-code',     // 行内代码
  'insert-before',   // 前面插入
  'insert-after',    // 后面插入

  // 7. 分隔符
  '|',

  // 8. 媒体和表格
  'upload',          // 上传图片
  'table',           // 表格

  // 9. 分隔符
  '|',

  // 10. 历史操作
  'undo',            // 撤销
  'redo',            // 重做

  // 11. 分隔符
  '|',

  // 12. 编辑模式切换
  { name: 'edit-mode', tipPosition: 'e' },

  // 13. 更多选项下拉菜单
  {
    name: 'more',
    tipPosition: 'e',
    toolbar: [
      'both',           // 分屏预览
      'code-theme',     // 代码主题
      'content-theme',  // 内容主题
      'outline',        // 大纲
      'preview',        // 预览模式
      'devtools',       // 开发工具
      'info',           // 信息
      'help',           // 帮助
    ],
  },
];
```

### 工具栏按钮类型

#### 1. 简单字符串按钮
```typescript
export const toolbar = [
  'bold',
  'italic',
  'link',
];
```

#### 2. 自定义按钮对象
```typescript
{
  name: 'custom-button',
  tip: '自定义按钮',
  tipPosition: 's',        // 提示位置: 'n'(北), 's'(南), 'e'(东), 'w'(西)
  hotkey: '⌘+shift+u',     // 快捷键
  className: 'custom-icon', // CSS类名
  icon: '<svg>...</svg>',   // SVG图标
  click: () => {
    // 点击处理函数
    console.log('自定义按钮被点击');
  }
}
```

#### 3. 下拉菜单按钮
```typescript
{
  name: 'more',
  tipPosition: 'e',
  toolbar: [
    'preview',
    'outline',
    {
      name: 'custom-action',
      icon: '自定义操作',
      click: () => {
        // 操作逻辑
      }
    }
  ]
}
```

---

## 🎯 右键菜单配置

### VS Code 扩展右键菜单

当前项目有以下右键菜单配置：

```json
"menus": {
  // 文件资源管理器右键菜单
  "explorer/context": [
    {
      "when": "resourceLangId == markdown",
      "command": "markdown-editor.openEditor",
      "group": "navigation"
    }
  ],

  // 编辑器标题栏右键菜单
  "editor/title/context": [
    {
      "when": "resourceLangId == markdown",
      "command": "markdown-editor.openEditor",
      "group": "1_open"
    }
  ],

  // 编辑器标题栏按钮
  "editor/title": [
    {
      "when": "resourceLangId == markdown && !activeWebviewPanelId",
      "command": "markdown-editor.openInSplit",
      "group": "navigation@2",
      "icon": "$(pencil)"
    }
  ],

  // Webview 右键菜单
  "webview/context": [
    {
      "command": "markdown-editor.find",
      "when": "webviewId == 'markdown-editor'",
      "group": "navigation"
    },
    {
      "command": "markdown-editor.findReplace",
      "when": "webviewId == 'markdown-editor'",
      "group": "navigation"
    }
  ]
}
```

---

## 🎨 自定义配置示例

### 示例 1: 添加 PlantUML 快捷按钮

修改 `media-src/src/features/toolbar/toolbarConfig.ts`：

```typescript
/**
 * 插入 PlantUML 模板
 */
function insertPlantUMLTemplate(): void {
  const template = `@startuml
@startuml
Alice -> Bob: 请求认证
Bob -> Alice: 认证响应
@enduml

`;

  const vditor = window.vditor;
  const position = vditor.getCursorPosition();
  vditor.insertValue(template, position);
}

// 在 toolbar 数组中添加
{
  name: 'plantuml',
  tip: '插入 PlantUML',
  tipPosition: 's',
  hotkey: '⌘+shift+p',
  className: 'plantuml',
  icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6"/>
    <path d="M2 17L12 22L22 17" stroke="#3B82F6" stroke-width="2" fill="none"/>
    <path d="M2 12L12 17L22 12" stroke="#3B82F6" stroke-width="2" fill="none"/>
  </svg>`,
  click: insertPlantUMLTemplate,
}
```

### 示例 2: 添加图表工具组

```typescript
{
  name: 'charts',
  tip: '图表工具',
  tipPosition: 's',
  className: 'charts',
  icon: '<svg>...</svg>',
  toolbar: [
    {
      name: 'plantuml',
      icon: 'PlantUML',
      click: insertPlantUMLTemplate,
    },
    {
      name: 'mermaid',
      icon: 'Mermaid',
      click: () => {
        const template = `\`\`\`mermaid
graph TD
    A[开始] --> B[处理]
    B --> C[结束]
\`\`\``;
        window.vditor.insertValue(template);
      }
    },
    {
      name: 'flowchart',
      icon: '流程图',
      click: () => {
        const template = `\`\`\`flowchart
st=>start: 开始
op=>operation: 处理
e=>end: 结束
st->op->e\`\`\``;
        window.vditor.insertValue(template);
      }
    }
  ]
}
```

### 示例 3: 修改现有工具栏

```typescript
export const toolbar = [
  // 保留保存按钮
  {
    hotkey: '⌘s',
    name: 'save',
    tip: '保存',
    icon: '<svg>...</svg>',
    click: saveDocument,
  },

  // 添加新的工具组
  {
    name: 'format-advanced',
    tip: '高级格式',
    tipPosition: 's',
    toolbar: [
      'bold',
      'italic',
      'underline',
      'strike',
      '|',
      {
        name: 'highlight',
        tip: '高亮',
        icon: '📝',
        click: () => {
          const selected = window.vditor.getSelection();
          window.vditor.insertValue(`<mark>${selected}</mark>`);
        }
      }
    ]
  },

  // 简化基础工具
  'headings',
  'link',
  '|',
  'list',
  'ordered-list',
  '|',
  'code',
  'table',
  '|',
  'undo',
  'redo'
];
```

### 示例 4: 添加右键菜单项

在 `package.json` 中添加新的菜单命令：

```json
{
  "contributes": {
    "commands": [
      {
        "command": "markdown-editor.insertPlantUML",
        "title": "插入 PlantUML 图表",
        "category": "markdown-editor"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "when": "resourceLangId == markdown",
          "command": "markdown-editor.insertPlantUML",
          "group": "1_modification"
        }
      ]
    }
  }
}
```

---

## 🔧 配置集成

### 修改工具栏配置的步骤

1. **编辑工具栏配置文件**:
   ```bash
   # 打开配置文件
   open media-src/src/features/toolbar/toolbarConfig.ts
   ```

2. **添加自定义按钮函数**:
   ```typescript
   function customAction(): void {
     // 实现自定义逻辑
   }
   ```

3. **在 toolbar 数组中添加按钮**:
   ```typescript
   {
     name: 'custom',
     tip: '自定义',
     click: customAction
   }
   ```

4. **重新编译**:
   ```bash
   npm run build
   ```

5. **测试功能**:
   - 按 F5 启动调试
   - 在编辑器中测试新按钮

### 工具栏配置选项详解

```typescript
{
  name: string,              // 按钮名称 (必需)
  tip?: string,              // 提示文本
  tipPosition?: 'n'|'s'|'e'|'w',  // 提示位置
  hotkey?: string,           // 快捷键组合
  className?: string,        // 自定义CSS类名
  icon?: string,             // SVG图标HTML
  click?: () => void,        // 点击处理函数
  toolbar?: any[],           // 子工具栏 (用于下拉菜单)
  prefix?: string,           // 前缀按钮
  suffix?: string            // 后缀按钮
}
```

---

## 🎯 最佳实践

### 1. 按钮分组
使用 `'|'` 分隔符对相关按钮进行分组：
```typescript
[
  'bold', 'italic', 'underline',  // 文本格式组
  '|',
  'list', 'ordered-list',        // 列表组
  '|',
  'link', 'image',                // 媒体组
]
```

### 2. 快捷键规范
- **Mac**: 使用 `⌘` (Command) 符号
- **Windows/Linux**: 使用 `Ctrl`
- **常用组合**: `⌘+B` (粗体), `⌘+I` (斜体), `⌘+S` (保存)

### 3. 图标设计
- 使用 SVG 格式图标
- 保持 24x24 像素的统一尺寸
- 使用项目主题色 `#3B82F6`

### 4. 国际化支持
```typescript
import { t } from '../../i18n/lang';

{
  name: 'save',
  tip: t('save'),  // 使用翻译函数
  icon: saveIcon
}
```

---

## 📚 参考资源

- **Vditor 官方文档**: https://vditor.duty.run/
- **Vditor GitHub**: https://github.com/Vanessa219/vditor
- **VS Code 扩展API**: https://code.visualstudio.com/api

---

## 🚀 下一步

1. 根据需要修改 `toolbarConfig.ts` 文件
2. 添加自定义按钮功能
3. 测试工具栏配置
4. 如需 VS Code 右键菜单，修改 `package.json`
5. 重新编译和测试