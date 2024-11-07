import { ref, reactive,computed } from 'vue';
import type { ImageState } from '../types';

const MAX_HISTORY = 20;

export function useImageHistory(initialState: ImageState) {
  const currentState = reactive<ImageState>({ ...initialState });
  const history = ref<ImageState[]>([initialState]);
  const currentIndex = ref(0);

  const pushState = (newState: ImageState) => {
    const newHistory = history.value.slice(0, currentIndex.value + 1);
    newHistory.push({ ...newState });
    
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    
    history.value = newHistory;
    currentIndex.value = newHistory.length - 1;
    Object.assign(currentState, newState);
  };

  const undo = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      Object.assign(currentState, history.value[currentIndex.value]);
    }
  };

  const redo = () => {
    if (currentIndex.value < history.value.length - 1) {
      currentIndex.value++;
      Object.assign(currentState, history.value[currentIndex.value]);
    }
  };

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo: computed(() => currentIndex.value > 0),
    canRedo: computed(() => currentIndex.value < history.value.length - 1),
  };
}