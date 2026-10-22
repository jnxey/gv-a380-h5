<template>
  <div
    class="pull-refresh"
    :class="{ following: pullFollowingFinger }"
    :style="{ height: `${pullDistance}px`, '--pull-progress': pullProgress }"
  >
    <div v-if="pullRefreshState !== StorePullRefreshState.IDLE" class="pull-refresh-body">
      <svg
        class="pull-mark"
        :class="pullRefreshState"
        :viewBox="`0 0 ${StorePullRefreshSetting.RING_SIZE} ${StorePullRefreshSetting.RING_SIZE}`"
      >
        <circle
          class="pull-ring-face"
          :cx="StorePullRefreshSetting.RING_CENTER"
          :cy="StorePullRefreshSetting.RING_CENTER"
          :r="StorePullRefreshSetting.RING_RADIUS"
        />
        <circle
          class="pull-ring-track"
          :cx="StorePullRefreshSetting.RING_CENTER"
          :cy="StorePullRefreshSetting.RING_CENTER"
          :r="StorePullRefreshSetting.RING_RADIUS"
        />
        <circle
          class="pull-ring-progress"
          :cx="StorePullRefreshSetting.RING_CENTER"
          :cy="StorePullRefreshSetting.RING_CENTER"
          :r="StorePullRefreshSetting.RING_RADIUS"
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
import { StorePullRefreshSetting, StorePullRefreshState } from '../../../utils/constants.js';

const props = defineProps({
  refreshing: {
    default: false
  }
});

const emit = defineEmits(['refresh']);

const pullDistance = ref(0);
const pullRefreshState = ref(StorePullRefreshState.IDLE);
const pullFollowingFinger = ref(false);
const ringCircumference = 2 * Math.PI * StorePullRefreshSetting.RING_RADIUS;

let touchStartY = 0;
let touchPulling = false;

/**
 * ?????0 ? 1?????????
 */
const pullProgress = computed(() => {
  if (pullRefreshState.value === StorePullRefreshState.REFRESHING) {
    return 1;
  }
  if (pullDistance.value <= 0) {
    return 0;
  }
  const progress = pullDistance.value / StorePullRefreshSetting.THRESHOLD;
  if (progress > 1) {
    return 1;
  }
  return progress;
});

/**
 * ????????????????
 */
const ringDashOffset = computed(() => {
  return ringCircumference * (1 - pullProgress.value);
});

/**
 * ???????????????????
 */
const pullRefreshText = computed(() => {
  if (pullRefreshState.value === StorePullRefreshState.REFRESHING) {
    return '???';
  }
  if (pullRefreshState.value === StorePullRefreshState.READY) {
    return '????';
  }
  return '????';
});

/**
 * ?????????
 */
function pageAtTop() {
  const scrollingElement = document.scrollingElement;
  if (scrollingElement === null) {
    return window.scrollY === 0;
  }
  return scrollingElement.scrollTop === 0;
}

/**
 * ?????????????????????????
 */
function handleTouchStart(event) {
  touchPulling = false;
  if (props.refreshing === true || pullRefreshState.value === StorePullRefreshState.REFRESHING) {
    return;
  }
  if (pageAtTop() !== true || event.touches.length !== 1) {
    return;
  }
  touchStartY = event.touches[0].clientY;
  touchPulling = true;
}

/**
 * ????????????????????????????????????
 */
function handleTouchMove(event) {
  if (touchPulling !== true) {
    return;
  }
  if (pageAtTop() !== true) {
    touchPulling = false;
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = StorePullRefreshState.IDLE;
    return;
  }
  const pullDelta = event.touches[0].clientY - touchStartY;
  if (pullDelta <= 0) {
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = StorePullRefreshState.IDLE;
    return;
  }
  event.preventDefault();
  pullFollowingFinger.value = true;
  const nextDistance = pullDelta * StorePullRefreshSetting.RESISTANCE;
  pullDistance.value = Math.min(nextDistance, StorePullRefreshSetting.MAX_DISTANCE);
  if (pullDistance.value >= StorePullRefreshSetting.THRESHOLD) {
    pullRefreshState.value = StorePullRefreshState.READY;
    return;
  }
  pullRefreshState.value = StorePullRefreshState.PULLING;
}

/**
 * ????????????????????
 */
function handleTouchEnd() {
  if (touchPulling !== true) {
    return;
  }
  touchPulling = false;
  pullFollowingFinger.value = false;
  if (pullRefreshState.value !== StorePullRefreshState.READY) {
    pullDistance.value = 0;
    pullRefreshState.value = StorePullRefreshState.IDLE;
    return;
  }
  pullDistance.value = StorePullRefreshSetting.THRESHOLD;
  pullRefreshState.value = StorePullRefreshState.REFRESHING;
  emit('refresh');
}

watch(
  () => props.refreshing,
  (refreshing) => {
    if (refreshing === true) {
      pullDistance.value = StorePullRefreshSetting.THRESHOLD;
      pullRefreshState.value = StorePullRefreshState.REFRESHING;
      return;
    }
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = StorePullRefreshState.IDLE;
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
  background: linear-gradient(180deg, #2aa882 0%, #1f8a70 42%, #145c4b 100%);
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
  color: #f7f3ea;
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
  fill: rgba(247, 243, 234, 0.16);
}
.pull-ring-track,
.pull-ring-progress {
  fill: none;
  stroke-width: 2.4;
}
.pull-ring-track {
  stroke: rgba(247, 243, 234, 0.35);
}
.pull-ring-progress {
  stroke: #f7f3ea;
  stroke-linecap: round;
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(-90deg);
}
.pull-arrow-path {
  fill: none;
  stroke: #f7f3ea;
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
