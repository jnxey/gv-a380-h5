<template>
  <div v-if="isEmpty(productList)" class="empty">暂无可售商品</div>
  <div v-else class="menu-layout">
    <aside class="category-side">
      <button
        v-for="categoryGroup in productGroupList"
        :key="categoryGroup.categoryId"
        type="button"
        class="category-item"
        :class="{ active: categoryGroup.categoryId === activeCategoryId }"
        @click="selectCategory(categoryGroup.categoryId)"
      >
        {{ categoryGroup.categoryName }}
      </button>
    </aside>
    <div class="product-side">
      <section
        v-for="categoryGroup in productGroupList"
        :key="categoryGroup.categoryId"
        :ref="(element) => setSectionRef(categoryGroup.categoryId, element)"
        class="product-section"
      >
        <h3 class="section-title">{{ categoryGroup.categoryName }}</h3>
        <article
          v-for="productRow in categoryGroup.productList"
          :key="productRow.productId"
          class="product-card"
          :class="{ disabled: productRow.stockQuantity < 1 }"
        >
          <div class="product-cover">
            <img v-if="isEmpty(coverImageUrl(productRow)) !== true" :src="coverImageUrl(productRow)" alt="" />
            <span v-else class="product-cover-empty">暂无图片</span>
          </div>
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
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { isEmpty } from '../../../utils/tools.js';

const otherCategoryId = '__other__';
const otherCategoryName = '其他';

const props = defineProps({
  categoryList: {
    default: () => [],
  },
  productList: {
    default: () => [],
  },
  cartLineList: {
    default: () => [],
  },
});

const emit = defineEmits(['add', 'change']);

const activeCategoryId = ref('');
const sectionRefMap = ref({});
const scrollingByClick = ref(false);

/**
 * 按启用分类排序分块；无分类归属的商品归到「其他」。
 */
const productGroupList = computed(() => {
  const groupList = [];
  const usedProductIdSet = new Set();
  const safeCategoryList = isEmpty(props.categoryList) ? [] : props.categoryList;
  const safeProductList = isEmpty(props.productList) ? [] : props.productList;
  for (let categoryIndex = 0; categoryIndex < safeCategoryList.length; categoryIndex += 1) {
    const categoryRow = safeCategoryList[categoryIndex];
    if (isEmpty(categoryRow) || isEmpty(categoryRow.categoryId)) {
      continue;
    }
    const categoryProductList = [];
    for (let productIndex = 0; productIndex < safeProductList.length; productIndex += 1) {
      const productRow = safeProductList[productIndex];
      if (isEmpty(productRow) !== true && productRow.categoryId === categoryRow.categoryId) {
        categoryProductList.push(productRow);
        usedProductIdSet.add(productRow.productId);
      }
    }
    if (categoryProductList.length === 0) {
      continue;
    }
    groupList.push({
      categoryId: categoryRow.categoryId,
      categoryName: isEmpty(categoryRow.categoryName) ? '未命名' : categoryRow.categoryName,
      productList: categoryProductList,
    });
  }
  const otherProductList = [];
  for (let productIndex = 0; productIndex < safeProductList.length; productIndex += 1) {
    const productRow = safeProductList[productIndex];
    if (isEmpty(productRow) !== true && usedProductIdSet.has(productRow.productId) !== true) {
      otherProductList.push(productRow);
    }
  }
  if (otherProductList.length > 0) {
    groupList.push({
      categoryId: otherCategoryId,
      categoryName: otherCategoryName,
      productList: otherProductList,
    });
  }
  return groupList;
});

/**
 * 记录右侧分块节点，供点击滚动与滚动高亮使用。
 */
function setSectionRef(categoryId, element) {
  if (isEmpty(element)) {
    delete sectionRefMap.value[categoryId];
    return;
  }
  sectionRefMap.value[categoryId] = element;
}

/**
 * 封面用第一张商品图片。没有图片时返回空字符串。
 */
function coverImageUrl(productRow) {
  if (isEmpty(productRow) || isEmpty(productRow.imageList)) {
    return '';
  }
  const firstProductImage = productRow.imageList[0];
  if (isEmpty(firstProductImage) || isEmpty(firstProductImage.imageUrl)) {
    return '';
  }
  return firstProductImage.imageUrl;
}

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

/**
 * 读取吸顶相对顶部的安全距离（像素）。
 */
function stickyTopOffsetPx() {
  const rootStyle = window.getComputedStyle(document.documentElement);
  const safeTopText = rootStyle.getPropertyValue('--gv-safe-top').trim();
  const safeTopValue = Number.parseFloat(safeTopText);
  if (Number.isFinite(safeTopValue) !== true) {
    return 0;
  }
  return safeTopValue;
}

/**
 * 点左侧分类，按页面滚动到对应商品块。
 */
async function selectCategory(categoryId) {
  activeCategoryId.value = categoryId;
  scrollingByClick.value = true;
  await nextTick();
  const sectionElement = sectionRefMap.value[categoryId];
  if (isEmpty(sectionElement)) {
    scrollingByClick.value = false;
    return;
  }
  sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => {
    scrollingByClick.value = false;
  }, 400);
}

/**
 * 页面滚动时，按视口顶部所在分块反高亮左侧。
 */
function onWindowScroll() {
  if (scrollingByClick.value === true) {
    return;
  }
  let matchedCategoryId = '';
  for (let groupIndex = 0; groupIndex < productGroupList.value.length; groupIndex += 1) {
    const categoryGroup = productGroupList.value[groupIndex];
    const sectionElement = sectionRefMap.value[categoryGroup.categoryId];
    if (isEmpty(sectionElement)) {
      continue;
    }
    const sectionRect = sectionElement.getBoundingClientRect();
    if (sectionRect.top <= stickyTopOffsetPx() + 12) {
      matchedCategoryId = categoryGroup.categoryId;
    }
  }
  if (isEmpty(matchedCategoryId) !== true) {
    activeCategoryId.value = matchedCategoryId;
  }
}

/**
 * 商品或分类变化后，默认选中第一块。
 */
watch(
  productGroupList,
  (groupList) => {
    if (isEmpty(groupList)) {
      activeCategoryId.value = '';
      return;
    }
    const hasActive = groupList.some((categoryGroup) => categoryGroup.categoryId === activeCategoryId.value);
    if (hasActive !== true) {
      activeCategoryId.value = groupList[0].categoryId;
    }
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll);
});
</script>

<style scoped>
.empty {
  padding: 48px 0;
  text-align: center;
  color: #98a2b3;
  font-size: 14px;
}
.menu-layout {
  display: flex;
  align-items: flex-start;
  border-radius: 16px;
  background: #fff;
}
.category-side {
  position: sticky;
  top: var(--gv-safe-top, 0px);
  z-index: 2;
  flex: none;
  align-self: flex-start;
  width: 88px;
  max-height: calc(100vh - var(--gv-safe-top, 0px));
  overflow-y: auto;
  border-top-left-radius: 16px;
  background: #f3f4f6;
  -webkit-overflow-scrolling: touch;
}
.category-item {
  display: block;
  width: 100%;
  padding: 14px 8px;
  border: 0;
  background: transparent;
  color: #4b5563;
  font: inherit;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  word-break: break-word;
}
.category-item:first-child {
  border-top-left-radius: 16px;
}
.category-item.active {
  background: #fff;
  color: #1f8a70;
  font-weight: 600;
}
.product-side {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 12px 16px;
}
.product-section + .product-section {
  margin-top: 8px;
}
.product-section {
  scroll-margin-top: var(--gv-safe-top, 0px);
}
.section-title {
  position: sticky;
  top: var(--gv-safe-top, 0px);
  z-index: 1;
  margin: 0;
  padding: 12px 0 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.product-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 14px;
  background: #f8faf9;
}
.product-card.disabled {
  opacity: 0.55;
}
.product-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border-radius: 12px;
  background: #f3f4f6;
}
.product-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-cover-empty {
  color: #9ca3af;
  font-size: 11px;
  text-align: center;
  line-height: 1.3;
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
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: #111827;
  word-break: break-word;
}
.product-price {
  margin-top: 8px;
  font-size: 18px;
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
