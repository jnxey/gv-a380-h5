<template>
  <section v-if="isEmpty(successSummary) !== true" class="success">
    <div class="badge">✓</div>
    <h1>预约已提交</h1>
    <p class="order-no">单号 {{ successSummary.orderNo }}</p>
    <div class="summary">
      <div>核销码 {{ successSummary.verifyCode }}</div>
      <div>{{ successSummary.shopName }} · {{ successSummary.roomTypeName }}</div>
      <div>{{ successSummary.bookingDate }} {{ successSummary.arrivalLabel }}</div>
      <div>¥{{ successSummary.amount }}</div>
    </div>
    <button type="button" @click="emit('again')">再约一间</button>
  </section>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  successSummary: {
    default: null,
  },
});

const emit = defineEmits(['again']);
</script>

<style scoped>
.success {
  box-sizing: border-box;
  min-height: 70vh;
  padding: 48px 24px;
  text-align: center;
  background: #fff;
}
.badge {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #eef8f1;
  color: #178a45;
  font-size: 30px;
}
.success h1 {
  margin: 0;
  font-size: 24px;
}
.order-no {
  margin: 8px 0 20px;
  color: #6b7280;
}
.summary {
  margin: 0 auto 24px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f5f6f8;
  text-align: left;
  line-height: 1.8;
}
.success button {
  border: 0;
  border-radius: 999px;
  padding: 12px 28px;
  background: #6d28d9;
  color: #fff;
  font: inherit;
  font-size: 15px;
}
</style>
