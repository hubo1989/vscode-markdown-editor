/**
 * 文件上传处理模块
 */
import { format } from 'date-fns';
import { fileToBase64, sendMessageToVSCode } from '../../utils/common';
import { FileInfo } from '../../types';

/**
 * 创建文件上传配置
 * @returns 上传配置对象
 */
export function createUploadConfig() {
  return {
    url: '/fuzzy', // 没有url参数粘贴图片无法上传
    async handler(files: File[]) {
      try {
        const fileInfos: FileInfo[] = await Promise.all(
          files.map(async (file) => {
            const base64 = await fileToBase64(file);
            // 处理文件名，替换非法字符
            const name = `${format(new Date(), 'yyyyMMdd_HHmmss')}_${file.name}`.replace(
              /[^\w-_.]+/,
              '_'
            );
            
            return { base64, name };
          })
        );
        
        // 发送上传请求到VS Code
        sendMessageToVSCode({
          command: 'upload',
          files: fileInfos,
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    },
  };
}

/**
 * 处理上传成功后的文件插入
 * @param files 上传成功的文件URL列表
 */
export function handleUploadedFiles(files: string[]): void {
  if (!window.vditor) return;
  
  files.forEach((fileUrl) => {
    if (fileUrl.endsWith('.wav')) {
      // 插入音频文件
      window.vditor.insertValue(
        `\n\n<audio controls="controls" src="${fileUrl}"></audio>\n\n`
      );
    } else {
      // 尝试插入图片，如果不是图片则插入链接
      const image = new Image();
      image.src = fileUrl;
      
      image.onload = () => {
        window.vditor.insertValue(`\n\n![](${fileUrl})\n\n`);
      };
      
      image.onerror = () => {
        const fileName = fileUrl.split('/').slice(-1)[0];
        window.vditor.insertValue(`\n\n[${fileName}](${fileUrl})\n\n`);
      };
    }
  });
}
