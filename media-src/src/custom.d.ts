// 声明模块文件类型
declare module '*.scss' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

// 声明全局变量
interface Window {
    vscode: any;
    vditor: any;
    global: any;
}
