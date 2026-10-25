<template>
  <div class="bar">
    <div>
      <p>{{ summaryText }}</p>
      <strong v-if="isEmpty(amountText) !== true">{{ amountText }}</strong>
    </div>
    <button class="book" type="button" :disabled="bookingDisabled" @click="emit('open')">去预订</button>
  </div>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  summaryText: {
    default: '',
  },
  amountText: {
    default: '',
  },
  bookingDisabled: {
    default: true,
  },
});

const emit = defineEmits(['open']);
</script>

<style scoped>
.bar {
  box-sizing: border-box;
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(520px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px calc(12px + var(--ct-safe-bottom, 0px));
  background: rgba(255, 253, 249, 0.96);
  border-top: 1px solid rgba(20, 36, 28, 0.08);
  z-index: 10;
}
.bar p {
  margin: 0;
  color: #5e6b64;
  font-size: 12px;
}
.bar strong {
  color: #1f8a70;
  font-variant-numeric: tabular-nums;
  font-size: 20px;
}
.book {
  border: 0;
  border-radius: 999px;
  padding: 12px 22px;
  background: #1f8a70;
  color: #fffdf9;
  font: inherit;
  font-size: 15px;
}
.book:disabled {
  opacity: 0.4;
}
</style>
