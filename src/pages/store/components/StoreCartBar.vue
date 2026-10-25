<template>
  <div class="bar">
    <button type="button" class="summary" @click="emit('open')">
      <p>{{ cartCount }} 件商品</p>
      <strong>{{ cartAmountText }}</strong>
    </button>
    <button class="checkout" type="button" @click="emit('open')">去结算</button>
  </div>
</template>

<script setup>
defineProps({
  cartCount: {
    default: 0,
  },
  cartAmountText: {
    default: '0.00',
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
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  z-index: 10;
}
.summary {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
}
.summary p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
}
.summary strong {
  display: block;
  margin-top: 2px;
  color: #1f8a70;
  font-variant-numeric: tabular-nums;
  font-size: 20px;
}
.checkout {
  border: 0;
  border-radius: 999px;
  padding: 12px 22px;
  background: #1f8a70;
  color: #fff;
  font: inherit;
  font-size: 15px;
}
</style>
