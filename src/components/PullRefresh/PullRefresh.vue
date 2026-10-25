<template>
  <div
    class="pull-refresh"
    :class="[pullToneClassName, { following: pullFollowingFinger }]"
    :style="{ height: `${pullDistance}px`, '--pull-progress': pullProgress }"
  >
    <div v-if="pullRefreshState !== PullRefreshState.IDLE" class="pull-refresh-body">
      <span class="pull-dots" :class="pullRefreshState">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { PullRefreshSetting, PullRefreshState, PullRefreshTone } from '../../utils/constants.js';
import { isEmpty, isFunction } from '../../utils/tools.js';

const props = defineProps({
  refreshing: {
    default: false,
  },
  tone: {
    default: PullRefreshTone.KTV,
  },
});

const emit = defineEmits(['refresh']);

const pullDistance = ref(0);
const pullRefreshState = ref(PullRefreshState.IDLE);
const pullFollowingFinger = ref(false);

let touchStartY = 0;
let touchPulling = false;

/**
 * 指示条颜色。KTV 紫、酒店深色、商铺绿。
 */
const pullToneClassName = computed(() => {
  if (props.tone === PullRefreshTone.HOTEL) {
    return 'is-hotel';
  }
  if (props.tone === PullRefreshTone.STORE) {
    return 'is-store';
  }
  return 'is-ktv';
});

/**
 * 下拉进度。0 到 1，刷新中保持画满。
 */
const pullProgress = computed(() => {
  if (pullRefreshState.value === PullRefreshState.REFRESHING) {
    return 1;
  }
  if (pullDistance.value <= 0) {
    return 0;
  }
  const progress = pullDistance.value / PullRefreshSetting.THRESHOLD;
  if (progress > 1) {
    return 1;
  }
  return progress;
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
 * 日历弹层，或已经滚下去的分类栏，不开始下拉。
 */
function shouldSkipPull(event) {
  if (isEmpty(event) || isEmpty(event.target) || isFunction(event.target.closest) !== true) {
    return false;
  }
  if (isEmpty(event.target.closest('.sheet-root')) !== true) {
    return true;
  }
  const categorySide = event.target.closest('.category-side');
  if (isEmpty(categorySide)) {
    return false;
  }
  return categorySide.scrollTop > 0;
}

/**
 * 记下按下位置。页面不在顶部、正在刷新，或落在日历和已滚动分类栏上时不开始下拉。
 */
function handleTouchStart(event) {
  touchPulling = false;
  if (props.refreshing === true || pullRefreshState.value === PullRefreshState.REFRESHING) {
    return;
  }
  if (shouldSkipPull(event) === true) {
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
    pullRefreshState.value = PullRefreshState.IDLE;
    return;
  }
  const pullDelta = event.touches[0].clientY - touchStartY;
  if (pullDelta <= 0) {
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = PullRefreshState.IDLE;
    return;
  }
  event.preventDefault();
  pullFollowingFinger.value = true;
  const nextDistance = pullDelta * PullRefreshSetting.RESISTANCE;
  pullDistance.value = Math.min(nextDistance, PullRefreshSetting.MAX_DISTANCE);
  if (pullDistance.value >= PullRefreshSetting.THRESHOLD) {
    pullRefreshState.value = PullRefreshState.READY;
    return;
  }
  pullRefreshState.value = PullRefreshState.PULLING;
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
  if (pullRefreshState.value !== PullRefreshState.READY) {
    pullDistance.value = 0;
    pullRefreshState.value = PullRefreshState.IDLE;
    return;
  }
  pullDistance.value = PullRefreshSetting.THRESHOLD;
  pullRefreshState.value = PullRefreshState.REFRESHING;
  emit('refresh');
}

watch(
  () => props.refreshing,
  (refreshing) => {
    if (refreshing === true) {
      pullDistance.value = PullRefreshSetting.THRESHOLD;
      pullRefreshState.value = PullRefreshState.REFRESHING;
      return;
    }
    pullFollowingFinger.value = false;
    pullDistance.value = 0;
    pullRefreshState.value = PullRefreshState.IDLE;
  },
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
  overflow: visible;
  transition: height 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}
.pull-refresh.is-ktv {
  --pull-ink: #f5f3ff;
  background: #6d28d9;
  background-image: linear-gradient(180deg, #6d28d9 0%, #4c1d95 100%);
}
.pull-refresh.is-hotel {
  --pull-ink: #f7f3ea;
  background: #14241c;
}
.pull-refresh.is-store {
  --pull-ink: #f7f3ea;
  background: linear-gradient(180deg, #2aa882 0%, #1f8a70 42%, #145c4b 100%);
}
.pull-refresh.following {
  transition: none;
}
.pull-refresh-body {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--pull-ink);
  opacity: var(--pull-progress);
}
.pull-dots {
  display: flex;
  align-items: center;
  gap: 7px;
}
.pull-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.45;
  transform: scale(calc(0.55 + 0.45 * var(--pull-progress)));
}
.pull-dots.refreshing span {
  animation: pull-dot 0.9s ease-in-out infinite;
}
.pull-dots.refreshing span:nth-child(2) {
  animation-delay: 0.15s;
}
.pull-dots.refreshing span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes pull-dot {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0) scale(0.6);
  }
  40% {
    opacity: 1;
    transform: translateY(-5px) scale(1);
  }
}
</style>
