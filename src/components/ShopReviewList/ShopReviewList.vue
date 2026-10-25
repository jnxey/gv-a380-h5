<template>
  <p v-if="isEmpty(reviewList)" class="empty">暂无评价</p>
  <div v-for="reviewRow in reviewList" :key="reviewRow.reviewId" class="review-row">
    <div class="review-head">
      <strong>{{ maskUsername(reviewRow.username) }}</strong>
      <span class="review-star">{{ starText(reviewRow.starRating) }}</span>
    </div>
    <p v-if="isEmpty(reviewRow.content) !== true" class="review-content">{{ reviewRow.content }}</p>
    <p class="review-time">{{ reviewRow.createdAt }}</p>
  </div>
  <div v-if="isEmpty(reviewList) !== true" class="pager">
    <button type="button" :disabled="previousPageDisabled" @click="emit('change-page', reviewPageNumber - 1)">上一页</button>
    <button type="button" :disabled="nextPageDisabled" @click="emit('change-page', reviewPageNumber + 1)">下一页</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { PageSetting } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

const props = defineProps({
  reviewList: {
    default() {
      return [];
    },
  },
  reviewPageNumber: {
    default: PageSetting.DEFAULT_PAGE,
  },
  reviewTotal: {
    default: 0,
  },
  reviewPageSize: {
    default: PageSetting.DEFAULT_PAGE_SIZE,
  },
});

const emit = defineEmits(['change-page']);

/**
 * 第 1 页或没有数据时，上一页不可点。
 */
const previousPageDisabled = computed(() => {
  if (props.reviewTotal <= 0) {
    return true;
  }
  return props.reviewPageNumber <= PageSetting.DEFAULT_PAGE;
});

/**
 * 当前页已经覆盖全部评价时，下一页不可点。
 */
const nextPageDisabled = computed(() => {
  return props.reviewPageNumber * props.reviewPageSize >= props.reviewTotal;
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

.pager {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.pager button {
  min-width: 88px;
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #344054;
}

.pager button:disabled {
  opacity: 0.45;
}
</style>
