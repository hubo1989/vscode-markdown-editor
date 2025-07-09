# 🎨 External CSS Feature Testing

This file is designed to test the newly added external CSS loading functionality.

## 🚀 How to Test

1. Open VS Code settings (`Cmd+,` or `Ctrl+,`)
2. Search for `markdown-editor`
3. Configure the following settings:

```json
{
  "markdown-editor.externalCssFiles": [
    "./example-styles.css"
  ],
  "markdown-editor.cssLoadOrder": "external-first"
}
```

4. Save the settings
5. Open this file with the markdown editor - you should see a magical gradient background and golden titles ✨

## 🎭 Feature Demo

### 📝 Header Styles

## H2 Header

### H3 Header

#### H4 Header

### 💻 Code Block Styles

```javascript
function testExternalCSS() {
    console.log('External CSS is working!');
    return true;
}
```

### 🔤 Inline Code

This is an `inline code` example.

### 🔗 Link Styles

[This is a test link](https://github.com)

### 📊 Table Styles

| Feature | Status | Description |
|---------|--------|-------------|
| HTTP/HTTPS URL | ✅ | Support network CSS resources |
| Local file path | ✅ | Support absolute and relative paths |
| Config hot reload | ✅ | Auto-apply configuration changes |

### 📋 Blockquote Styles

> This is a blockquote used to test external CSS blockquote styles.
> It should have a golden left border and semi-transparent background.

### 📄 List Styles

- First item
- Second item
- Third item

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

## ⚙️ Multiple CSS Configuration Examples

### 🌐 Using Network CSS Resources

```json
{
  "markdown-editor.externalCssFiles": [
    "https://cdn.jsdelivr.net/npm/github-markdown-css@4.0.0/github-markdown.css"
  ]
}
```

### 📚 Using Multiple CSS Files

```json
{
  "markdown-editor.externalCssFiles": [
    "./styles/base.css",
    "./styles/theme.css", 
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
  ]
}
```

### 🎯 Custom CSS Priority

```json
{
  "markdown-editor.cssLoadOrder": "custom-first",
  "markdown-editor.customCss": "h1 { color: red !important; }",
  "markdown-editor.externalCssFiles": ["./theme.css"]
}
```

After saving this file, try modifying the CSS configuration in VS Code settings - the editor should automatically apply the new styles! 🎉
