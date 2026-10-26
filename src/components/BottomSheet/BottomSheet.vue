<template>
  <Teleport to="body">
    <Transition
      name="bottom-sheet"
      :duration="BottomSheetMotion.DURATION_MILLISECONDS"
      @after-leave="emit('after-leave')"
    >
      <div v-if="open === true" class="sheet-root" :style="rootStyle">
        <div class="mask" @click="emit('close')"></div>
        <div class="bottom-sheet-panel">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const BottomSheetMotion = {
  DURATION_MILLISECONDS: 280,
};

const props = defineProps({
  open: {
    default: false,
  },
  maskColor: {
    default: 'rgba(17, 24, 39, 0.46)',
  },
  zIndex: {
    default: 21,
  },
});

const emit = defineEmits(['close', 'after-leave']);

/**
 * 外壳的层级和遮罩颜色。各弹窗原来的遮罩色、层级从这里带进来。
 */
const rootStyle = computed(() => {
  return {
    zIndex: props.zIndex,
    '--bottom-sheet-mask': props.maskColor,
    '--bottom-sheet-duration': `${BottomSheetMotion.DURATION_MILLISECONDS}ms`,
  };
});
</script>

<style scoped>
.sheet-root {
  position: fixed;
  inset: 0;
}
.mask {
  position: absolute;
  inset: 0;
  background: var(--bottom-sheet-mask, rgba(17, 24, 39, 0.46));
  overscroll-behavior: none;
}
.bottom-sheet-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.bottom-sheet-panel > :deep(*) {
  pointer-events: auto;
}
.bottom-sheet-enter-active .mask,
.bottom-sheet-leave-active .mask {
  transition: opacity var(--bottom-sheet-duration, 280ms) ease;
}
.bottom-sheet-enter-active .bottom-sheet-panel,
.bottom-sheet-leave-active .bottom-sheet-panel {
  transition: transform var(--bottom-sheet-duration, 280ms) ease;
}
.bottom-sheet-enter-from .mask,
.bottom-sheet-leave-to .mask {
  opacity: 0;
}
.bottom-sheet-enter-from .bottom-sheet-panel,
.bottom-sheet-leave-to .bottom-sheet-panel {
  transform: translateY(100%);
}
</style>
