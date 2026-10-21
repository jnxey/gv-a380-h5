<template>
  <section v-if="isEmpty(successSummary) !== true" class="success">
    <div class="badge">✓</div>
    <h1>预订已提交</h1>
    <p class="order-no">单号 {{ successSummary.orderNo }}</p>
    <div class="summary">
      <div>{{ successSummary.shopName }} · {{ successSummary.roomTypeName }}</div>
      <div>{{ successSummary.checkInDate }} 至 {{ successSummary.checkOutDate }}</div>
      <div>{{ successSummary.nightCount }} 晚</div>
      <div>¥{{ successSummary.amount }}</div>
    </div>
    <button type="button" @click="emit('again')">再订一间</button>
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
  min-height: 100vh;
  padding: 48px 24px;
  padding-top: calc(48px + var(--gv-safe-top, 0px));
  padding-bottom: calc(48px + var(--gv-safe-bottom, 0px));
  text-align: center;
  color: #14241c;
  background: #f3efe8;
}
.badge {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(31, 138, 112, 0.16);
  color: #1f8a70;
  font-size: 30px;
}
.success h1 {
  margin: 0;
  font-size: 24px;
}
.order-no {
  margin: 8px 0 20px;
  color: #5e6b64;
}
.summary {
  margin: 0 auto 24px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fffdf9;
  text-align: left;
  line-height: 1.8;
}
.success button {
  border: 0;
  border-radius: 999px;
  padding: 12px 28px;
  background: #1f8a70;
  color: #fffdf9;
  font: inherit;
  font-size: 15px;
}
</style>
