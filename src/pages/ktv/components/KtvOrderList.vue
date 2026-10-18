<template>
  <p class="section-label">我的订单</p>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <div v-for="order in orderList" :key="order.id" class="order-row">
    <span class="order-title">{{ order.orderNo }} {{ statusLabel(order.orderStatus) }}</span>
    <span class="order-sub">{{ order.bookingDate }} {{ order.startTime }} - {{ formatBookingEnd(order) }}</span>
    <span class="order-sub">{{ order.durationHours }}小时 ¥{{ order.amount }} 核销码 {{ order.verifyCode }}</span>
  </div>
</template>

<script setup>
import { statusLabel } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  orderList: {
    default() {
      return [];
    },
  },
});

/**
 * 结束钟点不晚于开唱钟点时，表示已经跨到第二天。
 */
function formatBookingEnd(order) {
  if (isEmpty(order.endTime) || isEmpty(order.startTime)) {
    return '';
  }
  if (order.endTime <= order.startTime) {
    return `次日 ${order.endTime}`;
  }
  return order.endTime;
}
</script>

<style scoped>
.section-label {
  margin: 16px 0 8px;
  color: #6b7280;
  font-size: 12px;
  letter-spacing: 0.08em;
}
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
  margin-bottom: 8px;
}
.order-title,
.order-sub {
  display: block;
}
.order-sub {
  margin-top: 4px;
  color: #6b7280;
}
</style>
