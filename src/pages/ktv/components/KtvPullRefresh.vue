<template>
  <div
    class="pull-refresh"
    :class="{ following: pullFollowingFinger }"
    :style="{ height: `${pullDistance}px`, '--pull-progress': pullProgress }"
  >
    <div v-if="pullRefreshState !== KtvPullRefreshState.IDLE" class="pull-refresh-body">
      <svg
        class="pull-mark"
        :class="pullRefreshState"
        :viewBox="`0 0 ${KtvPullRefreshSetting.RING_SIZE} ${KtvPullRefreshSetting.RING_SIZE}`"
      >
        <circle
          class="pull-ring-face"
          :cx="KtvPullRefreshSetting.RING_CENTER"
          :cy="KtvPullRefreshSetting.RING_CENTER"
          :r="KtvPullRefreshSetting.RING_RADIUS"
        />
        <circle
          class="pull-ring-track"
          :cx="KtvPullRefreshSetting.RING_CENTER"
          :cy="KtvPullRefreshSetting.RING_CENTER"
          :r="KtvPullRefreshSetting.RING_RADIUS"
        />
        <circle
          class="pull-ring-progress"
          :cx="KtvPullRefreshSetting.RING_CENTER"
          :cy="KtvPullRefreshSetting.RING_CENTER"
          :r="KtvPullRefreshSetting.RING_RADIUS"
          :stroke-dasharray="ringCircumference"
          :stroke-dashoffset="ringDashOffset"
        />
        <path class="pull-arrow-path" d="M18 11.5v11M13.2 17.2 18 22.5l4.8-5.3" />
      </svg>
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
const ringCircumference = 2 * Math.PI * KtvPullRefreshSetting.RING_RADIUS;

let touchStartY = 0;
let touchPulling = false;

/**
 * 下拉进度。0 到 1，刷新中保持画满。
 */
const pullProgress = computed(() => {
  if (pullRefreshState.value === KtvPullRefreshState.REFRESHING) {
    return 1;
  }
  if (pullDistance.value <= 0) {
    return 0;
  }
  const progress = pullDistance.value / KtvPullRefreshSetting.THRESHOLD;
  if (progress > 1) {
    return 1;
  }
  return progress;
});

/**
 * 进度环缺口。拉得越多，缺口越小。
 */
const ringDashOffset = computed(() => {
  return ringCircumference * (1 - pullProgress.value);
});

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
 * 手指向下拉时撑高指示条。从第一下就按阻力放慢，超过阈值后继续用同一系数。
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
  const nextDistance = pullDelta * KtvPullRefreshSetting.RESISTANCE;
  pullDistance.value = Math.min(nextDistance, KtvPullRefreshSetting.MAX_DISTANCE);
  if (pullDistance.value >= KtvPullRefreshSetting.THRESHOLD) {
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
  background: linear-gradient(180deg, #7453f3 0%, #540fbf 42%, #3b117c 100%);
  transition: height 0.34s cubic-bezier(0.22, 1, 0.36, 1);
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
  color: #f5f3ff;
  font-size: 13px;
  font-weight: 500;
  opacity: var(--pull-progress);
  transform: scale(calc(0.86 + 0.14 * var(--pull-progress)));
}
.pull-mark {
  width: 28px;
  height: 28px;
  overflow: visible;
}
.pull-mark.ready {
  animation: pull-ready 0.28s ease;
}
.pull-ring-face {
  fill: rgba(245, 243, 255, 0.16);
}
.pull-ring-track,
.pull-ring-progress {
  fill: none;
  stroke-width: 2.4;
}
.pull-ring-track {
  stroke: rgba(245, 243, 255, 0.35);
}
.pull-ring-progress {
  stroke: #f5f3ff;
  stroke-linecap: round;
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(-90deg);
}
.pull-arrow-path {
  fill: none;
  stroke: #f5f3ff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(calc(var(--pull-progress) * 180deg));
  transition: transform 0.12s ease;
}
.pull-mark.refreshing .pull-ring-progress {
  stroke-dasharray: 24 64;
  stroke-dashoffset: 0;
  animation: pull-spin 0.7s linear infinite;
}
.pull-mark.refreshing .pull-arrow-path {
  opacity: 0;
}
@keyframes pull-ready {
  0% {
    transform: scale(0.92);
  }
  55% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
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
