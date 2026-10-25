<template>
  <p v-if="isEmpty(reviewList)" class="empty">暂无评价</p>
  <PageVirtualList
    v-else
    :item-list="reviewList"
    item-key="reviewId"
    :has-more="hasMoreReviews"
    :loading="reviewLoading"
    @load-more="emit('load-more')"
  >
    <template #default="{ item: reviewRow }">
      <div class="review-row">
        <div class="review-head">
          <strong>{{ maskUsername(reviewRow.username) }}</strong>
          <span class="review-star">{{ starText(reviewRow.starRating) }}</span>
        </div>
        <p v-if="isEmpty(reviewRow.content) !== true" class="review-content">{{ reviewRow.content }}</p>
        <p class="review-time">{{ reviewRow.createdAt }}</p>
      </div>
    </template>
  </PageVirtualList>
</template>

<script setup>
import { computed } from 'vue';
import PageVirtualList from '../PageVirtualList/PageVirtualList.vue';
import { isEmpty } from '../../utils/tools.js';

const props = defineProps({
  reviewList: {
    default() {
      return [];
    },
  },
  reviewTotal: {
    default: 0,
  },
  reviewLoading: {
    default: false,
  },
});

const emit = defineEmits(['load-more']);

/**
 * 已加载条数还没到总数时，滚到底可以继续加载。
 */
const hasMoreReviews = computed(() => {
  return props.reviewList.length < Number(props.reviewTotal);
});

/**
 * 星级显示成星号。
 */
function starText(starRating) {
  const starCount = Number(starRating);
  if (Number.isFinite(starCount) !== true || starCount < 1) {
    return '';
  }
  return '★'.repeat(starCount);
}

/**
 * 账号脱敏，只留前后各一点。
 */
function maskUsername(username) {
  if (isEmpty(username)) {
    return '会员';
  }
  const usernameText = String(username);
  if (usernameText.length <= 2) {
    return `${usernameText.slice(0, 1)}*`;
  }
  return `${usernameText.slice(0, 1)}***${usernameText.slice(-1)}`;
}
</script>

<style scoped>
.empty {
  margin: 24px 0;
  text-align: center;
  color: #98a2b3;
  font-size: 14px;
}

.review-row {
  padding: 14px 0;
  border-bottom: 1px solid #eef0f3;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.review-head strong {
  font-size: 14px;
  color: #111827;
}

.review-star {
  color: #f59e0b;
  font-size: 13px;
  letter-spacing: 1px;
}

.review-content {
  margin: 8px 0 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.review-time {
  margin: 6px 0 0;
  color: #98a2b3;
  font-size: 12px;
}
</style>
