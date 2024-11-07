<template>
  <div 
    class="canvas-container" 
    ref="containerRef"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <canvas 
      ref="canvasRef" 
      :style="canvasStyle"
    />
    
    <!-- 裁切遮罩层 -->
    <div 
      v-if="toolState.activeTool === 'crop' && cropArea.isSelecting"
      class="crop-overlay"
    >
      <!-- 暗色遮罩 -->
      <div class="crop-mask" />
      
      <!-- 裁切区域 -->
      <div 
        class="crop-area"
        :style="cropAreaStyle"
      >
        <!-- 四角调整点 -->
        <div v-for="handle in cropHandles" 
          :key="handle"
          :class="['crop-handle', `crop-handle-${handle}`]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useCanvas } from '@/composables/useCanvas';
import { useImageProcessing } from '@/composables/useImageProcessing';
import type { ImageState, ToolState, Point } from '@/types';

const props = defineProps<{
  imageState: ImageState;
  toolState: ToolState;
}>();

const emit = defineEmits<{
  (e: 'update:imageState', state: ImageState): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const { canvasRef, contextRef, initializeImage } = useCanvas();
const { processImage } = useImageProcessing(canvasRef, contextRef);

// 裁切相关状态
interface CropArea {
  startX: number;
  startY: number;
  width: number;
  height: number;
  isSelecting: boolean;
}

const cropArea = ref<CropArea>({
  startX: 0,
  startY: 0,
  width: 0,
  height: 0,
  isSelecting: false
});

const cropHandles = ['nw', 'ne', 'sw', 'se'];

// 计算画布样式
const canvasStyle = computed(() => ({
  transform: `rotate(${props.imageState.rotation}deg)`,
  maxWidth: '100%',
  maxHeight: '100%',
  transition: 'transform 0.3s ease'
}));

// 计算裁切区域样式
const cropAreaStyle = computed(() => ({
  left: `${cropArea.value.startX}px`,
  top: `${cropArea.value.startY}px`,
  width: `${cropArea.value.width}px`,
  height: `${cropArea.value.height}px`
}));

// 监听图片状态变化
watch(
  () => props.imageState,
  async (newState) => {
    if (newState.url) {
      try {
        await processImage(newState);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  },
  { deep: true }
);

// 处理鼠标事件
const handleMouseDown = (e: MouseEvent) => {
  if (props.toolState.activeTool !== 'crop') return;
  
  const rect = containerRef.value!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  cropArea.value = {
    startX: x,
    startY: y,
    width: 0,
    height: 0,
    isSelecting: true
  };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!cropArea.value.isSelecting) return;
  
  const rect = containerRef.value!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  cropArea.value.width = x - cropArea.value.startX;
  cropArea.value.height = y - cropArea.value.startY;
};

const handleMouseUp = () => {
  if (cropArea.value.isSelecting) {
    // 确保宽高为正数
    if (cropArea.value.width < 0) {
      cropArea.value.startX += cropArea.value.width;
      cropArea.value.width = Math.abs(cropArea.value.width);
    }
    if (cropArea.value.height < 0) {
      cropArea.value.startY += cropArea.value.height;
      cropArea.value.height = Math.abs(cropArea.value.height);
    }
    
    cropArea.value.isSelecting = false;
  }
};

// 执行裁切
const performCrop = () => {
  if (!contextRef.value || !canvasRef.value) return;
  
  const ctx = contextRef.value;
  const canvas = canvasRef.value;
  
  // 获取裁切区域的图像数据
  const imageData = ctx.getImageData(
    cropArea.value.startX,
    cropArea.value.startY,
    cropArea.value.width,
    cropArea.value.height
  );
  
  // 调整画布大小
  canvas.width = cropArea.value.width;
  canvas.height = cropArea.value.height;
  
  // 绘制裁切后的图像
  ctx.putImageData(imageData, 0, 0);
  
  // 重置裁切区域
  cropArea.value = {
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
    isSelecting: false
  };

  // 更新图片状态
  emit('update:imageState', {
    ...props.imageState,
    width: canvas.width,
    height: canvas.height
  });
};

// 取消裁切
const cancelCrop = () => {
  cropArea.value = {
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
    isSelecting: false
  };
};

// 初始化
onMounted(async () => {
  if (props.imageState.url) {
    try {
      await processImage(props.imageState);
    } catch (error) {
      console.error('Error processing initial image:', error);
    }
  }
});

// 暴露方法给父组件
defineExpose({
  performCrop,
  cancelCrop
});
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  overflow: hidden;
}

canvas {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.crop-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.crop-area {
  position: absolute;
  border: 2px solid #1890ff;
  background: transparent;
  pointer-events: all;
  cursor: move;
}

.crop-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #1890ff;
}

.crop-handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.crop-handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
.crop-handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.crop-handle-se { bottom: -4px; right: -4px; cursor: se-resize; }

/* 添加一些响应式样式 */
@media (max-width: 768px) {
  .canvas-container {
    height: 400px;
  }
  
  .crop-handle {
    width: 12px;
    height: 12px;
  }
}
</style>