<template>
  <div v-if="open === true" class="review-mask" @click="emitCancel">
    <section class="review-card" @click.stop>
      <h3>评价门店</h3>
      <div class="star-row">
        <button
          v-for="starValue in starValueList"
          :key="starValue"
          type="button"
          class="star-button"
          :class="{ active: starValue <= starRating }"
          @click="starRating = starValue"
        >
          ★
        </button>
      </div>
      <textarea
        ref="reviewInputElement"
        v-model="contentText"
        class="review-input"
        :maxlength="ShopReviewLimit.CONTENT_MAX_LENGTH"
        rows="4"
        placeholder="说说这次体验（选填）"
      ></textarea>
      <div class="review-actions">
        <button type="button" class="cancel-button" :disabled="submitting === true" @click="emitCancel">取消</button>
        <button type="button" class="submit-button" :disabled="submitting === true" @click="submitReview">
          {{ submitting === true ? '提交中…' : '提交' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { ShopReviewApi } from '../../api/shop-review.js';
import { ShopReviewLimit } from '../../utils/constants.js';
import { request } from '../../utils/request.js';
import { showToast } from '../../utils/toast.js';
import { isEmpty } from '../../utils/tools.js';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  bizType: {
    default: '',
  },
  bizOrderId: {
    default: '',
  },
  accent: {
    default: 'ktv',
  },
});

const emit = defineEmits(['cancel', 'saved']);

const starValueList = [1, 2, 3, 4, 5];
const starRating = ref(ShopReviewLimit.STAR_MAX);
const contentText = ref('');
const submitting = ref(false);
const reviewInputElement = ref(null);

/**
 * 打开时重置表单，并把焦点放进评价输入框。
 */
watch(
  () => props.open,
  (opened) => {
    if (opened !== true) {
      return;
    }
    starRating.value = ShopReviewLimit.STAR_MAX;
    contentText.value = '';
    focusReviewInput();
  },
);

/**
 * 弹窗渲染完后聚焦评价输入框。
 */
async function focusReviewInput() {
  await nextTick();
  if (isEmpty(reviewInputElement.value)) {
    return;
  }
  reviewInputElement.value.focus();
}

/**
 * 关掉弹层。
 */
function emitCancel() {
  if (submitting.value === true) {
    return;
  }
  emit('cancel');
}

/**
 * 提交评价。
 */
async function submitReview() {
  if (submitting.value === true) {
    return;
  }
  if (isEmpty(props.bizType) || isEmpty(props.bizOrderId)) {
    showToast('订单不存在');
    return;
  }
  if (starRating.value < ShopReviewLimit.STAR_MIN || starRating.value > ShopReviewLimit.STAR_MAX) {
    showToast('请选择星级');
    return;
  }
  submitting.value = true;
  try {
    await request({
      url: ShopReviewApi.REVIEWS,
      method: 'POST',
      data: {
        bizType: props.bizType,
        bizOrderId: props.bizOrderId,
        starRating: starRating.value,
        content: contentText.value,
      },
    });
    showToast('评价成功');
    emit('saved');
  } catch (error) {
    void error;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.review-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: end center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.45);
}

.review-card {
  width: min(100%, 420px);
  padding: 20px 16px 16px;
  border-radius: 16px 16px 12px 12px;
  background: #fff;
}

.review-card h3 {
  margin: 0;
  text-align: center;
  font-size: 17px;
  color: #111827;
}

.star-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.star-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #d0d5dd;
  font-size: 28px;
  line-height: 1;
}

.star-button.active {
  color: #f59e0b;
}

.review-input {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  resize: none;
  font: inherit;
  color: #111827;
  box-sizing: border-box;
}

.review-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.cancel-button,
.submit-button {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: 0;
  font-size: 15px;
}

.cancel-button {
  background: #f2f4f7;
  color: #344054;
}

.submit-button {
  background: #6d28d9;
  color: #fff;
}

.submit-button:disabled,
.cancel-button:disabled {
  opacity: 0.6;
}
</style>
