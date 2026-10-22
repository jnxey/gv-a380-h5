<template>
  <div class="page">
    <header class="hero">
      <p class="kicker">商铺</p>
      <h1>{{ isEmpty(currentShop) ? '商铺选购' : currentShop.shopName }}</h1>
      <p v-if="isEmpty(currentShop) !== true" class="sub">{{ currentShop.shopCode }}</p>
    </header>
    <section class="panel">
      <div v-if="isEmpty(productList)" class="empty">暂无可售商品</div>
      <button
        v-for="productRow in productList"
        :key="productRow.productId"
        type="button"
        class="product-card"
        :disabled="productRow.stockQuantity < 1"
        @click="addCartLine(productRow)"
      >
        <div class="product-name">{{ productRow.productName }}</div>
        <div class="product-meta">¥{{ productRow.salePrice }} · 库存 {{ productRow.stockQuantity }}</div>
      </button>
    </section>
    <section v-if="isEmpty(cartLineList) !== true" class="cart-bar">
      <div class="cart-summary">
        <div>{{ cartCount }} 件</div>
        <strong>¥{{ cartAmountText }}</strong>
      </div>
      <button class="checkout" type="button" :disabled="submitting" @click="submitSale">去结算</button>
    </section>
    <div v-if="cartSheetOpen" class="mask" @click="cartSheetOpen = false"></div>
    <section v-if="cartSheetOpen" class="sheet">
      <h2>购物车</h2>
      <div v-for="cartLine in cartLineList" :key="cartLine.productId" class="cart-line">
        <div>
          <div class="product-name">{{ cartLine.productName }}</div>
          <div class="product-meta">¥{{ cartLine.salePrice }}</div>
        </div>
        <div class="qty">
          <button type="button" @click="changeQuantity(cartLine.productId, -1)">-</button>
          <span>{{ cartLine.quantity }}</span>
          <button type="button" @click="changeQuantity(cartLine.productId, 1)">+</button>
        </div>
      </div>
      <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
      <button class="solid" type="button" :disabled="submitting" @click="confirmSale">确认支付</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { request } from '../../utils/request.js';
import { verifyConsumerDoorLock } from '../../utils/gv-sdk.js';
import { BookingShopQuery, ShopType } from '../../utils/constants.js';
import { showToast } from '../../utils/toast.js';
import { isEmpty } from '../../utils/tools.js';

const currentRoute = useRoute();
const shopCode = ref('');
const currentShop = ref(null);
const productList = ref([]);
const cartLineList = ref([]);
const cartSheetOpen = ref(false);
const submitting = ref(false);
const formError = ref('');

/**
 * 购物车件数。
 */
const cartCount = computed(() => {
  let totalCount = 0;
  for (const cartLine of cartLineList.value) {
    totalCount += cartLine.quantity;
  }
  return totalCount;
});

/**
 * 购物车合计金额。
 */
const cartAmountText = computed(() => {
  let totalAmount = 0;
  for (const cartLine of cartLineList.value) {
    totalAmount += Number(cartLine.salePrice) * cartLine.quantity;
  }
  return totalAmount.toFixed(2);
});

/**
 * 从地址里读出门店编号。
 */
function readShopCode() {
  const routeShopCode = currentRoute.params[BookingShopQuery.SHOP_CODE];
  shopCode.value = isEmpty(routeShopCode) ? '' : routeShopCode;
}

/**
 * 在启用门店列表里按入口门店编号找到对应门店。
 */
function findShopByCode(shopList) {
  if (isEmpty(shopCode.value) || isEmpty(shopList)) {
    return null;
  }
  for (let shopIndex = 0; shopIndex < shopList.length; shopIndex += 1) {
    const shop = shopList[shopIndex];
    if (isEmpty(shop) !== true && shop.shopCode === shopCode.value) {
      return shop;
    }
  }
  return null;
}

/**
 * 加载门店和可售商品。
 */
async function loadPage() {
  const shopList = await request({
    url: '/app/shops',
    method: 'GET',
    data: { shopType: ShopType.STORE },
  });
  currentShop.value = findShopByCode(shopList);
  if (isEmpty(currentShop.value)) {
    const toastTitle = isEmpty(shopCode.value) ? '缺少门店编号' : '门店不存在';
    showToast(toastTitle);
    productList.value = [];
    return;
  }
  productList.value = await request({
    url: '/app/store/products',
    method: 'GET',
    data: { shopId: currentShop.value.shopId },
  });
}

/**
 * 把商品放进购物车。
 */
function addCartLine(productRow) {
  if (productRow.stockQuantity < 1) {
    return;
  }
  const existedLine = cartLineList.value.find((cartLine) => cartLine.productId === productRow.productId);
  if (isEmpty(existedLine)) {
    cartLineList.value.push({
      productId: productRow.productId,
      productName: productRow.productName,
      salePrice: productRow.salePrice,
      stockQuantity: productRow.stockQuantity,
      quantity: 1,
    });
    return;
  }
  if (existedLine.quantity >= productRow.stockQuantity) {
    showToast('库存不足');
    return;
  }
  existedLine.quantity += 1;
}

/**
 * 加减购物车数量。减到 0 时删掉。
 */
function changeQuantity(productId, delta) {
  const cartLine = cartLineList.value.find((lineRow) => lineRow.productId === productId);
  if (isEmpty(cartLine)) {
    return;
  }
  const nextQuantity = cartLine.quantity + delta;
  if (nextQuantity < 1) {
    cartLineList.value = cartLineList.value.filter((lineRow) => lineRow.productId !== productId);
    return;
  }
  if (nextQuantity > cartLine.stockQuantity) {
    showToast('库存不足');
    return;
  }
  cartLine.quantity = nextQuantity;
}

/**
 * 打开结算层。
 */
function submitSale() {
  formError.value = '';
  cartSheetOpen.value = true;
}

/**
 * 弹出安全密钥后提交购买。
 */
async function confirmSale() {
  if (submitting.value || isEmpty(currentShop.value) || isEmpty(cartLineList.value)) {
    return;
  }
  formError.value = '';
  submitting.value = true;
  try {
    let securityKeyCipherText = '';
    try {
      securityKeyCipherText = await verifyConsumerDoorLock();
    } catch {
      return;
    }
    if (isEmpty(securityKeyCipherText)) {
      return;
    }
    await request({
      url: '/app/store/sales',
      method: 'POST',
      data: {
        shopId: currentShop.value.shopId,
        cipherText: securityKeyCipherText,
        itemList: cartLineList.value.map((cartLine) => ({
          productId: cartLine.productId,
          quantity: cartLine.quantity,
        })),
      },
    });
    showToast('支付成功');
    cartLineList.value = [];
    cartSheetOpen.value = false;
    await loadPage();
  } catch (error) {
    if (isEmpty(error) !== true && isEmpty(error.message) !== true) {
      formError.value = error.message;
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  readShopCode();
  loadPage();
});

watch(
  () => {
    if (isEmpty(currentRoute.params)) {
      return '';
    }
    return currentRoute.params[BookingShopQuery.SHOP_CODE];
  },
  () => {
    readShopCode();
    loadPage();
  },
);
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 88px;
  background: #f5f6f8;
}
.hero {
  padding: 20px 16px 12px;
  background: #14241c;
  color: #f7f3ea;
}
.kicker {
  margin: 0;
  opacity: 0.72;
  font-size: 12px;
}
.hero h1 {
  margin: 6px 0 0;
  font-size: 24px;
}
.sub {
  margin: 6px 0 0;
  opacity: 0.72;
  font-size: 13px;
}
.panel {
  padding: 12px;
  display: grid;
  gap: 10px;
}
.empty {
  padding: 40px 0;
  text-align: center;
  color: #98a2b3;
}
.product-card {
  padding: 14px;
  border: 0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  font: inherit;
}
.product-card:disabled {
  opacity: 0.45;
}
.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.product-meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}
.cart-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: min(520px, 100%);
  padding: 12px 16px calc(12px + var(--gv-safe-bottom, 0px));
  background: #fff;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
}
.cart-summary strong {
  display: block;
  margin-top: 2px;
  font-size: 20px;
}
.checkout,
.solid {
  border: 0;
  border-radius: 999px;
  background: #1f8a70;
  color: #fff;
  font: inherit;
}
.checkout {
  padding: 12px 20px;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 36, 28, 0.46);
  z-index: 20;
}
.sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(520px, 100%);
  padding: 16px 16px calc(16px + var(--gv-safe-bottom, 0px));
  border-radius: 22px 22px 0 0;
  background: #fff;
  z-index: 21;
}
.sheet h2 {
  margin: 0 0 12px;
  font-size: 18px;
}
.cart-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.qty {
  display: flex;
  align-items: center;
  gap: 10px;
}
.qty button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #eef2f7;
  font: inherit;
}
.form-error {
  color: #dc2626;
  font-size: 13px;
}
.solid {
  width: 100%;
  margin-top: 12px;
  padding: 13px;
}
</style>
