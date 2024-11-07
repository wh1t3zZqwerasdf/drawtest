<template>
  <div class="controls">
    <a-space direction="vertical" style="width: 100%">
      <div class="control-item">
        <div class="label">亮度</div>
        <a-slider
          :value="imageState.brightness"
          :min="0"
          :max="200"
          @change="handleBrightnessChange"
        />
      </div>

      <div class="control-item">
        <div class="label">对比度</div>
        <a-slider
          :value="imageState.contrast"
          :min="0"
          :max="200"
          @change="handleContrastChange"
        />
      </div>

      <div class="control-item">
        <div class="label">饱和度</div>
        <a-slider
          :value="imageState.saturation"
          :min="0"
          :max="200"
          @change="handleSaturationChange"
        />
      </div>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import type { ImageState } from '@/types';

const props = defineProps<{
  imageState: ImageState;
}>();

const emit = defineEmits<{
  (e: 'update:imageState', state: ImageState): void;
}>();

const handleBrightnessChange = (value: number) => {
  emit('update:imageState', { ...props.imageState, brightness: value });
};

const handleContrastChange = (value: number) => {
  emit('update:imageState', { ...props.imageState, contrast: value });
};

const handleSaturationChange = (value: number) => {
  emit('update:imageState', { ...props.imageState, saturation: value });
};
</script>