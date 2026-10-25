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
        <p class="order-sub">{{ formatShopDateTime(saleRow.createdAt, timeZone) }}</p>
        <div v-for="itemRow in saleRow.itemList" :key="`${saleRow.saleId}-${itemRow.productId}`" class="order-item">
          {{ itemRow.productName }} × {{ itemRow.quantity }}
        </div>
        <p v-if="isEmpty(saleRow.courierName) !== true" class="order-item">送货人 {{ saleRow.courierName }}</p>
        <p v-if="isEmpty(saleRow.courierContact) !== true" class="order-item">送货联系方式 {{ saleRow.courierContact }}</p>
        <p v-if="isEmpty(saleRow.deliveryNo) !== true" class="order-item">送货号 {{ saleRow.deliveryNo }}</p>
        <p v-if="isEmpty(saleRow.deliveryRemark) !== true" class="order-item">送货备注 {{ saleRow.deliveryRemark }}</p>
        <div class="order-foot">
          <strong class="order-amount">{{ saleRow.amount }}</strong>
          <div class="order-actions">
            <button v-if="canCancel(saleRow)" class="cancel-button" type="button" @click="openCancel(saleRow)">取消</button>
            <button v-if="canReceive(saleRow)" class="review-button" type="button" @click="openReceive(saleRow)">确认收货</button>
            <button v-if="canReview(saleRow)" class="review-button" type="button" @click="openReview(saleRow)">去评价</button>
          </div>
        </div>
      </div>
    </template>
  </PageVirtualList>
  <ConfirmDialog
    :open="isEmpty(pendingCancelSale) !== true"
    message="确定取消这笔订单？已支付将退回余额。"
    :confirming="orderActionSubmitting"
    :accent="ConfirmDialogAccent.STORE"
    @cancel="closeCancel"
    @confirm="submitCancel"
  />
  <ConfirmDialog
    :open="isEmpty(pendingReceiveSale) !== true"
    message="确认已经收到商品？"
    confirm-label="确认收货"
    :confirming="orderActionSubmitting"
    :accent="ConfirmDialogAccent.STORE"
    @cancel="closeReceive"
    @confirm="submitReceive"
  />
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
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.vue';
import ShopReviewDialog from '../../../components/ShopReviewDialog/ShopReviewDialog.vue';
import { StoreApi } from '../../../api/store.js';
import { ConfirmDialogAccent, ShopReviewBizType, StoreSaleStatus, statusLabel } from '../../../utils/constants.js';
import { request } from '../../../utils/request.js';
import { formatShopDateTime, isEmpty } from '../../../utils/tools.js';

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
  timeZone: {
    default: '',
  },
});

const emit = defineEmits(['load-more', 'refresh-orders']);

const pendingReviewSale = ref(null);
const pendingCancelSale = ref(null);
const pendingReceiveSale = ref(null);
const orderActionSubmitting = ref(false);

/**
 * 待发货销售单可以取消。
 */
function canCancel(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return saleRow.saleStatus === StoreSaleStatus.PENDING_DELIVERY;
}

/**
 * 送货中的销售单可以确认收货。
 */
function canReceive(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return saleRow.saleStatus === StoreSaleStatus.DELIVERING;
}

/**
 * 打开取消确认。
 */
function openCancel(saleRow) {
  if (canCancel(saleRow) !== true) {
    return;
  }
  pendingCancelSale.value = saleRow;
}

/**
 * 关掉取消确认。
 */
function closeCancel() {
  if (orderActionSubmitting.value === true) {
    return;
  }
  pendingCancelSale.value = null;
}

/**
 * 确认取消待发货订单，成功后刷新列表。
 */
async function submitCancel() {
  if (orderActionSubmitting.value === true || isEmpty(pendingCancelSale.value)) {
    return;
  }
  orderActionSubmitting.value = true;
  try {
    await request({
      url: StoreApi.saleCancel(pendingCancelSale.value.saleId),
      method: 'POST',
    });
    pendingCancelSale.value = null;
    emit('refresh-orders');
  } finally {
    orderActionSubmitting.value = false;
  }
}

/**
 * 打开确认收货。
 */
function openReceive(saleRow) {
  if (canReceive(saleRow) !== true) {
    return;
  }
  pendingReceiveSale.value = saleRow;
}

/**
 * 关掉确认收货。
 */
function closeReceive() {
  if (orderActionSubmitting.value === true) {
    return;
  }
  pendingReceiveSale.value = null;
}

/**
 * 确认收货，成功后刷新列表。
 */
async function submitReceive() {
  if (orderActionSubmitting.value === true || isEmpty(pendingReceiveSale.value)) {
    return;
  }
  orderActionSubmitting.value = true;
  try {
    await request({
      url: StoreApi.saleReceive(pendingReceiveSale.value.saleId),
      method: 'POST',
    });
    pendingReceiveSale.value = null;
    emit('refresh-orders');
  } finally {
    orderActionSubmitting.value = false;
  }
}

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

.order-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.cancel-button,
.review-button {
  border: 0;
  border-radius: 999px;
  font: inherit;
}

.cancel-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #eef4f1;
  color: #1f8a70;
  font-size: 13px;
}

.review-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #0f766e;
  color: #fff;
  font-size: 13px;
}
</style>
