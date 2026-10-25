<template>
  <section class="success">
    <div class="badge">✓</div>
    <h1>支付成功</h1>
    <p class="hint">会员余额已扣款</p>
    <div class="summary">
      <div v-if="isEmpty(shopName) !== true">{{ shopName }}</div>
      <div>共 {{ itemCount }} 件</div>
      <div class="amount">{{ amountText }}</div>
    </div>
    <button type="button" @click="emit('again')">继续选购</button>
  </section>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  shopName: {
    default: '',
  },
  itemCount: {
    default: 0,
  },
  amountText: {
    default: '0.00',
  },
});

const emit = defineEmits(['again']);
</script>

<style scoped>
.success {
  box-sizing: border-box;
  min-height: 70vh;
  padding: 48px 24px;
  padding-top: calc(48px + var(--gv-safe-top, 0px));
  padding-bottom: calc(48px + var(--gv-safe-bottom, 0px));
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
  background: #e7f6f1;
  color: #1f8a70;
  font-size: 30px;
}
.success h1 {
  margin: 0;
  font-size: 24px;
}
.hint {
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
  color: #374151;
}
.amount {
  margin-top: 4px;
  color: #1f8a70;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.success button {
  border: 0;
  border-radius: 999px;
  padding: 12px 28px;
  background: #1f8a70;
  color: #fff;
  font: inherit;
  font-size: 15px;
}
</style>
