<template>
  <div class="page-virtual-list">
    <DynamicScroller
      :items="itemList"
      :min-item-size="minItemSize"
      :key-field="itemKey"
      page-mode
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-index="index">
          <div class="page-virtual-item">
            <slot :item="item" :index="index" />
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    <p v-if="loading === true" class="page-virtual-loading">加载中</p>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const LoadMoreDistance = {
  THRESHOLD: 80
};

const props = defineProps({
  itemList: {
    default() {
      return [];
    }
  },
  itemKey: {
    default: ''
  },
  hasMore: {
    default: false
  },
  loading: {
    default: false
  },
  minItemSize: {
    default: 72
  }
});

const emit = defineEmits(['load-more']);

/**
 * 判断窗口是否已经滚到页面底部附近。
 */
function reachPageBottom() {
  const documentElement = document.documentElement;
  const pageScrollHeight = Math.max(documentElement.scrollHeight, document.body.scrollHeight);
  const pageScrollTop = window.scrollY || documentElement.scrollTop;
  const distanceToBottom = pageScrollHeight - window.innerHeight - pageScrollTop;
  return distanceToBottom <= LoadMoreDistance.THRESHOLD;
}

/**
 * 接近底部、还有下一页、并且当前没在请求时，通知外层加载。
 */
function tryLoadMore() {
  if (props.loading === true || props.hasMore !== true) {
    return;
  }
  if (reachPageBottom() !== true) {
    return;
  }
  emit('load-more');
}

/**
 * 等这一帧画完再量页面高度，避免列表还没撑开就误判。
 */
function checkAfterRender() {
  nextTick(() => {
    requestAnimationFrame(() => {
      tryLoadMore();
    });
  });
}

/**
 * 页面滚动时检查是否该加载下一页。
 */
function onWindowScroll() {
  tryLoadMore();
}

watch(
  () => [props.itemList.length, props.loading, props.hasMore],
  () => {
    if (props.loading === true) {
      return;
    }
    checkAfterRender();
  }
);

/**
 * 挂上窗口滚动，并在内容不满一屏时补拉下一页。
 */
onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  checkAfterRender();
});

/**
 * 离开页面时卸掉窗口滚动。
 */
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll);
});
</script>

<style scoped>
.page-virtual-item {
  display: flow-root;
}
.page-virtual-loading {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
  text-align: center;
}
</style>
