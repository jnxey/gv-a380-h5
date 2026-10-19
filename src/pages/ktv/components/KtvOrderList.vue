<template>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <div v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
    <div class="order-head">
      <h2>{{ order.roomTypeName }}</h2>
      <span>{{ statusLabel(order.orderStatus) }}</span>
    </div>
    <p class="order-sub">{{ order.bookingDate }} {{ formatClockText(order.startTime) }} - {{ formatBookingEnd(order) }} {{ order.durationHours }}小时</p>
    <div class="order-foot">
      <strong class="order-amount">¥{{ order.amount }}</strong>
      <button v-if="isEmpty(order.verifyCode) !== true" class="verify-button" type="button" @click="openVerifyCode(order)">
        核销码
      </button>
    </div>
  </div>
  <div class="pager">
    <button type="button" :disabled="previousPageDisabled" @click="emit('change-page', orderPageNumber - 1)">上一页</button>
    <button type="button" :disabled="nextPageDisabled" @click="emit('change-page', orderPageNumber + 1)">下一页</button>
  </div>
  <div v-if="isEmpty(openedOrder) !== true" class="verify-mask" @click="closeVerifyCode">
    <section class="verify-card" @click.stop>
      <img v-if="isEmpty(verifyCodeImageUrl) !== true" class="verify-image" :src="verifyCodeImageUrl" alt="" />
      <p class="verify-value">{{ openedOrder.verifyCode }}</p>
      <div class="verify-detail">
        <div>{{ openedOrder.roomTypeName }} {{ statusLabel(openedOrder.orderStatus) }}</div>
        <div>{{ openedOrder.bookingDate }} {{ formatClockText(openedOrder.startTime) }} - {{ formatBookingEnd(openedOrder) }} {{ openedOrder.durationHours }}小时</div>
        <div class="verify-amount">¥{{ openedOrder.amount }}</div>
      </div>
      <button class="verify-close" type="button" @click="closeVerifyCode">关闭</button>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import QRCode from 'qrcode';
import { PageSetting, statusLabel } from '../../../utils/constants.js';
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

const emit = defineEmits(['change-page', 'refresh-order']);

const openedOrder = ref(null);
const verifyCodeImageUrl = ref('');

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
 * 打开核销码弹窗，记下这笔订单并生成二维码。
 */
async function openVerifyCode(order) {
  if (isEmpty(order) || isEmpty(order.verifyCode)) {
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
.order-amount,
.verify-amount {
  color: #6d28d9;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.verify-button,
.pager button,
.verify-close {
  border: 0;
  border-radius: 999px;
  font: inherit;
}
.verify-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #6d28d9;
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
  background: #ede9fe;
  color: #111827;
  font-size: 14px;
}
.pager button:disabled {
  opacity: 0.4;
}
.verify-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>
