<template>
  <div class="mask" @click="emit('close')"></div>
  <section class="sheet">
    <div class="sheet-head">
      <h2>购物车</h2>
      <button type="button" class="close" @click="emit('close')">关闭</button>
    </div>
    <div class="cart-list">
      <div v-for="cartLine in cartLineList" :key="cartLine.productId" class="cart-line">
        <div class="cart-line-main">
          <div class="product-name">{{ cartLine.productName }}</div>
          <div class="product-meta">
            单价 {{ cartLine.salePrice }} · 小计 {{ (Number(cartLine.salePrice) * cartLine.quantity).toFixed(2) }}
          </div>
        </div>
        <div class="qty">
          <button type="button" @click="emit('change', cartLine.productId, -1)">-</button>
          <span>{{ cartLine.quantity }}</span>
          <button type="button" class="add" @click="emit('change', cartLine.productId, 1)">+</button>
        </div>
      </div>
    </div>
    <label class="delivery-field">
      <span class="delivery-label">收货地址</span>
      <textarea
        class="delivery-input"
        rows="2"
        placeholder="请填写收货地址"
        :value="deliveryAddress"
        @input="emit('update:deliveryAddress', $event.target.value)"
      ></textarea>
    </label>
    <div class="sheet-total">
      <span>合计</span>
      <strong>{{ cartAmountText }}</strong>
    </div>
    <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
    <button class="solid" type="button" :disabled="submitting" @click="emit('submit')">确认支付</button>
  </section>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  cartLineList: {
    default: () => [],
  },
  cartAmountText: {
    default: '0.00',
  },
  deliveryAddress: {
    default: '',
  },
  formError: {
    default: '',
  },
  submitting: {
    default: false,
  },
});

const emit = defineEmits(['close', 'change', 'submit', 'update:deliveryAddress']);
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 36, 28, 0.46);
  z-index: 20;
  overscroll-behavior: none;
}
.sheet {
  box-sizing: border-box;
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(520px, 100%);
  max-height: min(78vh, 640px);
  display: flex;
  flex-direction: column;
  overflow: visible;
  overscroll-behavior: none;
  padding: 16px 16px calc(16px + var(--ct-safe-bottom, 0px));
  border-radius: 22px 22px 0 0;
  background: #fff;
  z-index: 21;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.sheet-head h2 {
  margin: 0;
  font-size: 18px;
}
.close {
  border: 0;
  padding: 0;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 14px;
}
.cart-list {
  overflow: auto;
  overscroll-behavior: contain;
  flex: 1 1 auto;
  min-height: 0;
}
.cart-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.cart-line-main {
  min-width: 0;
  flex: 1 1 auto;
}
.product-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}
.product-meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}
.qty {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.qty button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #eef2f7;
  font: inherit;
}
.qty button.add {
  background: #1f8a70;
  color: #fff;
}
.delivery-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.delivery-label {
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}
.delivery-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  resize: none;
  font: inherit;
  font-size: 14px;
  line-height: 1.45;
  color: #111827;
  background: #f9fafb;
}
.delivery-input:focus {
  outline: none;
  border-color: #1f8a70;
  background: #fff;
}
.sheet-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
}
.sheet-total span {
  color: #6b7280;
  font-size: 13px;
}
.sheet-total strong {
  color: #1f8a70;
  font-size: 22px;
  font-variant-numeric: tabular-nums;
}
.form-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: 13px;
}
.solid {
  width: 100%;
  margin-top: 12px;
  padding: 13px;
  border: 0;
  border-radius: 999px;
  background: #1f8a70;
  color: #fff;
  font: inherit;
  font-size: 15px;
}
.solid:disabled {
  opacity: 0.45;
}
</style>
