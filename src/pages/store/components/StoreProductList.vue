<template>
  <div class="product-list">
    <div v-if="isEmpty(productList)" class="empty">暂无可售商品</div>
    <article
      v-for="productRow in productList"
      :key="productRow.productId"
      class="product-card"
      :class="{ disabled: productRow.stockQuantity < 1 }"
    >
      <div class="product-main">
        <div class="product-name">{{ productRow.productName }}</div>
        <div class="product-price">¥{{ productRow.salePrice }}</div>
        <div class="product-meta">
          <template v-if="productRow.stockQuantity < 1">售罄</template>
          <template v-else>库存 {{ productRow.stockQuantity }}</template>
        </div>
      </div>
      <div class="product-actions">
        <template v-if="productRow.stockQuantity >= 1">
          <template v-if="cartQuantity(productRow.productId) > 0">
            <button type="button" class="step" aria-label="减少" @click="emit('change', productRow.productId, -1)">-</button>
            <span class="qty">{{ cartQuantity(productRow.productId) }}</span>
            <button type="button" class="step add" aria-label="增加" @click="emit('change', productRow.productId, 1)">+</button>
          </template>
          <button v-else type="button" class="step add" aria-label="加入购物车" @click="emit('add', productRow)">+</button>
        </template>
      </div>
    </article>
  </div>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  productList: {
    default: () => [],
  },
  cartLineList: {
    default: () => [],
  },
});

const emit = defineEmits(['add', 'change']);

/**
 * 某商品在购物车里的数量。没有则 0。
 */
function cartQuantity(productId) {
  if (isEmpty(props.cartLineList)) {
    return 0;
  }
  for (let lineIndex = 0; lineIndex < props.cartLineList.length; lineIndex += 1) {
    const cartLine = props.cartLineList[lineIndex];
    if (isEmpty(cartLine) !== true && cartLine.productId === productId) {
      return cartLine.quantity;
    }
  }
  return 0;
}
</script>

<style scoped>
.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.empty {
  padding: 48px 0;
  text-align: center;
  color: #98a2b3;
  font-size: 14px;
}
.product-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
}
.product-card.disabled {
  opacity: 0.55;
}
.product-main {
  min-width: 0;
  flex: 1 1 auto;
}
.product-name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: #111827;
  word-break: break-word;
}
.product-price {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1f8a70;
  font-variant-numeric: tabular-nums;
}
.product-meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}
.product-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.step {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #eef2f7;
  color: #111827;
  font: inherit;
  font-size: 18px;
  line-height: 1;
}
.step.add {
  background: #1f8a70;
  color: #fff;
}
.qty {
  min-width: 18px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
