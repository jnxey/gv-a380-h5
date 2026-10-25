<template>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <PageVirtualList
    v-else
    :item-list="orderList"
    item-key="bookingOrderId"
    :has-more="hasMoreOrders"
    :loading="orderLoading"
    @load-more="emit('load-more')"
  >
    <template #default="{ item: order }">
      <div class="order-row">
        <button class="order-info" type="button" @click="openOrderDetail(order)">
          <div class="order-head">
            <h2>{{ order.roomTypeName }}</h2>
            <span>{{ statusLabel(order.orderStatus) }}</span>
          </div>
          <p class="order-sub">{{ order.bookingDate }} {{ formatClockText(order.startTime) }} - {{ formatBookingEnd(order) }} {{ order.durationHours }}小时</p>
        </button>
        <div class="order-foot">
          <div>
            <strong class="order-amount">{{ readPaidAmount(order) }}</strong>
            <p v-if="hasPointDeduct(order)" class="order-deduct">积分抵扣 {{ formatMoney(order.pointDeductAmount) }} 元</p>
          </div>
          <div class="order-actions">
            <button v-if="order.canCancel === true" class="cancel-button" type="button" @click="cancelOrder(order)">
              取消
            </button>
            <button v-if="canShowVerifyCode(order)" class="verify-button" type="button" @click="openVerifyCode(order)">
              核销码
            </button>
            <button v-if="canReview(order)" class="review-button" type="button" @click="openReview(order)">
              去评价
            </button>
          </div>
        </div>
      </div>
    </template>
  </PageVirtualList>
  <div v-if="isEmpty(detailOrder) !== true" class="detail-mask" @click="closeOrderDetail">
    <section class="detail-card" @click.stop>
      <h2>订单详情</h2>
      <p class="detail-line">订单号 {{ detailOrder.orderNo }}</p>
      <p class="detail-line">包厢 {{ detailOrder.roomTypeName }}</p>
      <p v-if="isEmpty(roomText(detailOrder)) !== true" class="detail-line">房间 {{ roomText(detailOrder) }}</p>
      <p class="detail-line">{{ detailOrder.bookingDate }} {{ formatClockText(detailOrder.startTime) }} - {{ formatBookingEnd(detailOrder) }} {{ detailOrder.durationHours }}小时</p>
      <h3>预订信息</h3>
      <p v-if="isEmpty(detailOrder.guestName) !== true" class="detail-line">预订人 {{ detailOrder.guestName }}</p>
      <p v-if="isEmpty(detailOrder.contact) !== true" class="detail-line">联系方式 {{ detailOrder.contact }}</p>
      <p v-if="hasBookingInfo(detailOrder) !== true" class="detail-line">暂无</p>
      <p class="detail-line">金额 {{ readPaidAmount(detailOrder) }}</p>
      <p v-if="hasPointDeduct(detailOrder)" class="detail-line">积分抵扣 {{ formatMoney(detailOrder.pointDeductAmount) }} 元</p>
      <button class="detail-close" type="button" @click="closeOrderDetail">关闭</button>
    </section>
  </div>
  <div v-if="isEmpty(openedOrder) !== true" class="verify-mask" @click="closeVerifyCode">
    <section class="verify-card" @click.stop>
      <img v-if="isEmpty(verifyCodeImageUrl) !== true" class="verify-image" :src="verifyCodeImageUrl" alt="" />
      <p class="verify-value">{{ openedOrder.verifyCode }}</p>
      <div class="verify-detail">
        <div>{{ openedOrder.roomTypeName }} {{ statusLabel(openedOrder.orderStatus) }}</div>
        <div>{{ openedOrder.bookingDate }} {{ formatClockText(openedOrder.startTime) }} - {{ formatBookingEnd(openedOrder) }} {{ openedOrder.durationHours }}小时</div>
        <div class="verify-amount">{{ readPaidAmount(openedOrder) }}</div>
        <div v-if="hasPointDeduct(openedOrder)" class="order-deduct">积分抵扣 {{ formatMoney(openedOrder.pointDeductAmount) }} 元</div>
      </div>
      <button class="verify-close" type="button" @click="closeVerifyCode">关闭</button>
    </section>
  </div>
  <ConfirmDialog
    :open="isEmpty(pendingCancelOrder) !== true"
    :message="cancelConfirmMessage"
    :confirming="cancelSubmitting"
    :accent="ConfirmDialogAccent.KTV"
    @cancel="closeCancelConfirm"
    @confirm="submitCancelOrder"
  />
  <ShopReviewDialog
    :open="isEmpty(pendingReviewOrder) !== true"
    :biz-type="ShopReviewBizType.KTV_BOOKING"
    :biz-order-id="isEmpty(pendingReviewOrder) ? '' : pendingReviewOrder.bookingOrderId"
    @cancel="closeReview"
    @saved="onReviewSaved"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import QRCode from 'qrcode';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.vue';
import PageVirtualList from '../../../components/PageVirtualList/PageVirtualList.vue';
import ShopReviewDialog from '../../../components/ShopReviewDialog/ShopReviewDialog.vue';
import { KtvApi } from '../../../api/ktv.js';
import {
  ConfirmDialogAccent,
  KtvOrderStatus,
  ShopReviewBizType,
  statusLabel,
} from '../../../utils/constants.js';
import { request } from '../../../utils/request.js';
import { showToast } from '../../../utils/toast.js';
import { formatMoney, isEmpty, subtractMoney } from '../../../utils/tools.js';

const cancelConfirmMessage = '确定取消这笔订单？已支付将退回余额。';

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

const emit = defineEmits(['load-more', 'refresh-order', 'refresh-orders']);

const cancelSubmitting = ref(false);
const pendingCancelOrder = ref(null);
const pendingReviewOrder = ref(null);

const openedOrder = ref(null);
const detailOrder = ref(null);
const verifyCodeImageUrl = ref('');

/**
 * 房间号和房间名拼成一行。都没有时返回空。
 */
function roomText(order) {
  if (isEmpty(order)) {
    return '';
  }
  const roomNoText = isEmpty(order.roomNo) ? '' : order.roomNo;
  const roomNameText = isEmpty(order.roomName) ? '' : order.roomName;
  if (isEmpty(roomNoText) && isEmpty(roomNameText)) {
    return '';
  }
  if (isEmpty(roomNameText)) {
    return roomNoText;
  }
  if (isEmpty(roomNoText)) {
    return roomNameText;
  }
  return `${roomNoText} ${roomNameText}`;
}

/**
 * 预订人或联系方式有一项就算有预订信息。
 */
function hasBookingInfo(order) {
  if (isEmpty(order)) {
    return false;
  }
  return isEmpty(order.guestName) !== true || isEmpty(order.contact) !== true;
}

/**
 * 实付金额。原价减去本单记下的积分抵扣。
 */
function readPaidAmount(orderRow) {
  if (isEmpty(orderRow) || isEmpty(orderRow.amount)) {
    return '';
  }
  const deductText = isEmpty(orderRow.pointDeductAmount) ? 0 : orderRow.pointDeductAmount;
  const paidText = subtractMoney(orderRow.amount, deductText);
  if (isEmpty(paidText)) {
    return formatMoney(orderRow.amount);
  }
  return paidText;
}

/**
 * 这笔订单是否用积分抵扣了一部分。
 */
function hasPointDeduct(orderRow) {
  return isEmpty(orderRow) !== true && isEmpty(orderRow.pointDeductPoints) !== true && orderRow.pointDeductPoints > 0;
}

/**
 * 打开订单详情。
 */
function openOrderDetail(order) {
  if (isEmpty(order)) {
    return;
  }
  detailOrder.value = order;
}

/**
 * 关掉订单详情。
 */
function closeOrderDetail() {
  detailOrder.value = null;
}

/**
 * 已加载条数还没到总数时，滚到底可以继续加载。
 */
const hasMoreOrders = computed(() => {
  return props.orderList.length < Number(props.orderTotal);
});

/**
 * 钟点只显示到分。
 */
function formatClockText(clockText) {
  if (isEmpty(clockText)) {
    return '';
  }
  return String(clockText).slice(0, 5);
}

/**
 * 结束钟点不晚于开唱钟点时，表示已经跨到第二天。
 */
function formatBookingEnd(order) {
  if (isEmpty(order.endTime) || isEmpty(order.startTime)) {
    return '';
  }
  if (order.endTime <= order.startTime) {
    return `次日 ${formatClockText(order.endTime)}`;
  }
  return formatClockText(order.endTime);
}

/**
 * 只有待核销且带核销码的订单才能看码。
 */
function canShowVerifyCode(order) {
  if (isEmpty(order) || order.orderStatus !== KtvOrderStatus.PENDING_VERIFY) {
    return false;
  }
  return isEmpty(order.verifyCode) !== true;
}

/**
 * 待评价订单可以写评价。
 */
function canReview(order) {
  if (isEmpty(order)) {
    return false;
  }
  return order.orderStatus === KtvOrderStatus.PENDING_REVIEW;
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
      url: KtvApi.bookingOrderCancel(order.bookingOrderId),
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

/**
 * 打开核销码弹窗，记下这笔订单并生成二维码。
 */
async function openVerifyCode(order) {
  if (canShowVerifyCode(order) !== true) {
    return;
  }
  openedOrder.value = order;
  verifyCodeImageUrl.value = await QRCode.toDataURL(order.verifyCode, {
    margin: 1,
    width: 180,
  });
}

/**
 * 关闭核销码弹窗，并通知页面刷新这笔订单。
 */
function closeVerifyCode() {
  const bookingOrderId = isEmpty(openedOrder.value) ? '' : openedOrder.value.bookingOrderId;
  openedOrder.value = null;
  verifyCodeImageUrl.value = '';
  if (isEmpty(bookingOrderId)) {
    return;
  }
  emit('refresh-order', bookingOrderId);
}
</script>

<style scoped>
.empty {
  margin: 24px 0;
  color: #6b7280;
  text-align: center;
}
.order-row {
  box-sizing: border-box;
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 10px;
}
.order-info {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
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
}
.order-head span {
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 13px;
}
.order-sub {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}
.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.order-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}
.order-amount,
.verify-amount {
  color: #6d28d9;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.order-deduct {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 12px;
}
.verify-button,
.review-button,
.cancel-button,
.verify-close {
  border: 0;
  border-radius: 999px;
  font: inherit;
}
.verify-button,
.review-button,
.cancel-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  font-size: 13px;
}
.verify-button,
.review-button {
  background: #6d28d9;
  color: #fff;
}
.cancel-button {
  background: #f3f4f6;
  color: #6b7280;
}
.verify-mask {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-top: calc(16px + var(--ct-safe-top, 0px));
  padding-bottom: calc(16px + var(--ct-safe-bottom, 0px));
  background: rgba(18, 12, 24, 0.46);
}
.verify-card {
  box-sizing: border-box;
  width: min(280px, calc(100% - 48px));
  padding: 20px 16px 16px;
  border-radius: 22px;
  background: #fff;
  text-align: center;
}
.verify-image {
  width: 180px;
  height: 180px;
}
.verify-value {
  margin: 12px 0 0;
  color: #111827;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}
.verify-detail {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.8;
  text-align: center;
}
.verify-close {
  width: 100%;
  margin-top: 16px;
  padding: 12px 0;
  background: #6d28d9;
  color: #fff;
  font-size: 15px;
}
.detail-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(18, 12, 24, 0.46);
}
.detail-card {
  box-sizing: border-box;
  width: min(520px, 100%);
  max-height: min(70vh, 520px);
  overflow: auto;
  padding: 16px 16px calc(16px + var(--ct-safe-bottom, 0px));
  border-radius: 22px 22px 0 0;
  background: #fff;
}
.detail-card h2,
.detail-card h3 {
  margin: 0;
  color: #111827;
}
.detail-card h2 {
  font-size: 18px;
}
.detail-card h3 {
  margin-top: 16px;
  font-size: 15px;
}
.detail-line {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.detail-close {
  width: 100%;
  margin-top: 16px;
  padding: 12px 0;
  border: 0;
  border-radius: 999px;
  background: #6d28d9;
  color: #fff;
  font: inherit;
  font-size: 16px;
}
</style>
