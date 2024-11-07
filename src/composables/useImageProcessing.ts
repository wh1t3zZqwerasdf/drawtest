import { ref } from 'vue';
import type { Ref } from 'vue';
import type { ImageState, Point } from '@/types';

export function useImageProcessing(
  canvasRef: Ref<HTMLCanvasElement | null>,
  contextRef: Ref<CanvasRenderingContext2D | null>
) {
  // 当前是否正在绘制
  const isDrawing = ref(false);
  // 上一个绘制点
  const lastPoint = ref<Point | null>(null);

  // 处理图片
  const processImage = async (state: ImageState) => {
    if (!canvasRef.value || !contextRef.value || !state.url) return;

    const ctx = contextRef.value;
    const image = new Image();

    return new Promise<void>((resolve, reject) => {
      image.onload = () => {
        try {
          // 保存画布状态
          ctx.save();

          // 清空画布
          ctx.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);

          // 设置画布尺寸为图片尺寸
          canvasRef.value!.width = image.width;
          canvasRef.value!.height = image.height;

          // 应用变换
          const centerX = canvasRef.value!.width / 2;
          const centerY = canvasRef.value!.height / 2;

          // 移动到中心点
          ctx.translate(centerX, centerY);

          // 应用旋转
          ctx.rotate((state.rotation * Math.PI) / 180);

          // 应用缩放
          ctx.scale(state.scale, state.scale);

          // 应用滤镜
          ctx.filter = `
            brightness(${state.brightness}%)
            contrast(${state.contrast}%)
            saturate(${state.saturation}%)
          `;

          // 绘制图片
          ctx.drawImage(
            image,
            -image.width / 2,
            -image.height / 2,
            image.width,
            image.height
          );

          // 恢复画布状态
          ctx.restore();

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = reject;
      image.src = state.url;
    });
  };

  // 橡皮擦功能
  const erase = (point: Point, size: number) => {
    if (!contextRef.value) return;
    
    const ctx = contextRef.value;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // 添加文字
  const addText = (text: string, point: Point, fontSize: number, color: string) => {
    if (!contextRef.value) return;

    const ctx = contextRef.value;
    ctx.save();
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, point.x, point.y);
    ctx.restore();
  };

  // 裁剪功能
  const crop = (startPoint: Point, endPoint: Point) => {
    if (!canvasRef.value || !contextRef.value) return;

    const ctx = contextRef.value;
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);

    // 获取裁剪区域的图像数据
    const imageData = ctx.getImageData(x, y, width, height);

    // 调整画布大小
    canvasRef.value.width = width;
    canvasRef.value.height = height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 将裁剪的图像数据放回画布
    ctx.putImageData(imageData, 0, 0);
  };

  // 手工纠偏
  const rotate = (angle: number) => {
    if (!canvasRef.value || !contextRef.value) return;

    const ctx = contextRef.value;
    const canvas = canvasRef.value;

    // 保存当前画布内容
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 计算旋转后的画布尺寸
    const radians = (angle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = Math.floor(canvas.width * cos + canvas.height * sin);
    const newHeight = Math.floor(canvas.height * cos + canvas.width * sin);

    // 调整画布大小
    canvas.width = newWidth;
    canvas.height = newHeight;

    // 移动到新画布中心
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(
      canvas,
      -imageData.width / 2,
      -imageData.height / 2
    );

    // 重置变换
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  // 去黑边框
  const removeBlackBorders = (threshold: number = 10) => {
    if (!canvasRef.value || !contextRef.value) return;

    const ctx = contextRef.value;
    const canvas = canvasRef.value;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 检查像素是否为黑色
    const isBlack = (index: number) => {
      return (
        data[index] <= threshold &&
        data[index + 1] <= threshold &&
        data[index + 2] <= threshold
      );
    };

    // 查找边界
    let top = 0;
    let bottom = canvas.height;
    let left = 0;
    let right = canvas.width;

    // 从上往下扫描
    topScan: for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        if (!isBlack(index)) {
          top = y;
          break topScan;
        }
      }
    }

    // 从下往上扫描
    bottomScan: for (let y = canvas.height - 1; y >= 0; y--) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        if (!isBlack(index)) {
          bottom = y + 1;
          break bottomScan;
        }
      }
    }

    // 从左往右扫描
    leftScan: for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const index = (y * canvas.width + x) * 4;
        if (!isBlack(index)) {
          left = x;
          break leftScan;
        }
      }
    }

    // 从右往左扫描
    rightScan: for (let x = canvas.width - 1; x >= 0; x--) {
      for (let y = 0; y < canvas.height; y++) {
        const index = (y * canvas.width + x) * 4;
        if (!isBlack(index)) {
          right = x + 1;
          break rightScan;
        }
      }
    }

    // 裁剪图像
    const width = right - left;
    const height = bottom - top;
    const croppedImageData = ctx.getImageData(left, top, width, height);

    // 调整画布大小并绘制裁剪后的图像
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(croppedImageData, 0, 0);
  };

  return {
    processImage,
    erase,
    addText,
    crop,
    rotate,
    removeBlackBorders,
    isDrawing,
    lastPoint,
  };
}