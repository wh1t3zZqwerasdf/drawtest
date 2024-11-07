<template>
  <div class="toolbar">
    <a-space>
      <!-- 上传按钮 -->
      <a-upload
        accept="image/*"
        :show-upload-list="false"
        :before-upload="handleBeforeUpload"
      >
        <a-button type="primary">
          <template #icon>
            <upload-outlined />
          </template>
          上传图片
        </a-button>
      </a-upload>

      <!-- 添加翻转按钮 -->
      <a-button 
        @click="handleRotate(90)"
        :disabled="!hasImage"
      >
        <template #icon>
          <RotateRightOutlined />
        </template>
        向右旋转90°
      </a-button>

      <a-button 
        @click="handleRotate(-90)"
        :disabled="!hasImage"
      >
        <template #icon>
          <RotateLeftOutlined />
        </template>
        向左旋转90°
      </a-button>

      <a-button 
        :type="toolState.activeTool === 'crop' ? 'primary' : 'default'"
        @click="toggleCropTool"
        :disabled="!hasImage"
      >
        <template #icon>
          <ScissorOutlined />
        </template>
        裁切
      </a-button>

      <!-- 当裁切工具激活时显示的确认和取消按钮 -->
      <template v-if="toolState.activeTool === 'crop'">
        <a-button type="primary" @click="confirmCrop">
          <template #icon>
            <CheckOutlined />
          </template>
          确认
        </a-button>
        <a-button @click="cancelCrop">
          <template #icon>
            <CloseOutlined />
          </template>
          取消
        </a-button>
      </template>
    </a-space>

      <!-- 其他工具按钮 -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  UploadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ScissorOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import type { ToolState, ImageState } from '@/types';

const props = defineProps<{
  toolState: ToolState;
  canUndo: boolean;
  canRedo: boolean;
  imageState: ImageState; // 添加 imageState 属性
}>();

const emit = defineEmits<{
  (e: 'update:toolState', state: ToolState): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'imageSelected', file: File): void;
  (e: 'rotate', angle: number): void;
  (e: 'crop', action: 'confirm' | 'cancel'): void;

}>();

const hasImage = computed(() => !!props.imageState.url);

// 处理旋转
const handleRotate = (angle: number) => {
  emit('rotate', angle);
};

// 处理上传前的验证
const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 验证文件类型
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false;
  }

  // 验证文件大小 (这里设置最大为 10MB)
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('图片必须小于 10MB!');
    return false;
  }

  // 触发图片选择事件
  emit('imageSelected', file);
  
  // 返回 false 阻止自动上传
  return false;
};

// 切换裁切工具
const toggleCropTool = () => {
  emit('update:toolState', {
    ...props.toolState,
    activeTool: props.toolState.activeTool === 'crop' ? null : 'crop'
  });
};

// 确认裁切
const confirmCrop = () => {
  emit('crop', 'confirm');
};

// 取消裁切
const cancelCrop = () => {
  emit('crop', 'cancel');
};


</script>

<style scoped>
.toolbar {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
</style>