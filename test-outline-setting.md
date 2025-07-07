# 测试大纲显示设置功能

这个文件用来测试新增的大纲显示设置功能。

## 如何测试

1. 打开VS Code设置（`Cmd+,` 或 `Ctrl+,`）
2. 搜索 `markdown-editor.showOutlineByDefault`
3. 勾选或取消勾选该选项
4. 重新打开markdown文件，观察大纲面板的默认状态

## 配置说明

### `markdown-editor.showOutlineByDefault`
- **类型**: `boolean`
- **默认值**: `true`
- **描述**: 是否在打开markdown文件时默认显示大纲面板

## 使用示例

### 默认显示大纲
```json
{
  "markdown-editor.showOutlineByDefault": true
}
```

### 默认隐藏大纲
```json
{
  "markdown-editor.showOutlineByDefault": false
}
```

## 功能结构测试

### 一级标题 1
内容1

#### 三级标题 1.1
子内容1.1

### 一级标题 2
内容2

#### 三级标题 2.1
子内容2.1

##### 四级标题 2.1.1
子内容2.1.1

#### 三级标题 2.2
子内容2.2

### 一级标题 3
内容3

## 测试步骤

1. **设置为true**: 
   - 配置 `"markdown-editor.showOutlineByDefault": true`
   - 打开这个md文件
   - 应该看到大纲面板默认显示

2. **设置为false**:
   - 配置 `"markdown-editor.showOutlineByDefault": false`
   - 重新打开这个md文件
   - 大纲面板应该默认隐藏

3. **动态配置更新**:
   - 在文件打开状态下修改配置
   - 大纲面板状态应该自动更新

## 预期行为

- ✅ 配置为true时，大纲面板默认显示
- ✅ 配置为false时，大纲面板默认隐藏
- ✅ 配置更改时实时更新大纲面板状态
- ✅ 与其他编辑器功能正常配合工作
