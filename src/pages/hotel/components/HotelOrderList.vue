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
    </div>
  </div>
  <div class="pager">
    <button type="button" :disabled="previousPageDisabled" @click="emit('change-page', orderPageNumber - 1)">上一页</button>
    <button type="button" :disabled="nextPageDisabled" @click="emit('change-page', orderPageNumber + 1)">下一页</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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

const emit = defineEmits(['change-page']);

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
.pager {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.pager button {
  flex: 1;
  padding: 10px 0;
  border: 0;
  border-radius: 999px;
  background: rgba(31, 138, 112, 0.12);
  color: #14241c;
  font: inherit;
  font-size: 14px;
}
.pager button:disabled {
  opacity: 0.4;
}
</style>
