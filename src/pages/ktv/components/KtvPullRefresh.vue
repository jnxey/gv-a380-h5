<template>
  <div class="pull-refresh" :class="{ following: pullFollowingFinger }" :style="{ height: `${pullDistance}px` }">
    <div v-if="pullRefreshState !== KtvPullRefreshState.IDLE" class="pull-refresh-body">
      <span class="pull-arrow" :class="pullRefreshState"></span>
      <span>{{ pullRefreshText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { KtvPullRefreshSetting, KtvPullRefreshState } from '../../../utils/constants.js';

const props = defineProps({
  refreshing: {
    default: false
  }
});

const emit = defineEmits(['refresh']);

const pullDistance = ref(0);
const pullRefreshState = ref(KtvPullRefreshState.IDLE);
const pullFollowingFinger = ref(false);

let touchStartY = 0;
let touchPulling = false;

/**
 * 指示文案。下拉中、松开和刷新中各一句。
 */
const pullRefreshText = computed(() => {
  if (pullRefreshState.value === KtvPullRefreshState.REFRESHING) {
    return '刷新中';
  }
  if (pullRefreshState.value === KtvPullRefreshState.READY) {
    return '松开刷新';
  }
  return '下拉刷新';
});

/**
 * 页面是否停在顶部。
 */
function pageAtTop() {
  const scrollingElement = document.scrollingElement;
  if (scrollingElement === null) {
    return window.scrollY === 0;
  }
  return scrollingElement.scrollTop === 0;
}

/**
 * 记下按下位置。页面不在顶部或正在刷新时不开始下拉。
 */
function handleTouchStart(event) {
  touchPulling = false;
  if (props.refreshing === true || pullRefreshState.value === KtvPullRefreshState.REFRESHING) {
    return;
  }
  if (pageAtTop() !== true || event.touches.length !== 1) {
    return;
  }
  touchStartY = event.touches[0].clientY;
  touchPulling = true;
}

/**
 * 手指向下拉时撑高指示条。
 */
function handleTouchMove(event) {
  if (touchPulling !== true) {
    return;
  }
  if (pageAtTop() !== true) {
    touchPulling = false;
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = KtvPullRefreshState.IDLE;
    return;
  }
  const pullDelta = event.touches[0].clientY - touchStartY;
  if (pullDelta <= 0) {
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = KtvPullRefreshState.IDLE;
    return;
  }
  event.preventDefault();
  pullFollowingFinger.value = true;
  const nextDistance = Math.min(pullDelta, KtvPullRefreshSetting.MAX_DISTANCE);
  pullDistance.value = nextDistance;
  if (nextDistance >= KtvPullRefreshSetting.THRESHOLD) {
    pullRefreshState.value = KtvPullRefreshState.READY;
    return;
  }
  pullRefreshState.value = KtvPullRefreshState.PULLING;
}

/**
 * 松开时，过了阈值就刷新，否则收回指示条。
 */
function handleTouchEnd() {
  if (touchPulling !== true) {
    return;
  }
  touchPulling = false;
  pullFollowingFinger.value = false;
  if (pullRefreshState.value !== KtvPullRefreshState.READY) {
    pullDistance.value = 0;
    pullRefreshState.value = KtvPullRefreshState.IDLE;
    return;
  }
  pullDistance.value = KtvPullRefreshSetting.THRESHOLD;
  pullRefreshState.value = KtvPullRefreshState.REFRESHING;
  emit('refresh');
}

watch(
  () => props.refreshing,
  (refreshing) => {
    if (refreshing === true) {
      pullDistance.value = KtvPullRefreshSetting.THRESHOLD;
      pullRefreshState.value = KtvPullRefreshState.REFRESHING;
      return;
    }
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = KtvPullRefreshState.IDLE;
  }
);

onMounted(() => {
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd);
  window.addEventListener('touchcancel', handleTouchEnd);
});

onUnmounted(() => {
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('touchend', handleTouchEnd);
  window.removeEventListener('touchcancel', handleTouchEnd);
});
</script>

<style scoped>
.pull-refresh {
  overflow: hidden;
  transition: height 0.2s ease;
}
.pull-refresh.following {
  transition: none;
}
.pull-refresh-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: #6d28d9;
  font-size: 13px;
}
.pull-arrow {
  width: 8px;
  height: 8px;
  border-right: 2px solid #6d28d9;
  border-bottom: 2px solid #6d28d9;
  transform: rotate(45deg) translateY(-2px);
}
.pull-arrow.ready {
  transform: rotate(-135deg) translateY(-1px);
}
.pull-arrow.refreshing {
  width: 14px;
  height: 14px;
  border: 2px solid #ede9fe;
  border-top-color: #6d28d9;
  border-right-color: #ede9fe;
  border-bottom-color: #ede9fe;
  border-radius: 50%;
  transform: none;
  animation: pull-spin 0.8s linear infinite;
}
@keyframes pull-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
