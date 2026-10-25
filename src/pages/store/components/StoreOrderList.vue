<template>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <div v-for="saleRow in orderList" :key="saleRow.saleId" class="order-row">
    <div class="order-head">
      <h2>{{ saleRow.saleNo }}</h2>
      <span>{{ statusLabel(saleRow.saleStatus) }}</span>
    </div>
    <p class="order-sub">{{ saleRow.createdAt }}</p>
    <div v-for="itemRow in saleRow.itemList" :key="`${saleRow.saleId}-${itemRow.productId}`" class="order-item">
      {{ itemRow.productName }} × {{ itemRow.quantity }}
    </div>
    <div class="order-foot">
      <strong class="order-amount">¥{{ saleRow.amount }}</strong>
      <button v-if="canReview(saleRow)" class="review-button" type="button" @click="openReview(saleRow)">去评价</button>
    </div>
  </div>
  <div class="pager">
    <button type="button" :disabled="previousPageDisabled" @click="emit('change-page', orderPageNumber - 1)">上一页</button>
    <button type="button" :disabled="nextPageDisabled" @click="emit('change-page', orderPageNumber + 1)">下一页</button>
  </div>
  <ShopReviewDialog
    :open="isEmpty(pendingReviewSale) !== true"
    :biz-type="ShopReviewBizType.STORE_SALE"
    :biz-order-id="isEmpty(pendingReviewSale) ? '' : pendingReviewSale.saleId"
    @cancel="closeReview"
    @saved="onReviewSaved"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import ShopReviewDialog from '../../../components/ShopReviewDialog/ShopReviewDialog.vue';
import { PageSetting, ShopReviewBizType, StoreSaleStatus, statusLabel } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  orderList: {
    default() {
      return [];
    },
  },
  orderPageNumber: {
    default: PageSetting.DEFAULT_PAGE,
  },
  orderTotal: {
    default: 0,
  },
  orderPageSize: {
    default: PageSetting.DEFAULT_PAGE_SIZE,
  },
});

const emit = defineEmits(['change-page', 'refresh-orders']);

const pendingReviewSale = ref(null);

/**
 * 第 1 页或没有订单时，上一页不可点。
 */
const previousPageDisabled = computed(() => {
  if (props.orderTotal <= 0) {
    return true;
  }
  return props.orderPageNumber <= PageSetting.DEFAULT_PAGE;
});

/**
 * 当前页已经覆盖全部订单时，下一页不可点。
 */
const nextPageDisabled = computed(() => {
  return props.orderPageNumber * props.orderPageSize >= props.orderTotal;
});

/**
 * 待评价销售单可以写评价。
 */
function canReview(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return saleRow.saleStatus === StoreSaleStatus.PENDING_REVIEW;
}

/**
 * 打开评价弹层。
 */
function openReview(saleRow) {
  if (canReview(saleRow) !== true) {
    return;
  }
  pendingReviewSale.value = saleRow;
}

/**
 * 关掉评价弹层。
 */
function closeReview() {
  pendingReviewSale.value = null;
}

/**
 * 评价成功后刷新订单列表。
 */
function onReviewSaved() {
  pendingReviewSale.value = null;
  emit('refresh-orders');
}
</script>

<style scoped>
.empty {
  margin: 24px 0;
  text-align: center;
  color: #98a2b3;
  font-size: 14px;
}

.order-row {
  padding: 14px 0;
  border-bottom: 1px solid #eef0f3;
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.order-head h2 {
  margin: 0;
  font-size: 15px;
  color: #111827;
}

.order-head span {
  color: #667085;
  font-size: 13px;
}

.order-sub,
.order-item {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
}

.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.order-amount {
  color: #0f766e;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.review-button,
.pager button {
  border: 0;
  border-radius: 999px;
  font: inherit;
}

.review-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #0f766e;
  color: #fff;
  font-size: 13px;
}

.pager {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.pager button {
  flex: 1;
  padding: 10px 0;
  background: #f2f4f7;
  color: #344054;
}

.pager button:disabled {
  opacity: 0.45;
}
</style>
