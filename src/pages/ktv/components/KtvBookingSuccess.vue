<template>
  <section v-if="isEmpty(successSummary) !== true" class="success">
    <div class="badge">✓</div>
    <h1>预约已提交</h1>
    <p class="order-no">单号 {{ successSummary.orderNo }}</p>
    <div v-if="isEmpty(successSummary.verifyCode) !== true" class="verify-block">
      <img v-if="isEmpty(verifyCodeImageUrl) !== true" class="verify-image" :src="verifyCodeImageUrl" alt="" />
      <p class="verify-value">{{ successSummary.verifyCode }}</p>
    </div>
    <div class="summary">
      <div>{{ successSummary.shopName }} · {{ successSummary.roomTypeName }}</div>
      <div>{{ successSummary.bookingDate }} {{ successSummary.arrivalLabel }}</div>
      <div>{{ successSummary.amount }}</div>
    </div>
    <button type="button" @click="emit('again')">再约一间</button>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import QRCode from 'qrcode';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  successSummary: {
    default: null,
  },
});

const emit = defineEmits(['again']);

const verifyCodeImageUrl = ref('');

/**
 * 按核销码生成成功页二维码。没有核销码时不画。
 */
async function refreshVerifyCodeImage(verifyCode) {
  if (isEmpty(verifyCode)) {
    verifyCodeImageUrl.value = '';
    return;
  }
  verifyCodeImageUrl.value = await QRCode.toDataURL(verifyCode, {
    margin: 1,
    width: 180,
  });
}

watch(
  () => {
    if (isEmpty(props.successSummary)) {
      return '';
    }
    return props.successSummary.verifyCode;
  },
  (verifyCode) => {
    refreshVerifyCodeImage(verifyCode);
  },
  { immediate: true },
);
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
.verify-block {
  margin: 0 auto 20px;
}
.verify-image {
  width: 180px;
  height: 180px;
}
.verify-value {
  margin: 12px 0 0;
  color: #111827;
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
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
