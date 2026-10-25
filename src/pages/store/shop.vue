<template>
  <div class="page" :class="{ 'page-with-bar': showCartBar }">
    <section v-if="saleStep !== StoreSaleStep.SUCCESS">
      <PullRefresh
        v-if="saleStep === StoreSaleStep.LIST && cartSheetOpen !== true"
        :tone="PullRefreshTone.STORE"
        :refreshing="pageRefreshing"
        @refresh="refreshPage"
      />
      <StoreStoreHeader :current-shop="currentShop" />
      <div class="panel">
        <StoreContentTabs :selected-content-tab="selectedContentTab" @select="selectContentTab" />
        <StoreProductList
          v-if="selectedContentTab === StoreContentTab.SHOPPING"
          :category-list="categoryList"
          :product-list="productList"
          :cart-line-list="cartLineList"
          @add="addCartLine"
          @change="changeQuantity"
        />
        <StoreOrderList
          v-if="selectedContentTab === StoreContentTab.ORDER"
          :order-list="orderList"
          :order-total="orderTotal"
          :order-loading="orderLoading"
          :time-zone="isEmpty(currentShop) ? '' : currentShop.timeZone"
          @load-more="loadMoreOrders"
          @refresh-orders="refreshMemberOrders"
        />
        <ShopReviewList
          v-if="selectedContentTab === StoreContentTab.REVIEW"
          :review-list="reviewList"
          :review-total="reviewTotal"
          :review-loading="reviewLoading"
          :time-zone="isEmpty(currentShop) ? '' : currentShop.timeZone"
          @load-more="loadMoreReviews"
        />
        <StoreShopDetail v-if="selectedContentTab === StoreContentTab.SHOP" :current-shop="currentShop" />
      </div>
      <StoreCartBar
        v-if="showCartBar"
        :cart-count="cartCount"
        :cart-amount-text="cartAmountText"
        @open="openCartSheet"
      />
    </section>
    <StoreCartSheet
      v-if="cartSheetOpen"
      :cart-line-list="cartLineList"
      :cart-amount-text="sheetAmountText"
      :point-plan="pointPlan"
      :use-point-deduct="usePointDeduct"
      v-model:receiver-name="receiverName"
      v-model:contact="contact"
      v-model:delivery-address="deliveryAddress"
      :address-history="deliveryAddressHistory"
      :form-error="formError"
      :submitting="submitting"
      @close="closeCartSheet"
      @change="changeQuantity"
      @update:use-point-deduct="usePointDeduct = $event"
      @submit="confirmSale"
    />
    <StoreSaleSuccess
      v-if="saleStep === StoreSaleStep.SUCCESS"
      :shop-name="successShopName"
      :item-count="successItemCount"
      :amount-text="successAmountText"
      @again="continueShopping"
    />
    <div v-if="roomQrRequired === true" class="room-qr-mask">
      <section class="room-qr-card">
        <p>请先扫描房间二维码</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MemberApi } from '../../api/member.js';
import { ShopApi } from '../../api/shop.js';
import { ShopReviewApi } from '../../api/shop-review.js';
import { PointApi } from '../../api/point.js';
import { StoreApi } from '../../api/store.js';
import { request } from '../../utils/request.js';
import { verifyConsumerDoorLock } from 'gv-sdk';
import {
  BookingShopQuery,
  HotelBookingGuest,
  PageSetting,
  PullRefreshTone,
  RecordStatus,
  ShopType,
  StoreContentTab,
  StoreDeliveryAddressHistory,
  StoreSaleStep,
  StoreShopQuery,
} from '../../utils/constants.js';
import { showToast } from '../../utils/toast.js';
import { hidePageLoading, showPageLoading } from '../../utils/loading.js';
import { lockPageScroll, unlockPageScroll } from '../../utils/pageScrollLock.js';
import { formatMoneyCents, isEmpty, multiplyMoney, multiplyMoneyCents, nationalContactText, subtractMoney } from '../../utils/tools.js';
import ShopReviewList from '../../components/ShopReviewList/ShopReviewList.vue';
import StoreCartBar from './components/StoreCartBar.vue';
import StoreCartSheet from './components/StoreCartSheet.vue';
import StoreContentTabs from './components/StoreContentTabs.vue';
import StoreOrderList from './components/StoreOrderList.vue';
import StoreProductList from './components/StoreProductList.vue';
import PullRefresh from '../../components/PullRefresh/PullRefresh.vue';
import StoreSaleSuccess from './components/StoreSaleSuccess.vue';
import StoreShopDetail from './components/StoreShopDetail.vue';
import StoreStoreHeader from './components/StoreStoreHeader.vue';

const currentRoute = useRoute();
const shopCode = ref('');
const currentShop = ref(null);
const categoryList = ref([]);
const productList = ref([]);
const cartLineList = ref([]);
const pointsBalance = ref(0);
const usePointDeduct = ref(false);
const cartSheetOpen = ref(false);
const receiverName = ref('');
const contact = ref('');
const deliveryAddress = ref('');
const deliveryAddressHistory = ref([]);
const submitting = ref(false);
const formError = ref('');
const pageRefreshing = ref(false);
const selectedContentTab = ref(StoreContentTab.SHOPPING);
const saleStep = ref(StoreSaleStep.LIST);
const successShopName = ref('');
const successItemCount = ref(0);
const successAmountText = ref('0.00');
const orderList = ref([]);
const orderPageNumber = ref(PageSetting.DEFAULT_PAGE);
const orderTotal = ref(0);
const orderLoading = ref(false);
const reviewList = ref([]);
const reviewPageNumber = ref(PageSetting.DEFAULT_PAGE);
const reviewTotal = ref(0);
const reviewLoading = ref(false);

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
  let totalCents = 0;
  for (const cartLine of cartLineList.value) {
    const lineCents = multiplyMoneyCents(cartLine.salePrice, cartLine.quantity);
    if (lineCents === null) {
      continue;
    }
    totalCents += lineCents;
  }
  return formatMoneyCents(totalCents);
});

/**
 * 购物车里可抵扣商品的合计。没有可抵扣商品时不显示，余额不够时只显示积分不足。
 */
const pointPlan = computed(() => {
  let deductCents = 0;
  let deductPoints = 0;
  for (const cartLine of cartLineList.value) {
    const unitCents = multiplyMoneyCents(cartLine.pointDeductAmount, 1);
    const unitPoints = Number(cartLine.pointDeductPoints);
    if (unitCents !== null && unitCents > 0 && Number.isInteger(unitPoints) === true && unitPoints > 0) {
      const lineCents = multiplyMoneyCents(cartLine.pointDeductAmount, cartLine.quantity);
      if (lineCents !== null) {
        deductCents += lineCents;
      }
      deductPoints += unitPoints * cartLine.quantity;
    }
  }
  if (deductPoints <= 0) {
    return { visible: false, enabled: false, amountText: '0.00', hint: '' };
  }
  const amountText = formatMoneyCents(deductCents);
  if (pointsBalance.value < deductPoints) {
    return { visible: true, enabled: false, amountText, hint: `积分不足，还差${deductPoints - pointsBalance.value}` };
  }
  return { visible: true, enabled: true, amountText, hint: `抵扣${amountText}元，消耗${deductPoints}积分` };
});

/**
 * 结算合计。勾选抵扣后显示实付。
 */
const sheetAmountText = computed(() => {
  if (usePointDeduct.value !== true || pointPlan.value.enabled !== true) {
    return cartAmountText.value;
  }
  return subtractMoney(cartAmountText.value, pointPlan.value.amountText);
});

/**
 * 能抵扣时默认选中。变成不足时取消；手动取消后，可用状态不变就保持取消。
 */
watch(() => pointPlan.value.enabled, (enabled) => {
  usePointDeduct.value = enabled === true;
});

/**
 * 选购 Tab 且购物车有货时显示底栏。
 */
const showCartBar = computed(() => {
  return (
    saleStep.value === StoreSaleStep.LIST &&
    selectedContentTab.value === StoreContentTab.SHOPPING &&
    isEmpty(cartLineList.value) !== true &&
    cartSheetOpen.value !== true
  );
});

/**
 * 门店要求房间号，但地址参数里没有房间地址时，整页停住。
 */
const roomQrRequired = computed(() => {
  if (isEmpty(currentShop.value) || currentShop.value.requireRoomNo !== true) {
    return false;
  }
  return isEmpty(currentRoute.query[StoreShopQuery.ADDRESS]);
});

/**
 * 从地址里读出门店编号。
 */
function readShopCode() {
  const routeShopCode = currentRoute.params[BookingShopQuery.SHOP_CODE];
  shopCode.value = isEmpty(routeShopCode) ? '' : routeShopCode;
}

/**
 * 从文本里取出收货地址。空值或仅空白时返回空串。
 */
function normalizeDeliveryAddressText(addressValue) {
  if (isEmpty(addressValue)) {
    return '';
  }
  const addressText = Array.isArray(addressValue) ? addressValue[0] : addressValue;
  if (isEmpty(addressText)) {
    return '';
  }
  const rawText = String(addressText).trim();
  if (isEmpty(rawText)) {
    return '';
  }
  // Vue Router 多数情况已解码；仍带 % 时再解一次。
  try {
    return decodeURIComponent(rawText);
  } catch {
    return rawText;
  }
}

/**
 * 从 hash 路由查询参数预填收货地址（#/path?address=xxx）。没有 address 时留空。
 */
function readDeliveryAddressFromQuery() {
  deliveryAddress.value = normalizeDeliveryAddressText(currentRoute.query[StoreShopQuery.ADDRESS]);
}

/**
 * 读出本机记住的收货地址。解析失败或不是数组时当成空列表。
 */
function readDeliveryAddressHistory() {
  let storedText = '';
  try {
    storedText = window.localStorage.getItem(StoreDeliveryAddressHistory.STORAGE_KEY);
  } catch {
    return [];
  }
  if (isEmpty(storedText)) {
    return [];
  }
  let parsedAddressList = null;
  try {
    parsedAddressList = JSON.parse(storedText);
  } catch {
    return [];
  }
  if (Array.isArray(parsedAddressList) !== true) {
    return [];
  }
  const addressList = [];
  for (let addressIndex = 0; addressIndex < parsedAddressList.length; addressIndex += 1) {
    const addressText = parsedAddressList[addressIndex];
    if (isEmpty(addressText)) {
      continue;
    }
    const trimmedAddress = String(addressText).trim();
    if (isEmpty(trimmedAddress) || addressList.indexOf(trimmedAddress) !== -1) {
      continue;
    }
    addressList.push(trimmedAddress);
    if (addressList.length >= StoreDeliveryAddressHistory.MAX_COUNT) {
      break;
    }
  }
  return addressList;
}

/**
 * 输入框还是空时，填入记住的第一条地址。
 */
function fillRememberedDeliveryAddress() {
  if (isEmpty(deliveryAddress.value) !== true && isEmpty(deliveryAddress.value.trim()) !== true) {
    return;
  }
  if (isEmpty(deliveryAddressHistory.value)) {
    return;
  }
  deliveryAddress.value = deliveryAddressHistory.value[0];
}

/**
 * 把本次收货地址插到最前。已有相同地址先去掉，再只留 5 条。
 */
function rememberDeliveryAddress(addressText) {
  const trimmedAddress = isEmpty(addressText) ? '' : addressText.trim();
  if (isEmpty(trimmedAddress)) {
    return;
  }
  const nextAddressList = [trimmedAddress];
  for (let addressIndex = 0; addressIndex < deliveryAddressHistory.value.length; addressIndex += 1) {
    const historyAddress = deliveryAddressHistory.value[addressIndex];
    if (historyAddress === trimmedAddress) {
      continue;
    }
    nextAddressList.push(historyAddress);
    if (nextAddressList.length >= StoreDeliveryAddressHistory.MAX_COUNT) {
      break;
    }
  }
  deliveryAddressHistory.value = nextAddressList;
  try {
    window.localStorage.setItem(StoreDeliveryAddressHistory.STORAGE_KEY, JSON.stringify(nextAddressList));
  } catch {
    return;
  }
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
    url: ShopApi.LIST,
    method: 'GET',
    data: { shopType: ShopType.STORE },
  });
  currentShop.value = findShopByCode(shopList);
  if (isEmpty(currentShop.value)) {
    const toastTitle = isEmpty(shopCode.value) ? '缺少门店编号' : '门店不存在';
    showToast(toastTitle);
    categoryList.value = [];
    productList.value = [];
    return;
  }
  if (currentShop.value.status !== RecordStatus.ENABLED) {
    // 休息中的门店不拉商品，那些接口只接受启用门店
    categoryList.value = [];
    productList.value = [];
    await loadMemberProfile();
    return;
  }
  const shopId = currentShop.value.shopId;
  const [nextCategoryList, nextProductList] = await Promise.all([
    request({
      url: StoreApi.PRODUCT_CATEGORIES,
      method: 'GET',
      data: { shopId },
    }),
    request({
      url: StoreApi.PRODUCTS,
      method: 'GET',
      data: { shopId },
    }),
  ]);
  categoryList.value = nextCategoryList;
  productList.value = nextProductList;
  // 用已绑定会员的昵称和联系方式预填，已手改过的不覆盖
  await loadMemberProfile();
}

/**
 * 用会员资料预填收货人和联系方式。手机号带 +86 时去掉区号。请求失败时留空，仍可手填。
 */
async function loadMemberProfile() {
  let memberSummary = null;
  try {
    memberSummary = await request({ url: MemberApi.SUMMARY, method: 'GET' });
  } catch {
    return;
  }
  if (isEmpty(memberSummary)) {
    return;
  }
  if (isEmpty(receiverName.value) && isEmpty(memberSummary.nickname) !== true) {
    receiverName.value = memberSummary.nickname;
  }
  if (isEmpty(contact.value) && isEmpty(memberSummary.contact) !== true) {
    contact.value = nationalContactText(memberSummary.contact);
  }
}

/**
 * 下拉松开后刷新整页。门店、商品和订单都从第 1 页重新加载。
 */
async function refreshPage() {
  if (pageRefreshing.value === true) {
    return;
  }
  pageRefreshing.value = true;
  try {
    await loadPage();
    await loadMemberOrders(PageSetting.DEFAULT_PAGE);
  } finally {
    pageRefreshing.value = false;
  }
}

/**
 * 按页查询我的销售单。第一页替换列表，之后追加。空页时不再继续翻。
 */
async function loadMemberOrders(pageNumber) {
  // 1. 按页拉取当前会员的销售单
  const orderPage = await request({
    url: StoreApi.SALES,
    method: 'GET',
    data: { page: pageNumber, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
  });
  const nextList = isEmpty(orderPage) || isEmpty(orderPage.list) ? [] : orderPage.list;
  const nextTotal = isEmpty(orderPage) || isEmpty(orderPage.total) ? 0 : Number(orderPage.total);
  // 2. 第一页覆盖，后续页接到后面。这一页没有数据就停在已有条数
  if (pageNumber !== PageSetting.DEFAULT_PAGE && nextList.length === 0) {
    orderTotal.value = orderList.value.length;
    return;
  }
  if (pageNumber === PageSetting.DEFAULT_PAGE) {
    orderList.value = nextList;
  } else {
    orderList.value = orderList.value.concat(nextList);
  }
  orderTotal.value = Number.isFinite(nextTotal) ? nextTotal : orderList.value.length;
  orderPageNumber.value = pageNumber;
}

/**
 * 加载下一页订单。正在请求或已经到末页时不重复请求。
 */
async function loadMoreOrders() {
  if (orderLoading.value === true || orderList.value.length >= orderTotal.value) {
    return;
  }
  orderLoading.value = true;
  try {
    await loadMemberOrders(orderPageNumber.value + 1);
  } finally {
    orderLoading.value = false;
  }
}

/**
 * 评价后从第 1 页重新拉取并替换整表。
 */
async function refreshMemberOrders() {
  await loadMemberOrders(PageSetting.DEFAULT_PAGE);
}

/**
 * 按页查询当前门店评价。第一页替换列表，之后追加。空页时不再继续翻。
 */
async function loadShopReviews(pageNumber) {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.shopId)) {
    reviewList.value = [];
    reviewTotal.value = 0;
    reviewPageNumber.value = pageNumber;
    return;
  }
  // 1. 按页拉取当前门店评价
  const reviewPage = await request({
    url: ShopReviewApi.REVIEWS,
    method: 'GET',
    data: {
      shopId: currentShop.value.shopId,
      page: pageNumber,
      pageSize: PageSetting.DEFAULT_PAGE_SIZE,
    },
  });
  const nextList = isEmpty(reviewPage) || isEmpty(reviewPage.list) ? [] : reviewPage.list;
  const nextTotal = isEmpty(reviewPage) || isEmpty(reviewPage.total) ? 0 : Number(reviewPage.total);
  // 2. 第一页覆盖，后续页接到后面。这一页没有数据就停在已有条数
  if (pageNumber !== PageSetting.DEFAULT_PAGE && nextList.length === 0) {
    reviewTotal.value = reviewList.value.length;
    return;
  }
  if (pageNumber === PageSetting.DEFAULT_PAGE) {
    reviewList.value = nextList;
  } else {
    reviewList.value = reviewList.value.concat(nextList);
  }
  reviewTotal.value = Number.isFinite(nextTotal) ? nextTotal : reviewList.value.length;
  reviewPageNumber.value = pageNumber;
}

/**
 * 加载下一页评价。正在请求或已经到末页时不重复请求。
 */
async function loadMoreReviews() {
  if (reviewLoading.value === true || reviewList.value.length >= reviewTotal.value) {
    return;
  }
  reviewLoading.value = true;
  try {
    await loadShopReviews(reviewPageNumber.value + 1);
  } finally {
    reviewLoading.value = false;
  }
}

/**
 * 切换内容 Tab。进入订单或评价时重新拉取。
 */
async function selectContentTab(contentTab) {
  selectedContentTab.value = contentTab;
  if (contentTab === StoreContentTab.ORDER) {
    await loadMemberOrders(PageSetting.DEFAULT_PAGE);
  }
  if (contentTab === StoreContentTab.REVIEW) {
    await loadShopReviews(PageSetting.DEFAULT_PAGE);
  }
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
      pointDeductAmount: isEmpty(productRow.pointDeductAmount) ? '0' : productRow.pointDeductAmount,
      pointDeductPoints: isEmpty(productRow.pointDeductPoints) ? 0 : Number(productRow.pointDeductPoints),
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
    if (isEmpty(cartLineList.value)) {
      closeCartSheet();
    }
    return;
  }
  if (nextQuantity > cartLine.stockQuantity) {
    showToast('库存不足');
    return;
  }
  cartLine.quantity = nextQuantity;
}

/**
 * 读取当前会员积分余额，用来决定抵扣开关能不能点。
 */
async function loadPointsBalance() {
  try {
    const summary = await request({ url: PointApi.SUMMARY, method: 'GET' });
    const balanceText = isEmpty(summary) || isEmpty(summary.balance) ? '0' : summary.balance;
    const balanceNumber = Number(balanceText);
    pointsBalance.value = Number.isFinite(balanceNumber) === true ? Math.trunc(balanceNumber) : 0;
  } catch {
    pointsBalance.value = 0;
  }
}

/**
 * 打开结算层。打开前再读一次地址，避免进入页时 query 尚未就绪。
 */
function openCartSheet() {
  if (isEmpty(cartLineList.value)) {
    return;
  }
  usePointDeduct.value = pointPlan.value.enabled === true;
  void loadPointsBalance();
  // 结算时若地址仍空，先按当前 URL 预填，再没有才用记住的第一条。
  if (isEmpty(deliveryAddress.value) || isEmpty(deliveryAddress.value.trim())) {
    readDeliveryAddressFromQuery();
  }
  fillRememberedDeliveryAddress();
  formError.value = '';
  cartSheetOpen.value = true;
  lockPageScroll();
}

/**
 * 关闭结算层。
 */
function closeCartSheet() {
  cartSheetOpen.value = false;
  unlockPageScroll();
}

/**
 * 弹出安全密钥后提交购买。
 */
async function confirmSale() {
  if (submitting.value || isEmpty(currentShop.value) || isEmpty(cartLineList.value)) {
    return;
  }
  const receiverNameText = isEmpty(receiverName.value) ? '' : receiverName.value.trim();
  const contactText = isEmpty(contact.value) ? '' : contact.value.trim();
  const trimmedDeliveryAddress = isEmpty(deliveryAddress.value) ? '' : deliveryAddress.value.trim();
  if (isEmpty(receiverNameText) || isEmpty(contactText)) {
    formError.value = '请填写收货人和联系方式';
    return;
  }
  if (receiverNameText.length > HotelBookingGuest.NAME_MAX_LENGTH || contactText.length > HotelBookingGuest.CONTACT_MAX_LENGTH) {
    formError.value = '收货人或联系方式过长';
    return;
  }
  if (isEmpty(trimmedDeliveryAddress)) {
    formError.value = '请填写收货地址';
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
    showPageLoading();
    const paidItemCount = cartCount.value;
    const paidAmountText = sheetAmountText.value;
    const paidShopName = isEmpty(currentShop.value) ? '' : currentShop.value.shopName;
    await request({
      url: StoreApi.SALES,
      method: 'POST',
      data: {
        shopId: currentShop.value.shopId,
        cipherText: securityKeyCipherText,
        receiverName: receiverNameText,
        contact: contactText,
        deliveryAddress: trimmedDeliveryAddress,
        usePointDeduct: usePointDeduct.value === true && pointPlan.value.enabled === true,
        itemList: cartLineList.value.map((cartLine) => ({
          productId: cartLine.productId,
          quantity: cartLine.quantity,
        })),
      },
    });
    rememberDeliveryAddress(trimmedDeliveryAddress);
    cartLineList.value = [];
    closeCartSheet();
    successShopName.value = paidShopName;
    successItemCount.value = paidItemCount;
    successAmountText.value = paidAmountText;
    saleStep.value = StoreSaleStep.SUCCESS;
    await loadPage();
  } catch (error) {
    if (isEmpty(error) !== true && isEmpty(error.message) !== true) {
      formError.value = error.message;
    }
  } finally {
    submitting.value = false;
    hidePageLoading();
  }
}

/**
 * 查看订单时离开成功页，切到订单 Tab，并从第 1 页重新拉取。
 */
async function continueShopping() {
  saleStep.value = StoreSaleStep.LIST;
  await selectContentTab(StoreContentTab.ORDER);
}

onMounted(() => {
  readShopCode();
  deliveryAddressHistory.value = readDeliveryAddressHistory();
  readDeliveryAddressFromQuery();
  fillRememberedDeliveryAddress();
  loadPage();
});

onUnmounted(() => {
  unlockPageScroll();
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

// 路由 query 变化时同步收货地址（含从小程序码带入的 address）。
watch(
  () => currentRoute.query[StoreShopQuery.ADDRESS],
  () => {
    readDeliveryAddressFromQuery();
    fillRememberedDeliveryAddress();
  },
);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
}
.page-with-bar {
  padding-bottom: 88px;
}
.panel {
  position: relative;
  z-index: 1;
  margin-top: -18px;
  padding: 16px 12px 24px;
  border-radius: 22px 22px 0 0;
  background: #f5f6f8;
  --store-tab-bar-height: 40px;
}
.room-qr-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(20, 36, 28, 0.46);
}
.room-qr-card {
  box-sizing: border-box;
  width: min(280px, 100%);
  padding: 22px 18px;
  border-radius: 22px;
  background: #fff;
  text-align: center;
}
.room-qr-card p {
  margin: 0;
  color: #14241c;
  font-size: 16px;
  line-height: 1.6;
}
</style>
