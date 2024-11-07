<template>
  <div class="app">
    <a-config-provider :locale="zhCN">
      <div class="image-processor">
        <Toolbar
          v-model:toolState="toolState"
          :can-undo="canUndo"
          :can-redo="canRedo"
          :image-state="currentState"
          @undo="undo"
          @redo="redo"
          @imageSelected="handleImageSelected"
          @rotate="handleRotate"
          @crop="handleCrop"
        />
        
        <ImageCanvas
          ref="imageCanvasRef"
          v-model:imageState="currentState"
          :tool-state="toolState"
        />
        
        <Controls
          v-model:imageState="currentState"
        />
      </div>
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { ImageCanvas, Toolbar, Controls } from '../src/components';
import { useImageHistory } from '../src/composables/useImageHistory';
import type { ImageState, ToolState } from '@/types';

const initialImageState: ImageState = {
  url: '',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  scale: 1,
};

const initialToolState: ToolState = {
  activeTool: null,
  eraserSize: 20,
  textContent: '',
  fontSize: 16,
  color: '#000000',
};

const toolState = ref<ToolState>(initialToolState);
const {
  currentState,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
} = useImageHistory(initialImageState);

// 处理图片选择
const handleImageSelected = async (file: File) => {
  try {
    // 创建文件的URL
    const url = URL.createObjectURL(file);
    
    // 更新状态
    pushState({
      ...currentState,
      url,
      // 重置图片处理状态
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      scale: 1,
    });

    message.success('图片上传成功！');
  } catch (error) {
    message.error('图片处理失败，请重试！');
    console.error('Error processing image:', error);
  }
};

// 处理旋转
const handleRotate = (angle: number) => {
  if (currentState.url) {
    pushState({
      ...currentState,
      rotation: (currentState.rotation + angle) % 360
    });
  }
};

const imageCanvasRef = ref<InstanceType<typeof ImageCanvas> | null>(null);

// 处理裁切
const handleCrop = (action: 'confirm' | 'cancel') => {
  if (!imageCanvasRef.value) return;
  
  if (action === 'confirm') {
    imageCanvasRef.value.performCrop();
    // 重置工具状态
    toolState.value.activeTool = null;
  } else {
    imageCanvasRef.value.cancelCrop();
    toolState.value.activeTool = null;
  }
};
</script>

<style>
.app {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.image-processor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>