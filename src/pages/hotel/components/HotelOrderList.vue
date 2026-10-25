<template>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <div v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
    <div class="order-head">
      <h2>{{ order.typeName }}</h2>
      <span>{{ statusLabel(order.orderStatus) }}</span>
    </div>
    <p class="order-sub">{{ order.checkInDate }} 至 {{ order.checkOutDate }}</p>
    <div class="order-foot">
      <strong class="order-amount">房费 ¥{{ order.amount }}</strong>
      <div class="order-actions">
        <button v-if="order.canCancel === true" class="cancel-button" type="button" @click="cancelOrder(order)">
          取消
        </button>
        <button v-if="canReview(order)" class="review-button" type="button" @click="openReview(order)">
          去评价
        </button>
      </div>
    </div>
  </div>
  <div class="pager">
    <button type="button" :disabled="previousPageDisabled" @click="emit('change-page', orderPageNumber - 1)">上一页</button>
    <button type="button" :disabled="nextPageDisabled" @click="emit('change-page', orderPageNumber + 1)">下一页</button>
  </div>
  <ConfirmDialog
    :open="isEmpty(pendingCancelOrder) !== true"
    :message="cancelConfirmMessage"
    :confirming="cancelSubmitting"
    :accent="ConfirmDialogAccent.HOTEL"
    @cancel="closeCancelConfirm"
    @confirm="submitCancelOrder"
  />
  <ShopReviewDialog
    :open="isEmpty(pendingReviewOrder) !== true"
    :biz-type="ShopReviewBizType.HOTEL_BOOKING"
    :biz-order-id="isEmpty(pendingReviewOrder) ? '' : pendingReviewOrder.bookingOrderId"
    @cancel="closeReview"
    @saved="onReviewSaved"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.vue';
import ShopReviewDialog from '../../../components/ShopReviewDialog/ShopReviewDialog.vue';
import { HotelApi } from '../../../api/hotel.js';
import {
  ConfirmDialogAccent,
  HotelOrderStatus,
  PageSetting,
  ShopReviewBizType,
  statusLabel,
} from '../../../utils/constants.js';
import { request } from '../../../utils/request.js';
import { showToast } from '../../../utils/toast.js';
import { isEmpty } from '../../../utils/tools.js';

const cancelConfirmMessage = '确定取消这笔订单？已支付将退回余额。';

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

const cancelSubmitting = ref(false);
const pendingCancelOrder = ref(null);
const pendingReviewOrder = ref(null);

/**
 * 待评价订单可以写评价。
 */
function canReview(order) {
  if (isEmpty(order)) {
    return false;
  }
  return order.orderStatus === HotelOrderStatus.PENDING_REVIEW;
}

/**
 * 打开评价弹层。
 */
function openReview(order) {
  if (canReview(order) !== true) {
    return;
  }
  pendingReviewOrder.value = order;
}

/**
 * 关掉评价弹层。
 */
function closeReview() {
  pendingReviewOrder.value = null;
}

/**
 * 评价成功后刷新订单列表。
 */
function onReviewSaved() {
  pendingReviewOrder.value = null;
  emit('refresh-orders');
}

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
 * 打开取消确认弹层。
 */
function cancelOrder(order) {
  if (isEmpty(order) || order.canCancel !== true || cancelSubmitting.value === true) {
    return;
  }
  pendingCancelOrder.value = order;
}

/**
 * 关掉取消确认弹层。
 */
function closeCancelConfirm() {
  if (cancelSubmitting.value === true) {
    return;
  }
  pendingCancelOrder.value = null;
}

/**
 * 确认取消订单，成功后刷新列表。
 */
async function submitCancelOrder() {
  const order = pendingCancelOrder.value;
  if (isEmpty(order) || cancelSubmitting.value === true) {
    return;
  }
  cancelSubmitting.value = true;
  try {
    await request({
      url: HotelApi.bookingOrderCancel(order.bookingOrderId),
      method: 'POST',
      data: {},
    });
    pendingCancelOrder.value = null;
    showToast('已取消');
    emit('refresh-orders');
  } finally {
    cancelSubmitting.value = false;
  }
}
</script>

<style scoped>
.empty {
  margin: 24px 0;
  color: #5e6b64;
  text-align: center;
}
.order-row {
  box-sizing: border-box;
  background: #fffdf9;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 10px;
}
.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.order-head h2 {
  margin: 0;
  font-size: 16px;
  color: #14241c;
}
.order-head span {
  flex: 0 0 auto;
  color: #5e6b64;
  font-size: 13px;
}
.order-sub {
  margin: 8px 0 0;
  color: #5e6b64;
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
  color: #1f8a70;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.order-actions {
  display: flex;
  gap: 8px;
}
.cancel-button,
.review-button,
.pager button {
  border: 0;
  border-radius: 999px;
  font: inherit;
}
.cancel-button,
.review-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  font-size: 13px;
}
.cancel-button {
  background: rgba(20, 36, 28, 0.08);
  color: #5e6b64;
}
.review-button {
  background: #1f8a70;
  color: #fff;
}
.pager {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.pager button {
  flex: 1;
  padding: 10px 0;
  background: rgba(31, 138, 112, 0.12);
  color: #14241c;
  font-size: 14px;
}
.pager button:disabled {
  opacity: 0.4;
}
</style>
