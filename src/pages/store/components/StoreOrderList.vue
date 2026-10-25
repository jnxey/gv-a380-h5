<template>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <PageVirtualList
    v-else
    :item-list="orderList"
    item-key="saleId"
    :has-more="hasMoreOrders"
    :loading="orderLoading"
    @load-more="emit('load-more')"
  >
    <template #default="{ item: saleRow }">
      <div class="order-row">
        <div class="order-head">
          <h2>{{ saleRow.saleNo }}</h2>
          <span>{{ statusLabel(saleRow.saleStatus) }}</span>
        </div>
        <p class="order-sub">{{ saleRow.createdAt }}</p>
        <div v-for="itemRow in saleRow.itemList" :key="`${saleRow.saleId}-${itemRow.productId}`" class="order-item">
          {{ itemRow.productName }} × {{ itemRow.quantity }}
        </div>
        <div class="order-foot">
          <strong class="order-amount">{{ saleRow.amount }}</strong>
          <button v-if="canReview(saleRow)" class="review-button" type="button" @click="openReview(saleRow)">去评价</button>
        </div>
      </div>
    </template>
  </PageVirtualList>
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
import PageVirtualList from '../../../components/PageVirtualList/PageVirtualList.vue';
import ShopReviewDialog from '../../../components/ShopReviewDialog/ShopReviewDialog.vue';
import { ShopReviewBizType, StoreSaleStatus, statusLabel } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  orderList: {
    default() {
      return [];
    },
  },
  orderTotal: {
    default: 0,
  },
  orderLoading: {
    default: false,
  },
});

const emit = defineEmits(['load-more', 'refresh-orders']);

const pendingReviewSale = ref(null);

/**
 * 已加载条数还没到总数时，滚到底可以继续加载。
 */
const hasMoreOrders = computed(() => {
  return props.orderList.length < Number(props.orderTotal);
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

.review-button {
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
</style>
