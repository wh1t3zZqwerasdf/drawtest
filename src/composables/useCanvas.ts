import { ref, onMounted } from 'vue';
import type { Ref } from 'vue';

export function useCanvas() {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const contextRef = ref<CanvasRenderingContext2D | null>(null);
  const imageRef = ref<HTMLImageElement | null>(null);

  onMounted(() => {
    if (canvasRef.value) {
      const context = canvasRef.value.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        contextRef.value = context;
      }
    }
  });

  const initializeImage = async (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        if (canvasRef.value && contextRef.value) {
          canvasRef.value.width = image.width;
          canvasRef.value.height = image.height;
          imageRef.value = image;
          resolve(image);
        }
      };
      image.onerror = reject;
    });
  };

  return {
    canvasRef,
    contextRef,
    imageRef,
    initializeImage,
  };
}